using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WNSModel;
using ogc.wns;

namespace Chisp1
{
    /// <summary>
    /// How to generate WNS messages for Chisp1
    /// </summary>
    public class Chisp1MessageGenerator : IWnsMessageGenerator
    {
        public Chisp1MessageGenerator()
        {
        }

        string IWnsMessageGenerator.genRegisterUserSubject(CommunicationProtocol protocol, ogc.wns.RegisterUserType request, ogc.wns.RegisterUserResponseType response)
        {
            throw new NotSupportedException();
        }

        string IWnsMessageGenerator.genRegisterUserContent(CommunicationProtocol protocol, ogc.wns.RegisterUserType request, ogc.wns.RegisterUserResponseType response)
        {
            throw new NotSupportedException();
        }

        string IWnsMessageGenerator.genRegisterUserSubject(CommunicationProtocol protocol, ogc.wns.RegisterUserType request, ogc.service.ServiceExceptionReport exception)
        {
            if (protocol != CommunicationProtocol.Email)
                throw new NotSupportedException();
            return "Registration Fail";
        }

        string IWnsMessageGenerator.genRegisterUserContent(CommunicationProtocol protocol, ogc.wns.RegisterUserType request, ogc.service.ServiceExceptionReport exception)
        {
            if (protocol != CommunicationProtocol.Email)
                throw new NotSupportedException();
            return "Dear " + request.Name + " : <br><br> Your registration has Failed.";
        }

        string IWnsMessageGenerator.genNotificationSubject(CommunicationProtocol protocol, ogc.wns.DoNotificationType request)
        {
            if (protocol != CommunicationProtocol.Email)
                throw new NotSupportedException();
            var parameters = request.Message.MessageParameter;
            var status = getValue<string>(request, "status");
            string ret = "";
            if (status == "Valid")
            {
                ret = "Subscription Success";
            }
            else if (status == "Invalid")
            {
                ret = "The subscription poi is invalid";
            }
            else if (status == "Alert")
            {
                ret = getValue<string>(request,"headline");
            }
            return ret;
        }

        string IWnsMessageGenerator.genNotificationContent(CommunicationProtocol protocol, ogc.wns.DoNotificationType request)
        {
            if (protocol != CommunicationProtocol.Email)
                throw new NotSupportedException();
            var parameters = request.Message.MessageParameter;
            var status = getValue<string>(request, "status");
            string ret = "";
            var poiType = getValue<string>(request, "poiType");
            if (status == "Valid")
            {
                if (poiType == "P")
                {
                    ret = String.Format(
@"
You have subscribed a position(latitude={0},longitude={1}).<br> 
There are {2} stations on upstream of the poisition.<br> 
The notification frequency of events is {3} minutes.<br> 
",
                                getValue<string>(request, "lat"),
                                getValue<string>(request, "lng"),
                                getValue<string>(request, "stationNumber"),
                                getValue<string>(request, "frequency")
                           );
                }
                else if (poiType == "S")
                {
                    ret = String.Format(
@"
You have subscribed a station({0}).<br> 
The notification frequency of events is {1} minutes.<br> 
",
                                getValue<string>(request, "stationID"),
                                getValue<string>(request, "frequency")
                           );
                }
                string tmp = getValue<string>(request, "swLevelThreshold");
                if (tmp != default(string))
                {
                    ret += "Surface Water Level Threshold : " + tmp + " " + getValue<string>(request, "swLevelThresholdUnit") + "<br>";
                }
                tmp = getValue<string>(request, "swFlowThreshold");
                if (tmp != default(string))
                {
                    ret += "Surface Water Flow Threshold : " + tmp + " " + getValue<string>(request, "swFlowThresholdUnit") + "<br>";
                }
            }
            else if (status == "Invalid")
            {
                if (poiType == "P")
                {
                    ret = String.Format(
@"
You have subscribed a position(latitude={0},longitude={1}).<br> 
There is no station on upstream of the poisition.<br> 
This position is invalid.
",
                                getValue<string>(request, "lat"),
                                getValue<string>(request, "lng")
                           );
                }
                else
                {
                    ret = String.Format(
@"
You have subscribed a station({0}).<br> 
The station does not exist.<br> 
This subscription is invalid.
",
                                getValue<string>(request, "stationID")
                           );

                }
            }
            else if (status == "Alert")
            {
                ret = getValue<string>(request, "content");
            }

            return ret;
        }

        private T getValue<T>(ogc.wns.DoNotificationType request, string key)
        {
            var param = request.Message.MessageParameter.SingleOrDefault(r => r.Key == key);
            return (T)(param == null ? default(T) : (typeof(T) == typeof(String) ? param.Item.ToString() : param.Item));
        }

        string IWnsMessageGenerator.genCommunicationSubject(CommunicationProtocol protocol, ogc.wns.DoCommunicationType request)
        {
            throw new NotSupportedException();
        }

        string IWnsMessageGenerator.genCommunicationContent(CommunicationProtocol protocol, ogc.wns.DoCommunicationType request)
        {
            throw new NotSupportedException();
        }

        string IWnsMessageGenerator.genReplySubject(CommunicationProtocol protocol, ogc.wns.DoReplyType request)
        {
            throw new NotSupportedException();
        }

        string IWnsMessageGenerator.genReplyContent(CommunicationProtocol protocol, ogc.wns.DoReplyType request)
        {
            throw new NotSupportedException();
        }

    }
}