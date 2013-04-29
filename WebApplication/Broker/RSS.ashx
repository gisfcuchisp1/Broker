<%@ WebHandler Language="C#" Class="RSS" %>

using System;
using System.Web;
using System.ServiceModel.Syndication;
using System.Xml;
using System.Text;
using WNSModel;
using System.Collections.Generic;
using System.Linq;
public class RSS : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "text/xml";

        string email = context.Request["email"].ToLower();
        string notificationtype = context.Request["type"];
        if (string.IsNullOrEmpty(notificationtype)) notificationtype = "rss";

        WNSEntities ctx = new WNSEntities();

        var alert = (from poi in ctx.REGISTER_POI
                     where poi.REGISTER.EMAIL == email
                        && (from regStation in poi.REGISTER_STATION
                            join station in ctx.STATIONs on regStation.STATION_ID equals station.STATION_ID
                            select new { station, regStation }
                            ).Any(t => t.station.SW_FLOW >= poi.SW_FLOW_THRESHOLD_METRIC || t.station.SW_LEVEL >= poi.SW_LEVEL_THRESHOLD_METRIC)
                     select poi).ToArray();


        List<SyndicationItem> itemcollection = new List<SyndicationItem>();
        List<STATION> ltAlertStations = new List<STATION>();
        bool bTransFlowUnit = false, bTransLevelUnit = false, bOverLevel, bOverFlow;
        DateTime dUpdatedTime;

        foreach (var poi in alert)
        {
            ltAlertStations.Clear();
            bTransFlowUnit = poi.SW_FLOW_THRESHOLD_UNIT == "CubicFeetPerSecond";
            bTransLevelUnit = poi.SW_LEVEL_THRESHOLD_UNIT == "Feet";
            dUpdatedTime = default(DateTime);
            poi.REGISTER_STATION.Load();

            String sTitle = "For your subscription at: " + (poi.POI_TYPE == "S" ? poi.STATION_ID : "(" + Math.Round(poi.LAT.Value, 4) + ", " + Math.Round(poi.LNG.Value, 4) + ")");

            StringBuilder sDesc = new StringBuilder(
                sTitle + ", here's your alert. <br>"
                + " Threshold of Water Level : " + poi.SW_LEVEL_THRESHOLD + " " + poi.SW_LEVEL_THRESHOLD_UNIT + "<br>"
                + " Threshold of Water Flow : " + poi.SW_FLOW_THRESHOLD + " " + toUnitWebPresent(poi.SW_FLOW_THRESHOLD_UNIT) + "<br>");

            StringBuilder sAlertMarker = new StringBuilder();
            StringBuilder sTable = new StringBuilder();
            var stations = from regStation in poi.REGISTER_STATION
                           join station in ctx.STATIONs on regStation.STATION_ID equals station.STATION_ID
                           select new { station, regStation };

            sTable.Append("<table border=1 cellspacing=0 cellpadding=4 bordercolor=gray>");
            sTable.Append("<tr><th>Index</th><th>Station</th><th>Water Level</th><th>Water Flow</th><th>Ground Water Level</th><th>Update Time</th></tr>");
            uint i = 0;
            foreach (var info in stations)
            {
                bOverLevel = poi.SW_LEVEL_THRESHOLD_METRIC <= info.station.SW_LEVEL;
                bOverFlow = poi.SW_FLOW_THRESHOLD_METRIC <= info.station.SW_FLOW;
                sTable.Append("<tr><td style='color:" + (bOverFlow || bOverLevel ? "red" : "black") + "'>" + (++i) + "</td>"
                    + "<td style='color:" + (bOverFlow || bOverLevel ? "red" : "black") + "'>" + (info.regStation.UPSTREAM==null ? "" : info.regStation.UPSTREAM + "-") + info.station.STATION_ID + "</td>"
                    + "<td style='color:" + (bOverLevel ? "red" : "black") + ";text-align:right;'>" + (info.station.SW_LEVEL.HasValue ? Math.Round(bTransLevelUnit ? UnitTransfer.MetersToFeet(info.station.SW_LEVEL.Value) : info.station.SW_LEVEL.Value, 2).ToString() : "none") + "</td>"
                    + "<td style='color:" + (bOverFlow ? "red" : "black") + ";text-align:right;'>" + (info.station.SW_FLOW.HasValue ? Math.Round(bTransFlowUnit ? UnitTransfer.CMPDayToCFPSecond(info.station.SW_FLOW.Value) : info.station.SW_FLOW.Value, 2).ToString() : "none") + "</td>"
                    + "<td>" + (info.station.GW_LEVEL.HasValue ? Math.Round(bTransLevelUnit ? UnitTransfer.CMPDayToCFPSecond(info.station.GW_LEVEL.Value) : info.station.GW_LEVEL.Value, 2).ToString() : "none") + "</td>"
                    + "<td>" + (info.station.SW_FLOW.HasValue || info.station.SW_LEVEL.HasValue ? info.station.LAST_UPDATE_TIME.ToUniversalTime().ToString("yyyy-MM-dd HH:mm UTC") : "&nbsp;") + "</td></tr>");
                if (bOverLevel || bOverFlow)
                {
                    sAlertMarker.Append("&markers=color:red%7C" + Math.Round(info.station.LAT.Value, 4) + "," + Math.Round(info.station.LNG.Value, 4));
                }
                if (info.station.LAST_UPDATE_TIME.CompareTo(dUpdatedTime) > 0)
                    dUpdatedTime = info.station.LAST_UPDATE_TIME;
            }
            if (dUpdatedTime == default(DateTime)) dUpdatedTime = DateTime.Now;
            sTable.Append("</table><br>");
            sDesc.Append("<img src='http://maps.googleapis.com/maps/api/staticmap?size=512x512"
                         + "&visible=" + poi.MIN_LAT + "," + poi.MIN_LNG + "%7C" + poi.MAX_LAT + "," + poi.MAX_LNG
                         + "&markers=" + sAlertMarker.ToString() + "&sensor=false'>");
            sDesc.Append(sTable);
            var item = new SyndicationItem(sTitle, sDesc.ToString(), null);
            item.PublishDate = dUpdatedTime;
            item.Id = poi.SEQ + "-" + dUpdatedTime.ToFileTimeUtc();
            item.LastUpdatedTime = dUpdatedTime;
            itemcollection.Add(item);
        }


        SyndicationFeed feed = new SyndicationFeed("CHISP Notification", "Notification", new Uri("http://google.com/"), itemcollection);

        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Indent = true;
        settings.NewLineHandling = NewLineHandling.Entitize;

        using (XmlWriter _writer = XmlWriter.Create(context.Response.OutputStream, settings))
        {
            if (notificationtype.ToLower() == "atom")
            {
                feed.SaveAsAtom10(_writer);
            }
            else
            {
                feed.SaveAsRss20(_writer);
            }
        }
    }

    private string toUnitWebPresent(String sUnit)
    {
        if (sUnit == "CubicMetersPerDay")
            return "Meters<sup>3</sup>/Day";
        else if (sUnit == "CubicFeetPerSecond")
            return "Feet<sup>3</sup>/Second";
        else
            return "";
    }
    
    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}