using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ogc.wns;
using System.Xml;
using System.Net;
using System.IO;
using System.Text;
using System.Web.Configuration;

/// <summary>
/// Tool for communicating with WNS
/// </summary>
public class WnsNotificationTool
{
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
    
    public WnsNotificationTool()
	{
	}

    /// <summary>
    /// Ask WNS to send a notification
    /// </summary>
    /// <param name="uid"></param>
    /// <param name="parameters"></param>
    public static bool doNotification(long uid, Dictionary<string, object> parameters)
    {
        DoNotificationType oNotification = new DoNotificationType();
        byte[] arbCorrID = new byte[8];
        new Random(DateTime.Now.Millisecond).NextBytes(arbCorrID);
        long corrID = BitConverter.ToInt64(arbCorrID, 0);
        oNotification.UserID = (ulong)uid;
        oNotification.Message = new NotificationMessageType();
        oNotification.Message.MessageParameter
            = parameters.Where(r => r.Value != null).Select(r => new { param = r, type = identifyDataType(r.Value) }).Select(r =>
                new NotificationMessageTypeMessageParameter()
                {
                    CorrID = corrID,
                    Key = r.param.Key,
                    ItemElementName = r.type,
                    Item = r.type == ItemChoiceType.Integer ? r.param.Value.ToString() : r.param.Value
                }
            ).ToArray();
        DoNotificationResponseType response = null;
        try
        {
            var reader = sendToWNS(Serializers.Serialize(oNotification));
            if (Serializers.GetSerializer<DoNotificationResponseType>().CanDeserialize(reader))
            {
                response = Serializers.Deserialize<DoNotificationResponseType>(reader);
            }
            else
            {
                var exception = Serializers.Deserialize<ogc.service.ServiceExceptionReport>(reader);
                return false;
            }
        }
        catch (Exception e)
        {
            return false;
        }
        if (response != null && response.Status == DoNotificationResponseTypeStatus.Notificationsendingsuccessful) return true;
        else return false;

    }

    public static XmlReader sendToWNS(String RequestContent)
    {
        WebRequest request = WebRequest.Create(uriWNS);
        request.Method = "POST";
        request.ContentType = "text/xml";
        var writer = new StreamWriter(request.GetRequestStream(), Encoding.UTF8);
        writer.Write(RequestContent);
        writer.Flush();
        var resStream = request.GetResponse().GetResponseStream();
        return XmlReader.Create(resStream);
    }

    private static ItemChoiceType identifyDataType(Object obj)
    {
        if (obj is int)
        {
            return ItemChoiceType.Integer;
        }
        else if (obj is double)
        {
            return ItemChoiceType.Double;
        }
        else if (obj is float)
        {
            return ItemChoiceType.Float;
        }
        else if (obj is long)
        {
            return ItemChoiceType.Long;
        }
        else if (obj is string)
        {
            return ItemChoiceType.String;
        }
        else if (obj is Uri)
        {
            return ItemChoiceType.URI;
        }
        else
        {
            return ItemChoiceType.String;
        }
    }


}