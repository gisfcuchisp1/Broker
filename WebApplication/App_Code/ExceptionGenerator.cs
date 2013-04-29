using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ogc.wns;
using ogc.service;
using System.ComponentModel;


/// <summary>
/// To generate a Exception Message Entity
/// </summary>
public static class ExceptionGen
{
    private static Dictionary<ExceptionCode, ServiceExceptionType> _dtnException = null;
    private static Dictionary<ExceptionCode, ServiceExceptionType> dtnException
    {
        get
        {
            if (_dtnException == null)
                GenExceptions();
            return _dtnException;
        }
    }
    private static void GenExceptions()
    {
        _dtnException = new Dictionary<ExceptionCode, ServiceExceptionType>();
        var codes = Util.getAllEnum<ExceptionCode>();
        foreach (var code in codes)
        {
            _dtnException.Add(code, new ServiceExceptionType() { code = Util.getDescription(code) });
        }
    }


    public static ServiceExceptionType getException(ExceptionCode code)
    {
        return dtnException[code];
    }

    public static ServiceExceptionReport getServiceReport(ExceptionCode code)
    {
        return new ServiceExceptionReport()
        {
            ServiceException = new ServiceExceptionType[] { 
                            ExceptionGen.getException(code)
                        }
        };
    }

}

public enum ExceptionCode
{
    [Description("Unhandling Error")]
    UnhandlingError,
    [Description("Invalid XML Formate")]
    InvalidXMLFormate,
    [Description("Invalid Request Formate")]
    InvalidRequestFormate,
    [Description("Unexpected Operation")]
    UnexpectedOperation,
    [Description("Unsupported Operation")]
    UnsupportedOperation,
    [Description("System Error")]
    SystemError,
    [Description("User Not Found")]
    UserNotFound
}
