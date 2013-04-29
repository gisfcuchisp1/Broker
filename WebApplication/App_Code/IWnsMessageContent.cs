using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ogc.wns;
using ogc.service;

/// <summary>
/// This is a interface for WNS message generating.
/// To implement this can tell WNS how to generate messages.
/// </summary>
public interface IWnsMessageGenerator
{
    /// <summary>
    /// The subject of the message is sent to user when the user registers in WNS.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of RegisterUser</param>
    /// <param name="response">The response of the operation of RegisterUser</param>
    /// <returns>the message subject</returns>
    string genRegisterUserSubject(CommunicationProtocol protocol, RegisterUserType request, RegisterUserResponseType response);
    /// <summary>
    /// The content of the message sent to user is created when the user registers in WNS.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of RegisterUser</param>
    /// <param name="response">The response of the operation of RegisterUser</param>
    /// <returns>the message content</returns>
    string genRegisterUserContent(CommunicationProtocol protocol, RegisterUserType request, RegisterUserResponseType response);

    /// <summary>
    /// The subject of the message is sent to user when the registration is failed.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of RegisterUser</param>
    /// <param name="exception">The exceptions response of the operation of RegisterUser</param>
    /// <returns>the message subject</returns>
    string genRegisterUserSubject(CommunicationProtocol protocol, RegisterUserType request, ServiceExceptionReport exception);
    /// <summary>
    /// The content of the message sent to user is created when the registration is failed.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of RegisterUser</param>
    /// <param name="exception">The exceptions of the operation of RegisterUser</param>
    /// <returns>the message content</returns>
    string genRegisterUserContent(CommunicationProtocol protocol, RegisterUserType request, ServiceExceptionReport exception);

    /// <summary>
    /// The subject of the message sent to user is created when the operation of Dontification is requested.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of DoNotification</param>
    /// <returns>the message subject</returns>
    string genNotificationSubject(CommunicationProtocol protocol, DoNotificationType request);
    /// <summary>
    /// The content of the message sent to user is created when the operation of Dontification is requested.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of DoNotification</param>
    /// <returns></returns>
    string genNotificationContent(CommunicationProtocol protocol, DoNotificationType request);

    /// <summary>
    /// The content of the message sent to user is created when the operation of DoCommunication is requested.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of DoCommunication</param>
    /// <returns></returns>
    string genCommunicationSubject(CommunicationProtocol protocol, DoCommunicationType request);
    /// <summary>
    /// The content of the message sent to user is created when the operation of DoCommunication is requested.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of DoCommunication</param>
    /// <returns></returns>
    string genCommunicationContent(CommunicationProtocol protocol, DoCommunicationType request);

    /// <summary>
    /// The content of the message sent to user is created when the operation of DoReply is requested.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of DoReply</param>
    /// <returns></returns>
    string genReplySubject(CommunicationProtocol protocol, DoReplyType request);
    /// <summary>
    /// The content of the message sent to user is created when the operation of DoReply is requested.
    /// </summary>
    /// <param name="protocol">The message is sent via the protocol.</param>
    /// <param name="request">The request of the operation of DoReply</param>
    /// <returns></returns>
    string genReplyContent(CommunicationProtocol protocol, DoReplyType request);
}

/// <summary>
/// the protocol of the sending message 
/// </summary>
public enum CommunicationProtocol
{
    Email = ItemChoiceType3.Email,
    Fax = ItemChoiceType3.Fax,
    SMS = ItemChoiceType3.SMS,
    InstantMessaging = ItemChoiceType3.InstantMessaging,
    Phone = ItemChoiceType3.Phone,
    URL = ItemChoiceType3.URL
}
