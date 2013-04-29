<%@ WebHandler Language="C#" Class="RegisterInfo" %>

using System;
using System.Threading;
using System.Web;
using System.Web.Configuration;
using System.Collections.Generic;
using System.Linq;
using WNSModel;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Text;
using System.IO;
using System.Xml;
using System.Xml.Linq;
using System.Net.Mail;
using ogc.wns;

public class RegisterInfo : IHttpHandler
{
    private static readonly log4net.ILog log = log4net.LogManager.GetLogger(typeof(RegisterInfo));

    private static string baseUri = null;

    WNSEntities ctx = new WNSEntities();
    NOTIFICATIONTYPE _notificationType_Email;
    NOTIFICATIONTYPE notificationType_Email
    {
        get
        {
            if (_notificationType_Email == null)
                _notificationType_Email = ctx.NOTIFICATIONTYPEs.Single(r => r.NO == 1);
            return _notificationType_Email;
        }
    }
    static Uri _uriWNS;
    static Uri uriWNS
    {
        get
        {
            if (_uriWNS == null)
                _uriWNS = new Uri(WebConfigurationManager.AppSettings["WNSLink"]);
            return _uriWNS;
        }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "text/plain";
        string result = "";
        var op = context.Request["op"].ToLower();
        try
        {
            switch (op)
            {
                case "registeruser":
                    result = registerUser(context);
                    break;
                case "getuser":
                    result = getUser(context.Request["email"]);
                    if (ctx.ObjectStateManager.GetObjectStateEntries(System.Data.EntityState.Added).Count() > 0)
                        ctx.SaveChanges();
                    break;
                case "subscribe":
                    result = subscribe(context);
                    break;
                case "getnotificationtype":
                    result = GetNotificationType();
                    break;
                case "getfrequencyunit":
                    result = GetFrequencyUnit();
                    break;
                case "unsubscribe":
                    result = unsubscribe(context);
                    break;
                case "poifurtherprocess":
                    if (baseUri == null)
                        baseUri = new Uri(context.Request.Url, context.Request.ApplicationPath).ToString();
                    if (IsProcessPoiStart) result = "It is already in processing";
                    else
                    {
                        result = "Poi Further Process Start...";
                        Thread thread = null;
                        IsProcessPoiStart = true;
                        try
                        {
                            thread = new Thread(new ThreadStart(ProcessPoi));
                            thread.Start();
                        }
                        catch (Exception e)
                        {
                            IsProcessPoiStart = false;
                            if (thread != null && thread.IsAlive)
                                thread.Abort();
                            log.Error("PoiFurtherProcess is failed to start", e);
                        }
                    }
                    break;
                case "getusersubscription":
                    if (String.IsNullOrWhiteSpace(context.Request["email"]))
                    {
                        result = DefaultJsonSerializer(new ResponseMessage("RequestFormatError", "The parameter value of email is missing."));
                    }
                    else
                    {
                        result = getUserSubcription(context.Request["email"]);
                    }
                    break;
                default:
                    result = DefaultJsonSerializer(new ResponseMessage("InvalidRequest", "The parameter value of op is invalid."));
                    break;
            }
        }
        catch (BrokerServiceException e)
        {
            result = DefaultJsonSerializer(new ResponseMessage(e.Code, e.Message));
        }
        catch (Exception e)
        {
            result = DefaultJsonSerializer(new ResponseMessage("SystemError", null));
        }
        context.Response.Write(result);
    }

    /// <summary>
    /// Registering a user with email and user role.
    /// If the email of the user exists, the user information will be updated.
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    private String registerUser(HttpContext context)
    {
        context.Request.InputStream.Position = 0;
        String strData = new StreamReader(context.Request.InputStream).ReadToEnd();
        RegisterUser request;
        try
        {
            request = JsonConvert.DeserializeObject<RegisterUser>(strData);
        }
        catch (Exception e)
        {
            throw new BrokerServiceException("RequestFormatError", "Json data format parsing failed!!");
        }

        if (String.IsNullOrWhiteSpace(request.email))
        {
            throw new BrokerServiceException("RequestFormatError", "Email should be set.");
        }

        var user = registerEmail(request.email);
        try
        {
            user.ROLE = ((char)Util.toEnum<UserRoleEnum>(request.role)).ToString();
            ctx.SaveChanges(System.Data.Objects.SaveOptions.AcceptAllChangesAfterSave);
        }
        catch (ArgumentException e)
        {
            throw new BrokerServiceException("RequestFormatError", "The value of role is invalid.");
        }
        return JsonConvert.SerializeObject(request);
    }

    private String getUser(String email)
    {
        if (String.IsNullOrWhiteSpace(email))
        {
            throw new BrokerServiceException("RequestFormatError", "Email should be set.");
        }
        var user = registerEmail(email);
        RegisterUser res = new RegisterUser()
        {
            email = user.EMAIL,
            role = ((UserRoleEnum)user.ROLE[0]).ToString()
        };
        return DefaultJsonSerializer(res);
    }

    private string getUserSubcription(String email)
    {
        List<SubscribeContent> SubscribeContents = new List<SubscribeContent>();
        REGISTER user = ctx.REGISTERs.SingleOrDefault(r => r.EMAIL == email.ToLower());
        if (user == null)
        {
            return JsonConvert.SerializeObject(new ResponseMessage()
            {
                code = "UserNotFound",
                message = "The email is not registered yet."
            });
        }
        user.REGISTER_POI.Load();
        foreach (var poi in user.REGISTER_POI)
        {
            SubscribeContents.Add(new SubscribeContent()
            {
                email = email,
                poiID = poi.SEQ,
                poiType = poi.POI_TYPE,
                lat = poi.POI_TYPE == "P" ? poi.LAT.Value : (double?)null,
                lng = poi.POI_TYPE == "P" ? poi.LNG.Value : (double?)null,
                stationID = poi.POI_TYPE == "S" ? poi.STATION_ID : null,
                swFlowThreshold = poi.SW_FLOW_THRESHOLD,
                swFlowThresholdUnit = poi.SW_FLOW_THRESHOLD_UNIT,
                swLevelThreshold = poi.SW_LEVEL_THRESHOLD,
                swLevelThresholdUnit = poi.SW_LEVEL_THRESHOLD_UNIT,
                frequency = poi.FREQUENCY,
                status = ((RegisterPoiStatusEnum)poi.STATUS).ToString()
            });
        };
        return DefaultJsonSerializer(SubscribeContents);
    }

    private string subscribe(HttpContext context)
    {
        SubcribeResponse response = new SubcribeResponse();

        context.Request.InputStream.Position = 0;
        String strData = new StreamReader(context.Request.InputStream).ReadToEnd();
        SubscribeContent[] requests;
        try
        {
            requests = JsonConvert.DeserializeObject<SubscribeContent[]>(strData);
        }
        catch (Exception e)
        {
            response.code = "RequestFormatError";
            response.message = "Json data format parsing failed!!";
            return JsonConvert.SerializeObject(response);
        }

        String result;
        if (requests.Any(r => String.IsNullOrWhiteSpace(r.email)))
        {
            response.code = "RequestFormatError";
            response.message = "Emails of subscription requests should be set.";
            return JsonConvert.SerializeObject(response);
        }

        try
        {
            var poiList = subscribePOIs(requests);
            if (response.code == null)
            {
                ctx.SaveChanges(System.Data.Objects.SaveOptions.AcceptAllChangesAfterSave);
                for (int i = 0; i < requests.Length; i++)
                {
                    requests[i].poiID = poiList[i].SEQ;
                    requests[i].status = ((RegisterPoiStatusEnum)poiList[i].STATUS).ToString();
                }
                response.code = "Success";
                response.poiIDs = poiList.Select(r => r.SEQ).ToArray();
            }
        }
        catch (BrokerServiceException e)
        {
            response.code = e.Code;
            response.message = e.Message;
        }
        catch (Exception e)
        {
            response.code = "SystemError";
        }
        result = JsonConvert.SerializeObject(requests, Newtonsoft.Json.Formatting.Indented, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore });
        return result;
    }


    /// <summary>
    /// subscribe user's thresholds basing on positions.
    /// if the poi exists, update its thresholds.
    /// </summary>
    /// <param name="uid"></param>
    /// <param name="dnLatLngs"></param>
    /// <param name="sw_wate_threshold"></param>
    /// <param name="sw_flow_threshold"></param>
    /// <param name="notificationType"></param>
    /// <returns></returns>
    public List<REGISTER_POI> subscribePOIs(SubscribeContent[] requests)
    {
        List<REGISTER_POI> listPoi = new List<REGISTER_POI>();
        for (int i = 0; i < requests.Length; i++)
        {
            var request = requests[i];
            REGISTER user = registerEmail(request.email);
            // load user.REGISTER_POI
            if (!user.REGISTER_POI.IsLoaded && user.EntityState != System.Data.EntityState.Added)
                user.REGISTER_POI.Load();
            listPoi.Add(subscribePOI(user, request));
            request.poiType = listPoi.Last().POI_TYPE;
        }
        return listPoi;
    }

    /// <summary>
    /// subscribe a poi for a user
    /// </summary>
    /// <param name="user"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    public REGISTER_POI subscribePOI(
        REGISTER user,
        SubscribeContent request)
    {
        WaterLevelUnitEnum _waterLevelUnit = default(WaterLevelUnitEnum);
        WaterLevelUnitEnum? waterLevelUnit = null;
        if (request.swLevelThreshold.HasValue)
        {
            if (Enum.TryParse<WaterLevelUnitEnum>(request.swLevelThresholdUnit, true, out _waterLevelUnit))
                waterLevelUnit = _waterLevelUnit;
            else
                throw new BrokerServiceException("RequestFormatError", "Surface level threshold unit can be not recognize.");
        }
        WaterFlowUnitEnum _waterFlowUnit;
        WaterFlowUnitEnum? waterFlowUnit = null;
        if (request.swLevelThreshold.HasValue)
        {
            if (Enum.TryParse<WaterFlowUnitEnum>(request.swFlowThresholdUnit, true, out _waterFlowUnit))
                waterFlowUnit = _waterFlowUnit;
            else
                throw new BrokerServiceException("RequestFormatError", "Surface flow threshold unit can be not recognize.");
        }
        return new REGISTER_POI()
        {
            POI_TYPE = String.IsNullOrEmpty(request.stationID) ? "P" : "S",
            REGISTER = user,
            SEQ = user.REGISTER_POI.Max(r => r.SEQ) + 1,
            STATION_ID = request.stationID,
            LAT = request.lat,
            LNG = request.lng,
            FREQUENCY = request.frequency,
            SW_FLOW_THRESHOLD = request.swFlowThreshold,
            SW_FLOW_THRESHOLD_UNIT = waterFlowUnit.HasValue ? waterFlowUnit.ToString() : null,
            SW_LEVEL_THRESHOLD = request.swLevelThreshold,
            SW_LEVEL_THRESHOLD_UNIT = waterLevelUnit.HasValue ? waterLevelUnit.ToString() : null,
            STATUS = (byte)RegisterPoiStatusEnum.Pending
        };
    }

    /// <summary>
    /// If the user do not exist, register a new user and send registration to WNS.
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    private REGISTER registerEmail(string email)
    {
        REGISTER user = ctx.REGISTERs.Where(x => x.EMAIL == email.ToLower()).FirstOrDefault();
        if (user == null)
        {
            user = ctx.ObjectStateManager.GetObjectStateEntries(System.Data.EntityState.Added).Select(r => r.Entity).OfType<REGISTER>().SingleOrDefault(r => r.EMAIL == email.ToLower());
        }
        if (user == null)
        {
            WebRequest request = WebRequest.Create(uriWNS);
            request.Method = "POST";
            request.ContentType = "application/xml";

            string postString = string.Format("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<wns:RegisterUser xmlns:wns=\"http://www.opengis.net/wns\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" Version=\"0.0.1\" Service=\"WNS\">"
                + "<wns:Name>{0}</wns:Name>"
                + "<wns:CommunicationProtocol>"
                + "<wns:Email>{0}</wns:Email>"
                + "</wns:CommunicationProtocol>"
                + "</wns:RegisterUser>", email);

            RegisterUserResponseType response;
            try
            {
                var reader = WnsNotificationTool.sendToWNS(postString);
                if (Serializers.GetSerializer<RegisterUserResponseType>().CanDeserialize(reader))
                {
                    response = Serializers.Deserialize<RegisterUserResponseType>(reader);
                }
                else
                {
                    var exception = Serializers.Deserialize<ogc.service.ServiceExceptionReport>(reader);
                    return null;
                }
            }
            catch (Exception e)
            {
                if (user == null) throw new BrokerServiceException("RegisterWNSFail", email + " registered to WNS is falied.");
                return null;
            }

            user = new REGISTER()
            {
                UID = (long)response.UserID,
                EMAIL = email.ToLower(),
                NOTIFICATIONTYPE = notificationType_Email,
                ROLE = ((char)UserRoleEnum.Normal).ToString()
            };
            ctx.AddToREGISTERs(user);
        }
        return user;
    }

    public String unsubscribe(HttpContext context)
    {
        context.Request.InputStream.Position = 0;
        String strData = new StreamReader(context.Request.InputStream).ReadToEnd();
        long[] arlID = null;
        ResponseMessage response = new ResponseMessage();
        try
        {
            arlID = JsonConvert.DeserializeObject<long[]>(strData);
        }
        catch (Exception e)
        {
            response.code = "RequestFormatError";
            response.message = "Json data format parsing failed!!";
            return JsonConvert.SerializeObject(response);
        }

        String email = context.Request["email"];
        if (String.IsNullOrWhiteSpace(email))
        {
            response.code = "RequestFormatError";
            response.message = "Emails of subscription requests should be set.";
            return JsonConvert.SerializeObject(response);
        }
        var arPoi = (from poi in ctx.REGISTER_POI
                     where poi.REGISTER.EMAIL == email
                     && arlID.Contains(poi.SEQ)
                     select poi).ToArray();
        if (arPoi.Length == 0)
        {
            response.code = "DataNofFound";
            response.message = "There are no data matched.";
            return JsonConvert.SerializeObject(response);
        }
        ctx.Connection.Open();
        var trans = ctx.Connection.BeginTransaction();
        try
        {
            foreach (var poi in arPoi)
            {
                //poi.REGISTER_STATION.Load();
                //poi.REGISTER_STATION.Clear();
                ctx.DeleteObject(poi);
            }
            ctx.SaveChanges();
            trans.Commit();
        }
        catch (Exception e)
        {
            trans.Rollback();
            trans.Dispose();
            throw e;
        }
        response.code = "Success";
        response.message = "Poi id (" + String.Join(",", arPoi.Select(r => r.SEQ.ToString()).ToArray()) + ") has been unsubscribed.";
        return JsonConvert.SerializeObject(response);
    }


    private static bool IsProcessPoiStart = false;

    private static void ProcessPoi()
    {
        try
        {
            log.Info("Further process of registered POI start...");
            WNSEntities ctx = new WNSEntities();
            // check pending poi for getting upstream stations
            var arPoi = (from thePoi in ctx.REGISTER_POI
                         where thePoi.STATUS == (byte)RegisterPoiStatusEnum.Pending
                         select thePoi).ToArray();
            foreach (var poi in arPoi)
            {
                try
                {
                    if (poi.POI_TYPE == "P")
                    {
                        addUpstreamStation(poi, ctx);
                    }
                    else if (poi.POI_TYPE == "S")
                    {
                        if (concurWithStation(poi.STATION_ID, ctx))
                        {
                            if (ctx.STATIONs.Any(r => r.STATION_ID == poi.STATION_ID))
                            {
                                poi.STATUS = (byte)RegisterPoiStatusEnum.Valid;
                                poi.REGISTER_STATION.Add(new REGISTER_STATION()
                                {
                                    SEQ = 0,
                                    STATION_ID = poi.STATION_ID
                                });
                            }
                            else
                            {
                                poi.STATUS = (byte)RegisterPoiStatusEnum.Invalid;
                            }
                        }
                    }
                    if (poi.STATUS == (byte)RegisterPoiStatusEnum.Valid)
                    {
                        poi.SW_FLOW_THRESHOLD_METRIC = poi.SW_FLOW_THRESHOLD * (poi.SW_FLOW_THRESHOLD_UNIT == "CubicFeetPerSecond" ? 2446.5755455488 : 1);
                        poi.SW_LEVEL_THRESHOLD_METRIC = poi.SW_LEVEL_THRESHOLD * (poi.SW_LEVEL_THRESHOLD_UNIT == "Feet" ? 0.3048 : 1);
                    }
                    ctx.SaveChanges(System.Data.Objects.SaveOptions.AcceptAllChangesAfterSave);
                    if (!poi.REGISTERReference.IsLoaded) poi.REGISTERReference.Load();
                    log.Info(poi.REGISTER.EMAIL + " registered at " 
                        + (poi.POI_TYPE == "P" ? poi.LAT + "," + poi.LNG : poi.STATION_ID)
                        + " has gotten relative info. The registering is " + ((RegisterPoiStatusEnum)poi.STATUS).ToString());
                }
                catch (Exception e)
                {
                    log.Error("poi process error", e);
                }
            }
            // get unnotification register poi for send validating message
            arPoi = (from thePoi in ctx.REGISTER_POI
                     where thePoi.STATUS != (byte)RegisterPoiStatusEnum.Pending && (thePoi.NOTIFICATION_FLAG == 0 || thePoi.NOTIFICATION_FLAG == 2)
                     select thePoi).ToArray();
            foreach (var poi in arPoi)
            {
                try
                {
                    if (!poi.REGISTER_STATION.IsLoaded) poi.REGISTER_STATION.Load();
                    var parameters = new Dictionary<string, object>()
                    {
                        {"poiType",poi.POI_TYPE},
                        {"frequency",poi.FREQUENCY},
                        {"stationID",poi.STATION_ID},
                        {"lat",poi.LAT},
                        {"lng", poi.LNG},
                        {"status", ((RegisterPoiStatusEnum)poi.STATUS).ToString()},
                        {"stationNumber", poi.REGISTER_STATION.Count}
                    };
                    if (poi.SW_LEVEL_THRESHOLD != null)
                    {
                        parameters.Add("swLevelThreshold", poi.SW_LEVEL_THRESHOLD.Value);
                        parameters.Add("swLevelThresholdUnit", poi.SW_LEVEL_THRESHOLD_UNIT);
                    }
                    if (poi.SW_FLOW_THRESHOLD != null)
                    {
                        parameters.Add("swFlowThreshold", poi.SW_FLOW_THRESHOLD.Value);
                        parameters.Add("swFlowThresholdUnit", Util.getDescription<WaterFlowUnitEnum>(poi.SW_FLOW_THRESHOLD_UNIT));
                    }
                    if (!poi.REGISTERReference.IsLoaded)poi.REGISTERReference.Load();
                    if (WnsNotificationTool.doNotification(poi.REGISTER.UID, parameters))
                    {
                        log.Info("The confirm email of " + poi.REGISTER.EMAIL + " registering at "
                            + (poi.POI_TYPE == "P" ? poi.LAT + "," + poi.LNG : poi.STATION_ID)
                            + " has been sent.");
                        poi.NOTIFICATION_FLAG |= 0x01;
                        ctx.SaveChanges(System.Data.Objects.SaveOptions.AcceptAllChangesAfterSave);
                    }
                }
                catch (Exception e)
                {
                    log.Error("There is error happend in dealing with the poi[" + poi.REGISTER_NO + "," + poi.SEQ + "].", e);
                }
            }
            log.Info("Further process of registered POI is done.");
        }
        catch (Exception ee)
        {
            log.Error("There is error happend in ProcessPoi.", ee);
        }
        IsProcessPoiStart = false;
    }

    static bool concurWithStation(String sStationID, WNSEntities ctx)
    {
        var station = ctx.STATIONs.SingleOrDefault(r => r.STATION_ID == sStationID);
        if (station == null)
        {
            try
            {
                WebRequest req = HttpWebRequest.Create(baseUri + "/Broker/GetCoordinate.ashx?op=getCoordinate&id=" + sStationID + "&src=" + (sStationID.StartsWith("ca") ? "nrcan" : "usgs"));
                StreamReader reader = new StreamReader(req.GetResponse().GetResponseStream());
                var ret = reader.ReadToEnd();
                reader.Dispose();
                return ret == "ok";
            }
            catch (Exception e)
            {
                log.Error("", e);
                return false;
            }
        }
        return true;
    }

    /// <summary>
    /// get all station base on a position via WPS, and add stations into poi
    /// </summary>
    /// <param name="dnLngLat">a position [longitude, latitude]</param>
    /// <param name="poi">poi set by user</param>
    static public void addUpstreamStation(REGISTER_POI poi, WNSEntities ctx)
    {
        // get all station with a position 
        Uri uri = new Uri(String.Format(WebConfigurationManager.AppSettings["WPSLink"], "" + poi.LAT.Value, "" + poi.LNG.Value));
        WebClient client = new WebClient();
        String result = client.DownloadString(uri);

        XmlDocument xmlDoc = new XmlDocument();
        xmlDoc.LoadXml(result);
        var streams = xmlDoc.SelectNodes("//Stream");
        int idx = 0;
        double min_lng = 180, min_lat = 180, max_lng = -180, max_lat = -180;
        double dnTmp;
        foreach (XmlNode stream in streams)
        {
            String streamName = stream.SelectSingleNode("name").InnerText;
            if (streamName.Equals("none", StringComparison.CurrentCultureIgnoreCase)) streamName = null;
            var stations = stream.SelectNodes(".//Stations/Station");
            foreach (XmlNode station in stations)
            {
                concurWithStation(station.InnerText, ctx);
                poi.REGISTER_STATION.Add(new REGISTER_STATION()
                {
                    SEQ = idx++,
                    UPSTREAM = streamName,
                    STATION_ID = station.InnerText
                });
                if (double.TryParse(station.Attributes["longitude"].Value, out dnTmp))
                {
                    if (dnTmp < min_lng) min_lng = dnTmp;
                    else if (dnTmp > max_lng) max_lng = dnTmp;
                }
                if (double.TryParse(station.Attributes["latitude"].Value, out dnTmp))
                {
                    if (dnTmp < min_lat) min_lat = dnTmp;
                    else if (dnTmp > max_lat) max_lat = dnTmp;
                }
            }
        }
        if (poi.REGISTER_STATION.Count > 0)
        {
            poi.MIN_LAT = min_lat;
            poi.MIN_LNG = min_lng;
            poi.MAX_LAT = max_lat;
            poi.MAX_LNG = max_lng;
            poi.STATUS = (byte)RegisterPoiStatusEnum.Valid;
        }
        else
        {
            poi.STATUS = (byte)RegisterPoiStatusEnum.Invalid;
        }
    }

    static void client_DownloadStringCompleted(object sender, DownloadStringCompletedEventArgs e)
    {
        if (e.Error != null) return;
        long[] keys = (long[])e.UserState;
        long regster_no = keys[0];
        long poi_seq = keys[1];
        WNSEntities ctx = new WNSEntities();
        REGISTER_POI poi = (from thePoi in ctx.REGISTER_POI
                            where thePoi.REGISTER_NO == regster_no && thePoi.SEQ == poi_seq
                            select thePoi).Single();
    }


    /// <summary>
    /// get notification type(ex:RSS、ATOM、EMAIL)
    /// </summary>
    /// <returns></returns>
    public string GetNotificationType()
    {
        WNSEntities ctx = new WNSEntities();
        System.Data.DataTable DT = ctx.NOTIFICATIONTYPEs.ToDataTable();
        DT = DT.DefaultView.ToTable(true, new String[] { "TYPE" });
        return JsonConvert.SerializeObject(DT, Newtonsoft.Json.Formatting.Indented);
    }

    /// <summary>
    /// get notitfication frequency unit (ex:month、day...)
    /// </summary>
    /// <returns></returns>
    public string GetFrequencyUnit()
    {
        WNSEntities ctx = new WNSEntities();
        System.Data.DataTable DT = ctx.FREQUENCies.ToDataTable();
        DT = DT.DefaultView.ToTable(true, new String[] { "FREQUENCY_UNIT" });
        return JsonConvert.SerializeObject(DT, Newtonsoft.Json.Formatting.Indented);
    }

    private static readonly JsonSerializerSettings DefaultJsonSerializerSettings = new JsonSerializerSettings() { MissingMemberHandling = MissingMemberHandling.Ignore, NullValueHandling = NullValueHandling.Ignore };
    private static String DefaultJsonSerializer<T>(T obj)
    {
        return JsonConvert.SerializeObject(obj, Newtonsoft.Json.Formatting.None, DefaultJsonSerializerSettings);
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

    public class BrokerServiceException : Exception
    {
        public String Code
        {
            get;
            private set;
        }
        public BrokerServiceException(String code, String message)
            : base(message)
        {
            Code = code;
        }
    }

}

