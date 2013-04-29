<%@ Page Language="C#" AutoEventWireup="true" CodeFile="wns.aspx.cs" Inherits="Broker_wns" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.3.min.js"></script>
    <script type="text/javascript">
        jQuery.support.cors = true;
        function register() {
            $.ajax({
                url: "../Notification/WNS.ashx",
                type: 'post',
                dataType: 'xml',
                data: '<?xml version="1.0" encoding="UTF-8"?>'
                + '\n<wns:RegisterUser xmlns:wns="http://www.opengis.net/wns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.0.1" Service="WNS">'
                + '\n<wns:Name>'+$("#name").val()+'</wns:Name>'
                + '\n<wns:CommunicationProtocol>'
                + '\n<wns:Email>' + $("#email").val() + '</wns:Email>'
                + '\n</wns:CommunicationProtocol>'
                + '\n</wns:RegisterUser>',
                success: function (obj) {
                    alert("Your UserID is " + $(obj).find("RegisterUserResponse").find("UserID").text());
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }
        function notify() {
            $.ajax({
                url: "../Notification/WNS.ashx",
                type: 'post',
                dataType: 'xml',
                data: '<?xml version="1.0" encoding="UTF-8"?>'
                + '\n<wns:DoNotification xmlns:wns="http://www.opengis.net/wns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.0.1" Service="WNS">'
                + '\n<wns:UserID>' + $("#uid").val() + '</wns:UserID>'
                + '\n<wns:Message>'
                + '\n<wns:Type>Operation completed</wns:Type>'
                + '\n<wns:MessageParameter>'
                + '\n<wns:CorrID>0</wns:CorrID>'
                + '\n<wns:Key>subject</wns:Key>\n<wns:String><![CDATA[' + $("#subject").val() + ']]></wns:String>'
                + '\n</wns:MessageParameter>'
                + '\n<wns:MessageParameter>'
                + '\n<wns:CorrID>0</wns:CorrID>'
                + '\n<wns:Key>content</wns:Key>\n<wns:String><![CDATA[\n' + $("#content").val() + '\n]]></wns:String>'
                + '\n</wns:MessageParameter>'
                + '\n</wns:Message>'
                + '\n</wns:DoNotification>',
                success: function (obj) {
                    alert($(obj).find("DoNotificationResponse").find("Status").text());
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }
    </script>
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div style="border:1px solid blue">
        name : <input type="text" id="name" /><br />
        email : <input type="text" id="email" /><br />
        <input type="button" value="Register" onclick="register()" />
    </div>
    <br />
    <div style="border:1px solid blue; vertical-align:top;">
        UserID : <input type="text" id="uid" /><br />
        subject : <input type="text" id="subject" /><br />
        content : <textarea id="content" rows="10" cols="100" ></textarea> <br />
        <input type="button" value="Notify" onclick="notify()" />
    </div>
    </form>
</body>
</html>
