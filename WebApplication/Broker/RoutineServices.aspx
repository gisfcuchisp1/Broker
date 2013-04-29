<%@ Page Language="C#" AutoEventWireup="true" CodeFile="RoutineServices.aspx.cs" Inherits="Broker_RoutineServices" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
    <input type="button" value="Poi Further Process" onclick="document.getElementById('fAction').src='RegisterInfo.ashx?op=poifurtherprocess'" />
    <input type="button" value="Gain Measure Values" onclick="document.getElementById('fAction').src='scan.ashx?op=gainmeasuredata'" />
    <input type="button" value="Check and Notify" onclick="document.getElementById('fAction').src='observationeventservice.ashx?op=checkMeasureValue'" />
    <iframe id="fAction" frameborder="0" width="100%"></iframe>
    </div>
    </form>
</body>
</html>
