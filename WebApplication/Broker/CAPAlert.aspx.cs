using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ogc.capalert;
using System.IO;
using System.Net;
using System.Text;
using System.Xml.Linq;
public partial class Broker_CAPAlert : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {

    }
    protected void btnCreate_Click(object sender, EventArgs e)
    {
        txtXML.Text = Serializers.Serialize(GenContent()).Replace("utf-16", "utf-8");
    }
    protected void btnSend_Click(object sender, EventArgs e)
    {

        WebRequest request = WebRequest.Create("http://sandbox2.masas-sics.ca/hub/feed?secret=dh4nhz");
        request.Method = "POST";
        request.ContentType = "application/xml";

        string postString = Serializers.Serialize(GenContent()).Replace("utf-16", "utf-8");


        //convert post data to byte array
        byte[] byt_data = System.Text.Encoding.UTF8.GetBytes(postString);
        //setting post data
        request.Timeout = 1000 * 10;
        request.ContentType = "application/common-alerting-protocol+xml";
        request.Method = "POST";
       Stream stream_ws = request.GetRequestStream();
        stream_ws.Write(byt_data, 0, byt_data.Length);
        stream_ws.Close();

        //輸出POST後的頁面
        WebResponse resp = request.GetResponse();
        StreamReader streamreader_stream = new StreamReader(resp.GetResponseStream());
        string result = streamreader_stream.ReadToEnd().Trim().Replace("utf-16", "utf-8");
        Stream s = new MemoryStream(ASCIIEncoding.Default.GetBytes(result));
        XElement xe = XElement.Load(s);
        string a = "";
    }
    private alert GenContent() {
        alert capobj = new alert();
        capobj.identifier = "test";
        capobj.sender = "orange@gis.tw";
        capobj.sent = Convert.ToDateTime(DateTime.UtcNow.ToString("s") + "-00:00");
        capobj.status = alertStatus.Test;
        capobj.msgType = alertMsgType.Alert;
        capobj.scope = alertScope.Public;
        capobj.code = new string[] { "profile:CAP-CP:0.3" };

        alertInfo testData = new alertInfo();
        testData.language = "en-CA";
        testData.category = new alertInfoCategory[] { alertInfoCategory.Other };
        testData.@event = "Test Message";
        testData.urgency = alertInfoUrgency.Unknown;
        testData.severity = alertInfoSeverity.Unknown;
        testData.certainty = alertInfoCertainty.Unknown;

        alertInfoEventCode tempeventcode = new alertInfoEventCode();
        tempeventcode.valueName = "profile:CAP-CP:Event:0.3";
        tempeventcode.value = "testmessage";
        testData.eventCode = new alertInfoEventCode[] { tempeventcode };
        testData.expires = Convert.ToDateTime(DateTime.UtcNow.AddMinutes(30).ToString("s") + "-00:00");
        testData.senderName = "CHISP1 Broker Test";
        testData.headline = "CHISP1 Broker Test Message";


        alertInfoParameter tempparam = new alertInfoParameter();
        tempparam.valueName = "layer:CAPAN:eventLocation:point";
        tempparam.value = "23,121";
        testData.parameter = new alertInfoParameter[] { tempparam };

        alertInfoArea temparea = new alertInfoArea();
        temparea.areaDesc = "taiwan";
        alertInfoAreaGeocode aa = new alertInfoAreaGeocode();
        aa.valueName = "profile:CAP-CP:Location:0.3";
        aa.value = "3506008";
        temparea.geocode = new alertInfoAreaGeocode[] { aa };
        testData.area = new alertInfoArea[] { temparea };


        capobj.info = new alertInfo[] { testData };

        return capobj;
    }
}