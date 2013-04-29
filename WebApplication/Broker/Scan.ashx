<%@ WebHandler Language="C#" Class="Scan" %>

using System;
using System.Net;
using System.IO;
using System.Web;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using WNSModel;

public class Scan : IHttpHandler
{
    private static readonly log4net.ILog log = log4net.LogManager.GetLogger(typeof(Scan));

    private static string baseUri = null;

    WNSEntities ctx = new WNSEntities();
    public void ProcessRequest(HttpContext context)
    {
        if (baseUri == null)
            baseUri = new Uri(context.Request.Url, context.Request.ApplicationPath).ToString();
        var op = context.Request["op"].ToLower();
        string result = "";
        switch (op)
        {
            case "measurecheck":
                IEnumerable<MONITORDATA> MData = ctx.MONITORDATAs.OrderBy(x => x.UPSTREAM);//monitor data
                List<NotificationTempStruct> doNotificationCollection = new List<NotificationTempStruct>();
                foreach (USER userinfo in ctx.USERs)
                {//scan
                    /*
                    IEnumerable<REGISTER> personalInfo = ctx.REGISTERs.Where(x => x.UID == userinfo.UID).OrderBy(x => x.UPSTREAM);
                    foreach (REGISTER rmeta in personalInfo)
                    {
                        foreach (MONITORDATA mdata in MData)
                        {
                            if ((rmeta.UPSTREAM == mdata.UPSTREAM) && (rmeta.THRESHOLD < mdata.VALUE))
                            {
                                NotificationTempStruct result = new NotificationTempStruct();
                                result.UID = userinfo.UID;
                                result.EMAIL=userinfo.EMAIL;
                                result.THRESHOLD=rmeta.THRESHOLD;
                                result.MONITORVALUE=mdata.VALUE;
                                result.STATIONID=mdata.SITEID;
                                result.UPSTREAM=mdata.UPSTREAM;
                                doNotificationCollection.Add(result);
                            }
                        }
                    }
                     */
                }
                result = JsonConvert.SerializeObject(doNotificationCollection, Formatting.Indented);
                break;
            case "gainmeasuredata":
                if (IsGainMeasureDataStart)
                {
                    result = "It is already in processing.";
                }
                else
                {
                    result = "Gain Measure Values Start...";
                    System.Threading.Thread thread = null;
                    IsGainMeasureDataStart = true;
                    try
                    {
                        thread = new System.Threading.Thread(new System.Threading.ThreadStart(GainMeasureData));
                        thread.Start();
                    }
                    catch (Exception e)
                    {
                        IsGainMeasureDataStart = false;
                        if (thread != null && thread.IsAlive)
                            thread.Abort();
                        log.Error("GainMeasureData is failed to start.", e);
                    }
                }
                break;
            case "notifyformeasureupdating":
                // uuid=&stationID=
                result = notifyForMeasureUpdating(context);
                // result = "{\"code\":\"ERROR\"}";
                break;
            default:
                result = "";
                break;
        }
        context.Response.ContentType = "text/plain";
        context.Response.Write(result);
    }

    private static bool IsGainMeasureDataStart = false;

    private static void GainMeasureData()
    {
        log.Info("Gain Measure Values start...");
        WNSEntities ctx = new WNSEntities();
        var ungainStations = (from flag in ctx.STATION_UPDATE_FLAG
                              where flag.HAS_NEW_DATA == true
                              select new { flag, flag.STATION }).ToArray();
        foreach (var ungainStation in ungainStations)
        {
            log.Info("Gaining measure data : " + ungainStation.flag.UUID);
            // ungainStation.STATION is impossible to be null.
            if (CSWCommunicator.GainStationMeasureDataByUUID(ungainStation.flag.UUID, ungainStation.STATION))
            {
                if (ungainStation.STATION.EntityState == System.Data.EntityState.Modified)
                {
                    ungainStation.flag.HAS_NEW_DATA = false;
                }
                else
                {
                    log.Warn("Gaining measure data is failed or data is invalid when this record uuid is " + ungainStation.flag.UUID);
                }
                ctx.SaveChanges(System.Data.Objects.SaveOptions.AcceptAllChangesAfterSave);
            }
            else
            {
                ctx.Refresh(System.Data.Objects.RefreshMode.StoreWins, ungainStation.flag);
            }
        }
        IsGainMeasureDataStart = false;
        log.Info("Gain Measure Values finished.");

        log.Info("Calling checkMeasureValue...");
        WebRequest req = HttpWebRequest.Create(baseUri + "/Broker/ObservationEventService.ashx?op=checkMeasureValue");
        StreamReader reader = new StreamReader(req.GetResponse().GetResponseStream());
        log.Info("Response of checkMeasureValue -- " + reader.ReadToEnd());
        reader.Dispose();

    }

    private string notifyForMeasureUpdating(HttpContext context)
    {
        var uuid = context.Request["uuid"];
        var stationID = context.Request["stationID"];
        if (uuid.Trim().Length == 0)
        {
            return "{'code': 'No uuid'}";
        }
        if (stationID.Trim().Length == 0)
        {
            return "{'code':'No stationID'}";
        }
        var updateFlag = ctx.STATION_UPDATE_FLAG.SingleOrDefault(tt => tt.UUID == uuid);
        if (updateFlag == null)
        {
            var station = ctx.STATIONs.SingleOrDefault(r => r.STATION_ID == stationID);
            if (station == null)
            {
                station = new STATION()
                {
                    STATION_ID = stationID,
                    STATION_TYPE = stationID.StartsWith("ca", StringComparison.CurrentCultureIgnoreCase) ? "C" : "U",
                    LAST_UPDATE_TIME = default(DateTime)
                };
            }
            updateFlag = new STATION_UPDATE_FLAG()
            {
                UUID = uuid,
                STATION = station,
                HAS_NEW_DATA = true,
                UPDATETIME = DateTime.Now
            };
            ctx.AddToSTATION_UPDATE_FLAG(updateFlag);
            log.Info("Calling " + baseUri + "/Broker/GetCoordinate.ashx?op=getCoordinate&id=" + stationID + "&src=" + (station.STATION_TYPE == "C" ? "nrcan" : "usgs"));
            WebRequest req = HttpWebRequest.Create(baseUri + "/Broker/GetCoordinate.ashx?op=getCoordinate&id=" + stationID + "&src=" + (station.STATION_TYPE == "C" ? "nrcan" : "usgs"));
            req.Method = "GET";
            var res = new StreamReader(req.GetResponse().GetResponseStream()).ReadToEnd();
            log.Info("New Station(" + station.STATION_ID + ") called GetCoordinate.ashx getting response [" + res + "]");
        }
        else
        {
            updateFlag.HAS_NEW_DATA = true;
            updateFlag.UPDATETIME = DateTime.Now;
        }
        ctx.SaveChanges(System.Data.Objects.SaveOptions.AcceptAllChangesAfterSave);
        return "{\"code\":\"OK\"}";
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
    public class NotificationTempStruct
    {
        public long UID { get; set; }
        public string EMAIL { get; set; }
        public double THRESHOLD { get; set; }
        public double MONITORVALUE { get; set; }
        public string STATIONID { get; set; }
        public string UPSTREAM { get; set; }
    }
}