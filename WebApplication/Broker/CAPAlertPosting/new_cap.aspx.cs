using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;
using WNSModel;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public partial class Broker_CAPAlertPosting_new_cap : System.Web.UI.Page
{
    WNSEntities ctx = new WNSEntities();
    protected String eventStationsJson = "[]";
    protected String defaultHeadline = "'surface water alert'";
    protected String defaultDescription = "''";

    protected void Page_Load(object sender, EventArgs e)
    {
        String sEmail = Request["email"];
        var stationInfo = (from regStation in ctx.REGISTER_STATION
                          join station in ctx.STATIONs
                          on regStation.STATION_ID equals station.STATION_ID
                          let poi = regStation.REGISTER_POI
                          where regStation.REGISTER_POI.REGISTER.EMAIL == sEmail
                          && ((station.SW_FLOW.HasValue && poi.SW_FLOW_THRESHOLD_METRIC.HasValue && poi.SW_FLOW_THRESHOLD_METRIC <= station.SW_FLOW)
                              || (station.SW_LEVEL.HasValue && poi.SW_LEVEL_THRESHOLD_METRIC.HasValue && poi.SW_LEVEL_THRESHOLD_METRIC <= station.SW_LEVEL))
                          select new
                          {
                              station,
                              poi
                          }).ToArray();
        List<String> ltDesc = new List<string>();
        foreach (var info in stationInfo)
        {
            String sDesc = info.station.STATION_ID;
            if (info.station.SW_FLOW.HasValue && info.poi.SW_FLOW_THRESHOLD_METRIC.HasValue
                && info.poi.SW_FLOW_THRESHOLD_METRIC <= info.station.SW_FLOW)
            {
                var userFlow = info.station.SW_FLOW;
                if (info.poi.SW_FLOW_THRESHOLD_UNIT == "CubicFeetPerSecond")
                {
                    userFlow = Math.Round(UnitTransfer.CMPDayToCFPSecond(userFlow.Value),2);
                }
                sDesc += "\\n    Surface water flow is over the threshold (" + userFlow + "/" + info.poi.SW_FLOW_THRESHOLD + " " + info.poi.SW_FLOW_THRESHOLD_UNIT + ").";
            }
            if (info.station.SW_LEVEL.HasValue && info.poi.SW_LEVEL_THRESHOLD_METRIC.HasValue
                && info.poi.SW_LEVEL_THRESHOLD_METRIC <= info.station.SW_LEVEL)
            {
                var userLevel = info.station.SW_LEVEL;
                if (info.poi.SW_LEVEL_THRESHOLD_UNIT == "Feet")
                {
                    userLevel = Math.Round(UnitTransfer.MetersToFeet(userLevel.Value),2);
                }
                sDesc += "\\n    Surface water level is over the threshold (" + userLevel + "/" + info.poi.SW_LEVEL_THRESHOLD + " " + info.poi.SW_LEVEL_THRESHOLD_UNIT + ").";
            }
            ltDesc.Add(sDesc);
        }
        defaultDescription = "'" + String.Join("\\n", ltDesc.ToArray()) + "'";

        
        var tt = stationInfo.GroupBy(r => r.station.STATION_ID, r => r.station).ToDictionary(r=>r.Key, r=>r.First());
        var random = new Random(DateTime.Now.Millisecond);
        eventStationsJson = JsonConvert.SerializeObject(tt.Select(r => new
        {
            id = r.Value.STATION_ID,
            sw_flow_current = r.Value.SW_FLOW,
            lat = r.Value.LAT,
            lng = r.Value.LNG,
            sw_level_current = r.Value.SW_LEVEL
        }));
    }
}