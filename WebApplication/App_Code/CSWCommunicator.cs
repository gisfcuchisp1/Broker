using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WNSModel;
using System.Net;
using System.Xml;
using System.Web.Configuration;
using log4net;
using log4net.Config;

/// <summary>
/// A Communicator with CSW
/// </summary>
public class CSWCommunicator
{
    private static readonly ILog log = LogManager.GetLogger(typeof(CSWCommunicator));

    public CSWCommunicator()
    {
    }

    public static bool GainStationMeasureDataByUUID(string uuid, STATION station)
    {
        WebClient client = new WebClient();
        client.Headers["content-type"] = "application/xml";

        string reqString = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
        reqString += "<csw:GetRecordById xmlns:csw=\"http://www.opengis.net/cat/csw/2.0.2\" service=\"CSW\" version=\"2.0.2\">";
        reqString += "<csw:Id>" + uuid + "</csw:Id>";
        reqString += "</csw:GetRecordById>";
        log.Debug("Request Content:\n" + reqString);

        XmlDocument xmlDoc = new XmlDocument();
        try
        {
            String sCSWRes = client.UploadString(WebConfigurationManager.AppSettings["CSWLink"], reqString);
            xmlDoc.LoadXml(sCSWRes);
        }
        catch (Exception e)
        {
            log.Error("Fail to get data from csw.", e);
            return false;
        }
        var nsmgr = new XmlNamespaceManager(xmlDoc.NameTable);
        nsmgr.AddNamespace("dct", "http://purl.org/dc/terms/");
        var xAbstract = xmlDoc.SelectSingleNode("//dct:abstract", nsmgr);
        if (xAbstract != null)
        {
            try
            {
                log.Debug("Abstract = \"" + xAbstract.InnerText + "\"");
                var dataMap = xAbstract.InnerText.Split(new char[]{';'}, StringSplitOptions.RemoveEmptyEntries).Select(r => r.Split(':')).ToDictionary(r => r[0], r => string.Join(":", r.Where((s,i)=>i>0).ToArray()));
                double value;
                DateTime dDate;
                bool bUpdate = true;
                if (dataMap["type"] == "water_level")
                {
                    log.Info("water_level = " + dataMap["value"]);
                    if (double.TryParse(dataMap["value"], out value) && value >= 0)
                        station.SW_LEVEL = value;
                    else
                        bUpdate = false;
                }
                else if (dataMap["type"] == "water_flow")
                {
                    log.Info("water_flow = " + dataMap["value"]);
                    if (double.TryParse(dataMap["value"], out value) && value >= 0)
                        station.SW_FLOW = value;
                    else
                        bUpdate = false;
                }
                else if (dataMap["type"] == "gw_level")
                {
                    log.Info("gw_level = " + dataMap["value"]);
                    if (double.TryParse(dataMap["value"], out value) && value >= 0)
                        station.GW_LEVEL = value;
                    else
                        bUpdate = false;
                }
                if (bUpdate)
                {
                    if (DateTime.TryParse(dataMap["time"], out dDate))
                        station.LAST_UPDATE_TIME = dDate;
                    else
                        log.Warn("Fail to parse updating time!!");
                }
                else
                {
                    log.Warn("Fail to parse value!!");
                }
            }
            catch (Exception e)
            {
                log.Error("Fail to fill data.", e);
                return false;
            }
        }
        else
        {
            log.Error("No data found from CSW.");
            return false;
        }
        return true;
    }

}