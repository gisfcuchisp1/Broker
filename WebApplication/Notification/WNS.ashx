<%@ WebHandler Language="C#" Class="WNS" %>

using System;
using System.IO;
using System.Web;
using System.Xml;
using System.Xml.Serialization;
using WNSModel;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using ogc.wns;
using System.Net.Mail;

public class WNS : IHttpHandler
{
    String sRetMsg = null;
    IWnsMessageGenerator msgGen = null;

    public void ProcessRequest(HttpContext context)
    {
        context.Response.HeaderEncoding = System.Text.Encoding.UTF8;
        context.Response.ContentType = "text/xml";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;


        String sMsgGenCType = null;
        if (!String.IsNullOrEmpty(context.Request.QueryString["MsgType"]) && System.Configuration.ConfigurationManager.AppSettings.AllKeys.Contains(context.Request.QueryString["MsgType"]))
        {
            sMsgGenCType = System.Configuration.ConfigurationManager.AppSettings[context.Request["MsgType"]];
        }
        if (String.IsNullOrEmpty(sMsgGenCType))
            sMsgGenCType = System.Configuration.ConfigurationManager.AppSettings["DefaultMsgGenType"];
        if (String.IsNullOrEmpty(sMsgGenCType)) throw new NotImplementedException("Can't find the WNS Message Generator which should implement the interface - IWnsMessageGenerator. The full class name of message generator must be set in the value of appSettings of web.conf. The key of appSettings must be \"DefaultMsgGenType\" by default, or the key should be equal to the value of request parameter - [MsgType].");

        if (context.Request.QueryString["operation"] == "unregisterUser")
        {
            context.Response.Write(unregisterUser(context.Request));
            return;
        }
        
        msgGen = (IWnsMessageGenerator)AppDomain.CurrentDomain.CreateInstance("App_code", sMsgGenCType).Unwrap();

        string result = null;
        StreamReader reader = new StreamReader(context.Request.InputStream);
        String data = reader.ReadToEnd();
        XmlDocument doc = new XmlDocument();
        try
        {
            doc.LoadXml(data);
            switch (doc.DocumentElement.LocalName)
            {
                case "GetCapabilities":
                    //request = serializer[0].Deserialize(xreader);
                    result = getCapabilities();
                    break;
                case "RegisterUser":
                    result = registerUser(Serializers.Deserialize<RegisterUserType>(data));
                    break;
                case "DoNotification":
                    doNotification(Serializers.Deserialize<DoNotificationType>(data));
                    long timeout = 0;
                    while (sRetMsg == null && timeout++ < 100)
                        System.Threading.Thread.Sleep(500);
                    if (sRetMsg != null) result = sRetMsg;
                    else
                    {
                        var res = new ogc.wns.DoNotificationResponseType();
                        res.Status = ogc.wns.DoNotificationResponseTypeStatus.Notificationtimedout;
                        result = Serializers.Serialize(res);
                    }
                    break;
            }
        }
        catch (InvalidOperationException e)
        {
            var exp = ExceptionGen.getServiceReport(ExceptionCode.InvalidXMLFormate);
            result = Serializers.Serialize(exp);
        }
        catch (XmlException e)
        {
            var exp = ExceptionGen.getServiceReport(ExceptionCode.InvalidXMLFormate);
            result = Serializers.Serialize(exp);
        }

        if (result == null)
        {
            var exp = ExceptionGen.getServiceReport(ExceptionCode.UnsupportedOperation);
            result = Serializers.Serialize(exp);
        }
        context.Response.Write(result);
    }

    /// <summary>
    /// getCapabilities
    /// </summary>
    /// <returns></returns>
    private string getCapabilities()
    {
        return Resources.Resource.GetCapability;
    }
    /// <summary>
    /// registerUser
    /// </summary>
    /// <returns></returns>
    private string registerUser(RegisterUserType req)
    {
        RegisterUserResponseType ret = null;
        SmtpClient client = new SmtpClient();
        MailMessage msg = new MailMessage();
        msg.BodyEncoding = System.Text.Encoding.Unicode;
        msg.IsBodyHtml = true;
        try
        {
            string name = req.Name;
            ItemChoiceType3 communicationprotocol = req.CommunicationProtocol.ItemElementName;

            WNSEntities ctx = new WNSEntities();
            USER newuser = new USER();
            newuser.NAME = name;
            if (communicationprotocol == ItemChoiceType3.Email)
            {
                newuser.EMAIL = req.CommunicationProtocol.Item.ToString();
            }
            ctx.AddToUSERs(newuser);
            ctx.SaveChanges();

            long UID = newuser.UID;

            ret = new RegisterUserResponseType();
            ret.UserID = (ulong)UID;

            //RegisterUserResponseType response = new RegisterUserResponseType();
            //response.UserID = (ulong)UID;
            //ret = response;
            
            //try
            //{
            //    msg.Subject = msgGen.genRegisterUserSubject(CommunicationProtocol.Email, req, ret);
            //    msg.Body = msgGen.genRegisterUserContent(CommunicationProtocol.Email, req, ret);
            //    msg.To.Add(newuser.EMAIL);
            //}
            //catch (NotSupportedException e)
            //{
            //    client.Send(msg);
            //}
        }
        catch (Exception e)
        {
            var report = ExceptionGen.getServiceReport(ExceptionCode.SystemError);
            return Serializers.Serialize(report);
        }
        return Serializers.Serialize(ret);
    }

    private string unregisterUser(HttpRequest request)
    {
        String sPreContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        if (String.IsNullOrEmpty(request.QueryString["uid"].Trim()))
        {
            var report = ExceptionGen.getServiceReport(ExceptionCode.InvalidRequestFormate);
            return Serializers.Serialize(report);
        }
        long uid;
        if (!long.TryParse(request.QueryString["uid"].Trim(), out uid))
        {
            var report = ExceptionGen.getServiceReport(ExceptionCode.InvalidRequestFormate);
            return Serializers.Serialize(report);
        }

        WNSEntities ctx = new WNSEntities();
        var users = (from user in ctx.USERs
                     where user.UID == uid
                     select user).ToArray();
        var userInfo = (from re in ctx.REGISTERs where re.UID==uid select re).ToArray();
        if (users.Length == 0)
        {
            var report = ExceptionGen.getServiceReport(ExceptionCode.UserNotFound);
            return Serializers.Serialize(report);
        }
        try
        {
            ctx.USERs.DeleteObject(users[0]);
            if (userInfo.Length > 0)
            {
                ctx.REGISTERs.DeleteObject(userInfo[0]);
            }
            ctx.SaveChanges();
        }
        catch (Exception e)
        {
            var report = ExceptionGen.getServiceReport(ExceptionCode.SystemError);
            return Serializers.Serialize(report);
        }

        return sPreContent + "<UnregisterUserResponse>User unregistering successful</UnregisterUserResponse>";
    }

    /// <summary>
    /// doNotification
    /// </summary>
    /// <returns></returns>
    private void doNotification(DoNotificationType req)
    {
        try
        {
            long userid = (long)req.UserID;

            WNSEntities ctx = new WNSEntities();
            var users = (from user in ctx.USERs
                         where user.UID == userid
                         select user).ToArray();

            if (users.Length > 0)
            {
                if (req.Message == null)
                {
                    sRetMsg = Serializers.Serialize(ExceptionGen.getServiceReport(ExceptionCode.InvalidRequestFormate));
                    return;
                }
                var user = users[0];
                SmtpClient client = new SmtpClient();
                var mail = new MailMessage();
                mail.To.Add(user.EMAIL);
                mail.IsBodyHtml = true;
                mail.BodyEncoding = System.Text.Encoding.Unicode;
                mail.Subject = msgGen.genNotificationSubject(CommunicationProtocol.Email, req);
                mail.Body = msgGen.genNotificationContent(CommunicationProtocol.Email, req);
                //client.Send(mail);
                client.SendCompleted += new SendCompletedEventHandler(client_SendCompleted);
                client.SendAsync(mail, "");
            }
            else
            {
                sRetMsg = Serializers.Serialize(ExceptionGen.getServiceReport(ExceptionCode.UserNotFound));
            }
            return;
        }
        catch (Exception e)
        {
            var exp = ExceptionGen.getServiceReport(ExceptionCode.UnhandlingError);
            sRetMsg = Serializers.Serialize(exp);
            return;
        }
    }

    void client_SendCompleted(object sender, System.ComponentModel.AsyncCompletedEventArgs e)
    {
        if (e.Error == null)
        {
            var res = new ogc.wns.DoNotificationResponseType();
            res.Status = ogc.wns.DoNotificationResponseTypeStatus.Notificationsendingsuccessful;
            sRetMsg = Serializers.Serialize(res);
            //var client = (SmtpClient)sender;
            //client.Dispose();
        }
        else
        {
            var res = new ogc.wns.DoNotificationResponseType();
            res.Status = ogc.wns.DoNotificationResponseTypeStatus.Notificationsendingfailed;
            sRetMsg = Serializers.Serialize(res);
        }
    }

    /// <summary>
    /// doCommunication
    /// </summary>
    /// <returns></returns>
    private string doCommunication()
    {
        string userid = HttpContext.Current.Request["USERID"].ToString();
        string msg = HttpContext.Current.Request["MSG"].ToString();
        string callback = HttpContext.Current.Request["CALLBACK"].ToString();
        string corrid = HttpContext.Current.Request["CORRID"].ToString();
        throw new NotSupportedException("doCommunication is not supported yet.");
    }
    /// <summary>
    /// doReply
    /// </summary>
    /// <returns></returns>
    private string doReply()
    {
        string userid = HttpContext.Current.Request["USERID"].ToString();
        string msg = HttpContext.Current.Request["MSG"].ToString();
        string corrid = HttpContext.Current.Request["CORRID"].ToString();

        throw new NotSupportedException("doReply is not supported yet.");
    }



    public bool IsReusable
    {
        get { return true; }
    }

}