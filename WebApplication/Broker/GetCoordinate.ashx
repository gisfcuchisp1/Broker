<%@ WebHandler Language="C#" Class="GetCoordinate" %>

using System;
using System.Web;
using WNSModel;
using System.Net;
using System.IO;
using System.Xml;
using System.Collections.Generic;
using System.Linq;

public class GetCoordinate : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        string result = "";
        if (context.Request["op"].Equals("getCoordinate", StringComparison.OrdinalIgnoreCase))
        {
            result = getCoordinate(context);
        }
        context.Response.Write(result);
    }
    private string getCoordinate(HttpContext context)
    {
        string stationid = context.Request["id"];
        string source = context.Request["src"];
        string request_link = "";
        string result_str = "";
        try
        {
            if (source.Equals("nrcan", StringComparison.OrdinalIgnoreCase))
            {
                request_link = "http://198.103.103.7/GinService/sos?REQUEST=GetFeatureOfInterest&VERSION=2.0.0&SERVICE=SOS&featureOfInterest=";
            }
            else if (source.Equals("usgs", StringComparison.OrdinalIgnoreCase))
            {
                request_link = "http://webvastage6.er.usgs.gov/ogc-swie/wfs?request=GetFeature&featureId=";
            }
            request_link = request_link + stationid.Replace("USGS.","");

            HttpWebRequest request = WebRequest.Create(request_link) as HttpWebRequest;
            request.Method = "Get";
            request.ContentType = "application/xml";
            request.Accept = "text/plain";

            request.UseDefaultCredentials = true;


            WebResponse resp = request.GetResponse();
            StreamReader responseReader = new StreamReader(resp.GetResponseStream());
            string result = responseReader.ReadToEnd().Trim();
            responseReader.Close();
            resp.Close();

            XmlDocument doc = new XmlDocument();
            doc.LoadXml(result);
            XmlNamespaceManager nameSpace = new XmlNamespaceManager(doc.NameTable);
            nameSpace.AddNamespace("wfs", "http://www.opengis.net/wfs/2.0");
            nameSpace.AddNamespace("om", "http://www.opengis.net/om/2.0");
            nameSpace.AddNamespace("wml2", "http://www.opengis.net/waterml/2.0");
            nameSpace.AddNamespace("sams", "http://www.opengis.net/samplingSpatial/2.0");
            nameSpace.AddNamespace("gml", "http://www.opengis.net/gml/3.2");
            nameSpace.AddNamespace("sos", "http://www.opengis.net/sos/2.0");
            XmlNode node;
            string station_source_type="";
            if (source.Equals("nrcan", StringComparison.OrdinalIgnoreCase))
            {
                node = doc.SelectSingleNode("/sos:GetFeatureOfInterestResponse/sos:featureMember/sams:SF_SpatialSamplingFeature/sams:shape/gml:Point/gml:pos", nameSpace);
                station_source_type="C";
            }
            else {
                node = doc.SelectSingleNode("/wfs:FeatureCollection/wfs:member/om:featureOfInterest/wml2:WaterMonitoringPoint/sams:shape/gml:Point/gml:pos", nameSpace);
                station_source_type="U";
            }

            if (node != null)
            {
                string coord = node.InnerText.Trim();
            }
            string[] xy = node.InnerText.Trim().Split(new string[] { " " }, StringSplitOptions.RemoveEmptyEntries);
            double x = Convert.ToDouble(xy[1]);
            double y = Convert.ToDouble(xy[0]);

            WNSEntities ctx = new WNSEntities();
            IEnumerable<REGISTER_POI> POI = ctx.REGISTER_POI.Where(k => k.STATION_ID == stationid);
            foreach (REGISTER_POI item in POI)
            {
                item.LAT = y;
                item.LNG = x;
            }
            STATION STATION_POI = ctx.STATIONs.Where(k => k.STATION_ID == stationid).FirstOrDefault();

            Boolean bol = false;
            if (STATION_POI ==null) {
                STATION_POI = new STATION();
                bol = true;
                STATION_POI.LAST_UPDATE_TIME = DateTime.Now;
            }

            STATION_POI.STATION_ID = stationid;
            STATION_POI.STATION_TYPE = station_source_type;
            STATION_POI.LAT = y;
            STATION_POI.LNG = x;

            if (bol) {
                ctx.AddToSTATIONs(STATION_POI);
            }
            
            ctx.SaveChanges();
            result_str = "ok";
        }
        catch (Exception ex)
        {
            result_str = "error";
        }
        return result_str;
    }
    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}