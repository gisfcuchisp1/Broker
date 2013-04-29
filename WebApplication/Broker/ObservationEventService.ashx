<%@ WebHandler Language="C#" Class="ObservationEventService" %>

using System;
using System.Web;
using System.IO;
using System.Text;
using WNSModel;
using System.Linq;
using System.Collections.Generic;
using System.Data.Objects;
using System.Net;

/// <summary>
/// Check measure values and nofity user when the values over thresholds.
/// </summary>
public class ObservationEventService : IHttpHandler
{
    private static readonly log4net.ILog log = log4net.LogManager.GetLogger(typeof(ObservationEventService));
    private static Uri baseUri;

    private static bool IsNotifyForUpdatingProcessing = false;
    public void ProcessRequest(HttpContext context)
    {
        if (baseUri == null) baseUri = context.Request.Url;
        context.Response.ContentType = "text/plain";
        if (context.Request["op"].Equals("checkMeasureValue", StringComparison.OrdinalIgnoreCase))
        {
            if (!IsNotifyForUpdatingProcessing)
            {
                log.Debug("process notifyForUpdating");
                IsNotifyForUpdatingProcessing = true;
                System.Threading.Thread thread = null;
                try
                {
                    thread = new System.Threading.Thread(new System.Threading.ThreadStart(notifyForUpdating));
                    thread.Start();
                    context.Response.Write("Check and Notify Start...");
                }
                catch (Exception e)
                {
                    IsNotifyForUpdatingProcessing = false;
                    if (thread != null && thread.IsAlive)
                        thread.Abort();
                    context.Response.Write("Error");
                }
            }
            else
            {
                context.Response.Write("It's already running.");
            }
        }
    }

    private static void notifyForUpdating()
    {
        try
        {
            log.Info("Check and Notify start...");
            WNSEntities ctx = new WNSEntities();
            var alertLinq = (from poi in ctx.REGISTER_POI
                             where (from regStation in poi.REGISTER_STATION
                                    join station in ctx.STATIONs on regStation.STATION_ID equals station.STATION_ID
                                    select new { station, regStation }
                                   ).Any(t => (t.station.SW_FLOW >= poi.SW_FLOW_THRESHOLD_METRIC 
                                               || t.station.SW_LEVEL >= poi.SW_LEVEL_THRESHOLD_METRIC)
                                           && (!poi.ALERT_NOTIFCATION_TIME.HasValue 
                                               || EntityFunctions.AddMinutes(poi.ALERT_NOTIFCATION_TIME.Value, (int?)poi.FREQUENCY) <= DateTime.Now)
                                )
                             group poi by poi.REGISTER into g
                             select g);
            log.Debug(((System.Data.Objects.ObjectQuery)alertLinq).ToTraceString());
            var alert = alertLinq.ToDictionary(r => r.Key, r => r.ToArray());
            foreach (var register in alert.Keys)
            {
#if debug
                if (register.NO != 2) continue;
#endif
                var pois = alert[register].ToArray();
                StringBuilder sDesc = new StringBuilder();
                List<STATION> ltAlertStations = new List<STATION>();
                bool bTransFlowUnit = false, bTransLevelUnit = false, bOverLevel, bOverFlow;
                DateTime dUpdatedTime;
                sDesc.Append("<body>");
                foreach (var poi in pois)
                {
                    ltAlertStations.Clear();
                    bTransFlowUnit = poi.SW_FLOW_THRESHOLD_UNIT == "CubicFeetPerSecond";
                    bTransLevelUnit = poi.SW_LEVEL_THRESHOLD_UNIT == "Feet";
                    dUpdatedTime = default(DateTime);
                    poi.REGISTER_STATION.Load();

                    String sTitle = "For your subscription at: " + (poi.POI_TYPE == "S" ? poi.STATION_ID : "(" + Math.Round(poi.LAT.Value, 4) + ", " + Math.Round(poi.LNG.Value, 4) + ")");

                    sDesc.Append(
                        sTitle + ", here's your alert. <br>"
                        + " Threshold of Water Level : " + poi.SW_LEVEL_THRESHOLD + " " + poi.SW_LEVEL_THRESHOLD_UNIT + "<br>"
                        + " Threshold of Water Flow : " + poi.SW_FLOW_THRESHOLD + " " + toUnitWebPresent(poi.SW_FLOW_THRESHOLD_UNIT) + "<br>");

                    StringBuilder sAlertMarker = new StringBuilder();
                    StringBuilder sTable = new StringBuilder();
                    var stations = from regStation in poi.REGISTER_STATION
                                   join station in ctx.STATIONs on regStation.STATION_ID equals station.STATION_ID
                                   select new { station, regStation };

                    sTable.Append("<table border='1' cellspacing='0' cellpadding='4' bordercolor='gray'>");
                    sTable.Append("<tr><th>Index</th><th>Station</th><th>Water Level</th><th>Water Flow</th><th>Ground Water Level</th><th>Update Time</th></tr>");
                    uint i = 0;
                    foreach (var info in stations)
                    {
                        bOverLevel = poi.SW_LEVEL_THRESHOLD_METRIC <= info.station.SW_LEVEL;
                        bOverFlow = poi.SW_FLOW_THRESHOLD_METRIC <= info.station.SW_FLOW;
                        sTable.Append("<tr><td style='color:" + (bOverFlow || bOverLevel ? "red" : "black") + "'>" + (++i) + "</td>"
                            + "<td style='color:" + (bOverFlow || bOverLevel ? "red" : "black") + "'>" + (info.regStation.UPSTREAM == null ? "" : info.regStation.UPSTREAM + "-") + info.station.STATION_ID + "</td>"
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
                    sDesc.Append(sTable + "<br><br>");
                    poi.ALERT_NOTIFCATION_TIME = DateTime.Now;
                }
                sDesc.Append("</body>");

                bool res = WnsNotificationTool.doNotification(register.UID, new System.Collections.Generic.Dictionary<string, object>()
                        {
                            {"status","Alert"},
                            {"headline", "surface water alert"},
                            {"content", sDesc + (register.ROLE == "E" ? "<a href='"+new Uri(baseUri, "CAPAlertPosting/new_cap.aspx").AbsoluteUri+"?email="+register.EMAIL+"'>CAP alert</a>":"") + "<br><br>--------<br>This notification was conducted under OGC CHISP-1."}
                        });
                if (res)
                {
                    ctx.SaveChanges(SaveOptions.AcceptAllChangesAfterSave);
                }
                else
                {
                    ctx.Refresh(RefreshMode.StoreWins, ctx.ObjectStateManager.GetObjectStateEntries(System.Data.EntityState.Modified).Select(r => r.Entity));
                    ctx.SaveChanges(SaveOptions.AcceptAllChangesAfterSave);
                }
            }
            log.Info("Check and Notify finish.");
        }
        catch (Exception e)
        {
            log.Error("", e);
        }
        IsNotifyForUpdatingProcessing = false;
    }

    private static string toUnitWebPresent(String sUnit)
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