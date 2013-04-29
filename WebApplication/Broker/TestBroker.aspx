<%@ Page Language="C#" AutoEventWireup="true" CodeFile="TestBroker.aspx.cs" Inherits="Broker_TestBroker" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.3.min.js"></script>
    <script type="text/javascript">
        function dosubscribe() {
            var requestContents = new Array();
            var poiType;
            var poiLocals;
            if ($("#<%= txtStationID.ClientID %>")[0].style.display != "none") {
                poiLocals = $("#<%= txtStationID.ClientID %>").val().split(",");
                poiType = "S";
            } else {
                poiLocals = $("#txtPosition").val().split(",");
                poiType = "P";
            }
            var sw_level_thresholds = $("[id$=txtSWLevelThreshold]").val().split(",");
            var sw_level_threshold_unit = $("#ddlLevelUnit").val();
            var sw_flow_thresholds = $("[id$=txtSWFlowThreshold]").val().split(",");
            var sw_flow_threshold_unit = $("#ddlFlowUnit").val();
            var frequencys = $("[id$=txtMeasurementTime]").val().split(",");
            for (var i = 0; i < poiLocals.length; i++) {
                var requestContent = {
                    email:  $("[id$=txtEmail]").val(),
                    swLevelThreshold: parseFloat(sw_level_thresholds[i]),
                    swLevelThresholdUnit: sw_level_threshold_unit,
                    swFlowThreshold: parseFloat(sw_flow_thresholds[i]),
                    swFlowThresholdUnit: sw_flow_threshold_unit,
                    frequency: parseInt(frequencys[i], 10)
                };
                if (poiType == "S") {
                    requestContent["stationID"] = poiLocals[i];
                } else {
                    var local = poiLocals[i].split(" ");
                    requestContent["lat"] = parseFloat(local[0]);
                    requestContent["lng"] = parseFloat(local[1]);
                }
                requestContents.push(requestContent);
            }
            //$("#requestContent").html(JSON.stringify(requestContent).replace(/(\:\S+,)/g, "$1<br>").replace("}", "<br>}")).replace("{", "{<br>");
            $("#requestContent").text(JSON.stringify(requestContents));
            $("#txtUrl").text("RegisterInfo.ashx?op=subscribe");
            var request = $.ajax({
                url: "RegisterInfo.ashx?op=subscribe",
                type: 'post',
                dataType: 'json',
                cache: false,
                data: JSON.stringify(requestContents),
                success: function (obj, status, jqXHR) {
                    var result = "";
                    //$("#responseContent").html(JSON.stringify(obj).replace(/(,|\{)/g, "$1<br>").replace("}", "<br>}"));
                    $("#responseContent").text(jqXHR.responseText);
                    alert(obj.code + "\nIDs:" + obj.poiIDs.join(","));
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }

        function unsubscribe() {
            var arsId = $("#txtPoiIDs").val().split(",");
            var ariId = Array();
            for (var i = 0; i < arsId.length; i++) {
                ariId[i] = parseInt(arsId[i]);
            }
            $("#txtUrl").text("RegisterInfo.ashx?op=unsubscribe&email=" + $("[id$=txtEmail]").val());
            $.ajax({
                url: "RegisterInfo.ashx?op=unsubscribe&email=" + $("[id$=txtEmail]").val(),
                type: 'post',
                dataType: 'json',
                cache: false,
                data: JSON.stringify(ariId),
                success: function (obj, status, jqXHR) {
                    var result = "";
                    $("#responseContent").text(jqXHR.responseText);
                    alert(obj.code);
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }


        function GetUserSubscription() {
            $("#txtUrl").text("RegisterInfo.ashx?op=getUserSubscription&email=" + $("[id$=txtEmail]").val());
            $("#requestContent").val("");
            var request = $.ajax({
                url: "RegisterInfo.ashx?op=getUserSubscription&email=" + $("[id$=txtEmail]").val(),
                type: 'get',
                dataType: 'json',
                cache: false,
                success: function (obj, status, jqXHR) {
                    var result = "";
                    //$("#responseContent").html(JSON.stringify(obj).replace(/(,|\{)/g, "$1<br>").replace("}", "<br>}"));
                    $("#responseContent").text(jqXHR.responseText);
                    alert("Success");
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }
        function switchMode(obj) {
            if (obj.value == "L") {
                $("#<%= txtStationID.ClientID %>")[0].style.display = "none";
                $("#<%= txtPosition.ClientID %>")[0].style.display = "";
            } else {
                $("#<%= txtStationID.ClientID %>")[0].style.display = "";
                $("#<%= txtPosition.ClientID %>")[0].style.display = "none";
            }
        }

        function getUser() {
            $.ajax({
                url: "RegisterInfo.ashx?op=GetUser&email=" + $("[id$=txtEmail]").val(),
                type: 'get',
                dataType: 'json',
                cache: false,
                success: function (obj, status, jqXHR) {
                    var result = "";
                    $("#responseContent").text(jqXHR.responseText);
                    alert("Success");
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }

        function registerUser(role) {
            var req = {email : $("[id$=txtEmail]").val(), role : role};
            $.ajax({
                url: "RegisterInfo.ashx?op=registerUser",
                type: 'post',
                dataType: 'json',
                cache: false,
                data: JSON.stringify(req),
                success: function (obj, status, jqXHR) {
                    var result = "";
                    $("#responseContent").text(jqXHR.responseText);
                    alert(status);
                },
                error: function (req, message) {
                    alert(req.statusText);
                }
            });
        }
    </script>
</head>
<body>
    <form id="form1" runat="server">
    <asp:ScriptManager runat="server">
    </asp:ScriptManager>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table>
                <tr>
                    <th>
                        email :
                    </th>
                    <td>
                        <asp:TextBox ID="txtEmail" runat="server"></asp:TextBox>
                        <input type="button" value="GetUser" onclick="getUser();" />
                        <input type="button" value="BeNormalUser" onclick="registerUser('Normal');" />
                        <input type="button" value="BeEMUser" onclick="registerUser('EM');" />
                    </td>
                </tr>
                <tr>
                    <%-- <th>
                        measurement :
                    </th>
                    <td>
                        <asp:TextBox ID="txtMeasurement" runat="server"></asp:TextBox>
                    </td>--%>
                    <th>
                        surface water level threshold :
                    </th>
                    <td colspan="3">
                        <asp:TextBox ID="txtSWLevelThreshold" runat="server">11.5,13</asp:TextBox>
                        <select ID="ddlLevelUnit" runat="server">
                            <option value="Meters">meters</option>
                            <option value="Feet">feet</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <%-- <th>
                        measurement :
                    </th>
                    <td>
                        <asp:TextBox ID="txtMeasurement" runat="server"></asp:TextBox>
                    </td>--%>
                    <th>
                        surface water flow threshold :
                    </th>
                    <td colspan="3">
                        <asp:TextBox ID="txtSWFlowThreshold" runat="server">10.5,13</asp:TextBox>
                        <select id="ddlFlowUnit">
                            <option value="CubicMetersPerDay">cubic meters/day</option>
                            <option value="CubicFeetPerSecond">cubic feet/second</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>
                        frequency :
                    </th>
                    <td>
                        <asp:TextBox ID="txtMeasurementTime" runat="server">15,20</asp:TextBox>
                        miniutes
                    </td>
                    <!--
                    <th>
                        measurementUnit :
                    </th>
                    <td>
                        <asp:DropDownList ID="ddlMeasurementUnit" runat="server" DataTextField="FREQUENCY_UNIT"
                            DataValueField="NO">
                        </asp:DropDownList>
                    </td>-->
                </tr>
                <tr>
                    <th>
                        <select onchange="switchMode(this)">
                            <option value="L">LatLng</option>
                            <option value="S">Station ID</option>
                        </select>
                    </th>
                    <td colspan="3">
                        <asp:TextBox ID="txtStationID" runat="server" Style="display: none; width: 500px;">ca.gc.ec.station.05NB007,05116000</asp:TextBox>
                        <asp:TextBox ID="txtPosition" runat="server" Style="width: 500px;">48.257599 -100.511856,49.37833023 -100.78943634</asp:TextBox>
                    </td>
                </tr>
                <%--                <tr>
                    <th>
                        NotificationType :
                    </th>
                    <td colspan="3">
                        <asp:DropDownList ID="ddlNotificationType" runat="server" DataTextField="TYPE" DataValueField="NO">
                        </asp:DropDownList>
                    </td>
                </tr>--%>
            </table>
            <input type="button" id="btnSubscribe" value="Subscribe" onclick="dosubscribe()" />
            &nbsp;&nbsp;&nbsp;&nbsp;
            <input type="button" id="Button1" value="GetUserSubscription" onclick="GetUserSubscription()" /> <br />
            <input type="button" value="Unsubscribe" onclick="unsubscribe()" /> <input type="text" id="txtPoiIDs" /> <br />
        </ContentTemplate>
    </asp:UpdatePanel>
    </form>
    <br />
    URL : <span id="txtUrl"></span>
    <table cellspacing="0" style="width: 90%">
        <tr>
            <th style="border: 1px solid black; width: 150px; border-bottom: 0px;">
                Request Content
            </th>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td id="requestContent" colspan="2" style="border: 1px solid black; height: 100px;
                vertical-align: top; font-size: 13pt;">
                &nbsp;
            </td>
        </tr>
    </table>
    <br />
    <br />
    <table cellspacing="0" style="width: 90%">
        <tr>
            <th style="border: 1px solid black; width: 150px; border-bottom: 0px;">
                Response Content
            </th>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td id="responseContent" colspan="2" style="border: 1px solid black; height: 100px;
                vertical-align: top;">
                &nbsp;
            </td>
        </tr>
    </table>
</body>
</html>
