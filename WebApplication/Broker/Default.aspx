<%@ Page Language="C#" AutoEventWireup="true" CodeFile="Default.aspx.cs" Inherits="Broker_Default" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.3.min.js"></script>
    <script type="text/javascript">
        jQuery.support.cors = true;
//        $.ajax({
//            url: "http://140.134.48.13/WNS/Broker/RegisterInfo.ashx?op=GetFrequencyUnit",
//            type: 'post',
//            dataType: 'json',
//            success: function (obj) {
//                var result = "Frequency_Unit includes\n";
//                $.map(obj, function (item, index) {
//                    result += (index + 1) + ":" + item.FREQUENCY_UNIT + "\n";
//                });
//                alert(result);
//            },
//            error: function (req, message) {
//                alert(req.statusText);
//            }
//        });
//        $.ajax({
//            url: "http://140.134.48.13/WNS/Broker/RegisterInfo.ashx?op=GetNotificationType",
//            type: 'post',
//            dataType: 'json',
//            success: function (obj) {
//                var result = "NotificationType includes\n";
//                $.map(obj, function (item, index) {
//                    result += (index + 1) + ":" + item.TYPE + "\n";
//                });
//                alert(result);
//            },
//            error: function (req, message) {
//                alert(req.statusText);
//            }
//        });
        $.ajax({
            url: "RegisterInfo.ashx?op=subscribe",
            type: 'post',
            dataType: 'json',
            cache: false,
            data: { email: "tt@gis.tw", poi: "test", threshold: "2", frequency: "1", frequency_unit: "MONTH", notification_type: "ATOM" },
            success: function (obj) {
                var result = "";
                if (obj.UID != "") {
                    result += "UID:" + obj.UID + "\n";
                }
                result += "STATUS:" + obj.STATUS + "\n";
                result += "MESSAGE:" + obj.MESSAGE + "\n";
                alert(result);
            },
            error: function (req, message) {
                alert(req.statusText);
            }
        });
    </script>
</head>
<body>
    <form id="form1" runat="server">
    <div id="content">
    
    </div>
    </form>
</body>
</html>
