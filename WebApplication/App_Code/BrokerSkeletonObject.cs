using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;


// ================================================
// ======== request/response result struct ========
// ================================================

public class RegisterUser
{
    public String email { get; set; }
    public String role { get; set; }
}

public class SubscribeContent
{
    public String email { get; set; }
    public long frequency { get; set; }
    public double? swLevelThreshold { get; set; }
    public double? swFlowThreshold { get; set; }
    public String swLevelThresholdUnit { get; set; }
    public String swFlowThresholdUnit { get; set; }
    public double? lat { get; set; }
    public double? lng { get; set; }
    public String stationID { get; set; }
    public String poiType { get; set; }

    public String status { get; set; }
    public long poiID { get; set; }
}

public class SubcribeResponse
{
    public long[] poiIDs { get; set; }
    public String code { get; set; }
    public String message { get; set; }
}

public class ResponseMessage
{
    public ResponseMessage(){}
    public ResponseMessage(String code, String msg)
    {
        this.code = code;
        this.message = msg;
    }
    public String code { get; set; }
    public String message { get; set; }
}
