<%@ Page Language="C#" AutoEventWireup="true" CodeFile="CAPAlert.aspx.cs" Inherits="Broker_CAPAlert" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
    <asp:Button ID="btnCreate" runat="server" Text="Create" OnClick="btnCreate_Click"/>
    <asp:Button ID="btnSend" runat="server" Text="Send To MASAS Hub" OnClick="btnSend_Click"/><br />
    <asp:TextBox ID="txtXML" TextMode="MultiLine" runat="server" Columns="60" Rows="40"></asp:TextBox>
    </div>
    </form>
</body>
</html>
