namespace ogc.wns {
    using System.Xml.Serialization;
    
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("NotificationMessage", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class NotificationMessageType {
        
        private NotificationMessageTypeType typeField;
        
        private NotificationMessageTypeMessageParameter[] messageParameterField;
        
        /// <remarks/>
        public NotificationMessageTypeType Type {
            get {
                return this.typeField;
            }
            set {
                this.typeField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("MessageParameter")]
        public NotificationMessageTypeMessageParameter[] MessageParameter {
            get {
                return this.messageParameterField;
            }
            set {
                this.messageParameterField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public enum NotificationMessageTypeType {
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Operation completed")]
        Operationcompleted,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Operation failed")]
        Operationfailed,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Operation cancelled")]
        Operationcancelled,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Operation delayed")]
        Operationdelayed,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("New data available")]
        Newdataavailable,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public partial class NotificationMessageTypeMessageParameter {
        
        private long corrIDField;
        
        private string keyField;
        
        private object itemField;
        
        private ItemChoiceType itemElementNameField;
        
        /// <remarks/>
        public long CorrID {
            get {
                return this.corrIDField;
            }
            set {
                this.corrIDField = value;
            }
        }
        
        /// <remarks/>
        public string Key {
            get {
                return this.keyField;
            }
            set {
                this.keyField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Double", typeof(double))]
        [System.Xml.Serialization.XmlElementAttribute("Float", typeof(float))]
        [System.Xml.Serialization.XmlElementAttribute("Integer", typeof(string), DataType="integer")]
        [System.Xml.Serialization.XmlElementAttribute("Long", typeof(long))]
        [System.Xml.Serialization.XmlElementAttribute("String", typeof(string))]
        [System.Xml.Serialization.XmlElementAttribute("URI", typeof(string), DataType="anyURI")]
        [System.Xml.Serialization.XmlChoiceIdentifierAttribute("ItemElementName")]
        public object Item {
            get {
                return this.itemField;
            }
            set {
                this.itemField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public ItemChoiceType ItemElementName {
            get {
                return this.itemElementNameField;
            }
            set {
                this.itemElementNameField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns", IncludeInSchema=false)]
    public enum ItemChoiceType {
        
        /// <remarks/>
        Double,
        
        /// <remarks/>
        Float,
        
        /// <remarks/>
        Integer,
        
        /// <remarks/>
        Long,
        
        /// <remarks/>
        String,
        
        /// <remarks/>
        URI,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    public partial class CommunicationProtocolType {
        
        private object itemField;
        
        private ItemChoiceType3 itemElementNameField;
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Email", typeof(string))]
        [System.Xml.Serialization.XmlElementAttribute("Fax", typeof(ulong))]
        [System.Xml.Serialization.XmlElementAttribute("InstantMessaging", typeof(string))]
        [System.Xml.Serialization.XmlElementAttribute("Phone", typeof(ulong))]
        [System.Xml.Serialization.XmlElementAttribute("SMS", typeof(ulong))]
        [System.Xml.Serialization.XmlElementAttribute("URL", typeof(string), DataType="anyURI")]
        [System.Xml.Serialization.XmlChoiceIdentifierAttribute("ItemElementName")]
        public object Item {
            get {
                return this.itemField;
            }
            set {
                this.itemField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public ItemChoiceType3 ItemElementName {
            get {
                return this.itemElementNameField;
            }
            set {
                this.itemElementNameField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns", IncludeInSchema=false)]
    public enum ItemChoiceType3 {
        
        /// <remarks/>
        Email,
        
        /// <remarks/>
        Fax,
        
        /// <remarks/>
        InstantMessaging,
        
        /// <remarks/>
        Phone,
        
        /// <remarks/>
        SMS,
        
        /// <remarks/>
        URL,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    public partial class DCPType {
        
        private DCPTypeHTTP hTTPField;
        
        /// <remarks/>
        public DCPTypeHTTP HTTP {
            get {
                return this.hTTPField;
            }
            set {
                this.hTTPField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public partial class DCPTypeHTTP {
        
        private object getField;
        
        private object postField;
        
        /// <remarks/>
        public object Get {
            get {
                return this.getField;
            }
            set {
                this.getField = value;
            }
        }
        
        /// <remarks/>
        public object Post {
            get {
                return this.postField;
            }
            set {
                this.postField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    public partial class RequestDescriptionType {
        
        private string formatField;
        
        private DCPType dCPTypeField;
        
        /// <remarks/>
        public string Format {
            get {
                return this.formatField;
            }
            set {
                this.formatField = value;
            }
        }
        
        /// <remarks/>
        public DCPType DCPType {
            get {
                return this.dCPTypeField;
            }
            set {
                this.dCPTypeField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    public partial class RequestType {
        
        private RequestDescriptionType getCapabilitiesField;
        
        private RequestDescriptionType registerUserField;
        
        private RequestDescriptionType doNotificationField;
        
        private RequestDescriptionType doCommunicationField;
        
        private RequestDescriptionType doReplyField;
        
        /// <remarks/>
        public RequestDescriptionType GetCapabilities {
            get {
                return this.getCapabilitiesField;
            }
            set {
                this.getCapabilitiesField = value;
            }
        }
        
        /// <remarks/>
        public RequestDescriptionType RegisterUser {
            get {
                return this.registerUserField;
            }
            set {
                this.registerUserField = value;
            }
        }
        
        /// <remarks/>
        public RequestDescriptionType DoNotification {
            get {
                return this.doNotificationField;
            }
            set {
                this.doNotificationField = value;
            }
        }
        
        /// <remarks/>
        public RequestDescriptionType DoCommunication {
            get {
                return this.doCommunicationField;
            }
            set {
                this.doCommunicationField = value;
            }
        }
        
        /// <remarks/>
        public RequestDescriptionType DoReply {
            get {
                return this.doReplyField;
            }
            set {
                this.doReplyField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    public partial class ContactInformationType {
        
        private string contactPersonField;
        
        private string contactOrganizationField;
        
        private string emailField;
        
        /// <remarks/>
        public string ContactPerson {
            get {
                return this.contactPersonField;
            }
            set {
                this.contactPersonField = value;
            }
        }
        
        /// <remarks/>
        public string ContactOrganization {
            get {
                return this.contactOrganizationField;
            }
            set {
                this.contactOrganizationField = value;
            }
        }
        
        /// <remarks/>
        public string Email {
            get {
                return this.emailField;
            }
            set {
                this.emailField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("CommunicationRequestMessage", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class CommunicationRequestMessageType {
        
        private CommunicationAction actionField;
        
        private CommunicationRequestMessageTypeMessageParameter[] messageParameterField;
        
        /// <remarks/>
        public CommunicationAction Action {
            get {
                return this.actionField;
            }
            set {
                this.actionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("MessageParameter")]
        public CommunicationRequestMessageTypeMessageParameter[] MessageParameter {
            get {
                return this.messageParameterField;
            }
            set {
                this.messageParameterField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    public enum CommunicationAction {
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Information needed")]
        Informationneeded,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Allowance to proceed")]
        Allowancetoproceed,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Allowance to abort")]
        Allowancetoabort,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public partial class CommunicationRequestMessageTypeMessageParameter {
        
        private long corrIDField;
        
        private string keyField;
        
        private object itemField;
        
        private ItemChoiceType1 itemElementNameField;
        
        private string unitField;
        
        private string optionsField;
        
        /// <remarks/>
        public long CorrID {
            get {
                return this.corrIDField;
            }
            set {
                this.corrIDField = value;
            }
        }
        
        /// <remarks/>
        public string Key {
            get {
                return this.keyField;
            }
            set {
                this.keyField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Double", typeof(double))]
        [System.Xml.Serialization.XmlElementAttribute("Float", typeof(float))]
        [System.Xml.Serialization.XmlElementAttribute("Integer", typeof(string), DataType="integer")]
        [System.Xml.Serialization.XmlElementAttribute("Long", typeof(long))]
        [System.Xml.Serialization.XmlElementAttribute("String", typeof(string))]
        [System.Xml.Serialization.XmlElementAttribute("URI", typeof(string), DataType="anyURI")]
        [System.Xml.Serialization.XmlChoiceIdentifierAttribute("ItemElementName")]
        public object Item {
            get {
                return this.itemField;
            }
            set {
                this.itemField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public ItemChoiceType1 ItemElementName {
            get {
                return this.itemElementNameField;
            }
            set {
                this.itemElementNameField = value;
            }
        }
        
        /// <remarks/>
        public string Unit {
            get {
                return this.unitField;
            }
            set {
                this.unitField = value;
            }
        }
        
        /// <remarks/>
        public string Options {
            get {
                return this.optionsField;
            }
            set {
                this.optionsField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns", IncludeInSchema=false)]
    public enum ItemChoiceType1 {
        
        /// <remarks/>
        Double,
        
        /// <remarks/>
        Float,
        
        /// <remarks/>
        Integer,
        
        /// <remarks/>
        Long,
        
        /// <remarks/>
        String,
        
        /// <remarks/>
        URI,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("CommunicationReplyMessage", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class CommunicationReplyMessageType {
        
        private string actionField;
        
        private CommunicationReplyMessageTypeMessageParameter[] messageParameterField;
        
        /// <remarks/>
        public string Action {
            get {
                return this.actionField;
            }
            set {
                this.actionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("MessageParameter")]
        public CommunicationReplyMessageTypeMessageParameter[] MessageParameter {
            get {
                return this.messageParameterField;
            }
            set {
                this.messageParameterField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public partial class CommunicationReplyMessageTypeMessageParameter {
        
        private long corrIDField;
        
        private string keyField;
        
        private object itemField;
        
        private ItemChoiceType2 itemElementNameField;
        
        private string valueField;
        
        /// <remarks/>
        public long CorrID {
            get {
                return this.corrIDField;
            }
            set {
                this.corrIDField = value;
            }
        }
        
        /// <remarks/>
        public string Key {
            get {
                return this.keyField;
            }
            set {
                this.keyField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Double", typeof(double))]
        [System.Xml.Serialization.XmlElementAttribute("Float", typeof(float))]
        [System.Xml.Serialization.XmlElementAttribute("Integer", typeof(string), DataType="integer")]
        [System.Xml.Serialization.XmlElementAttribute("Long", typeof(long))]
        [System.Xml.Serialization.XmlElementAttribute("String", typeof(string))]
        [System.Xml.Serialization.XmlElementAttribute("URI", typeof(string), DataType="anyURI")]
        [System.Xml.Serialization.XmlChoiceIdentifierAttribute("ItemElementName")]
        public object Item {
            get {
                return this.itemField;
            }
            set {
                this.itemField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public ItemChoiceType2 ItemElementName {
            get {
                return this.itemElementNameField;
            }
            set {
                this.itemElementNameField = value;
            }
        }
        
        /// <remarks/>
        public string Value {
            get {
                return this.valueField;
            }
            set {
                this.valueField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns", IncludeInSchema=false)]
    public enum ItemChoiceType2 {
        
        /// <remarks/>
        Double,
        
        /// <remarks/>
        Float,
        
        /// <remarks/>
        Integer,
        
        /// <remarks/>
        Long,
        
        /// <remarks/>
        String,
        
        /// <remarks/>
        URI,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("GetCapabilities", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class GetCapabilitiesType {
        
        private GetCapabilitiesTypeService serviceField;
        
        private RequestType capabilitiesField;
        
        private string versionField;
        
        private string service1Field;
        
        private string updateSequenceStringField;
        
        public GetCapabilitiesType() {
            this.versionField = "0.0.1";
            this.service1Field = "WNS";
        }
        
        /// <remarks/>
        public GetCapabilitiesTypeService Service {
            get {
                return this.serviceField;
            }
            set {
                this.serviceField = value;
            }
        }
        
        /// <remarks/>
        public RequestType Capabilities {
            get {
                return this.capabilitiesField;
            }
            set {
                this.capabilitiesField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Version {
            get {
                return this.versionField;
            }
            set {
                this.versionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute("Service")]
        public string Service1 {
            get {
                return this.service1Field;
            }
            set {
                this.service1Field = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string UpdateSequenceString {
            get {
                return this.updateSequenceStringField;
            }
            set {
                this.updateSequenceStringField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public partial class GetCapabilitiesTypeService {
        
        private string nameField;
        
        private string titleField;
        
        private string[] keywordlistField;
        
        private ContactInformationType contactInformationField;
        
        /// <remarks/>
        public string Name {
            get {
                return this.nameField;
            }
            set {
                this.nameField = value;
            }
        }
        
        /// <remarks/>
        public string Title {
            get {
                return this.titleField;
            }
            set {
                this.titleField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute("Keyword", IsNullable=false)]
        public string[] Keywordlist {
            get {
                return this.keywordlistField;
            }
            set {
                this.keywordlistField = value;
            }
        }
        
        /// <remarks/>
        public ContactInformationType ContactInformation {
            get {
                return this.contactInformationField;
            }
            set {
                this.contactInformationField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("RegisterUser", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class RegisterUserType {
        
        private string nameField;
        
        private CommunicationProtocolType communicationProtocolField;
        
        private string versionField;
        
        private string serviceField;
        
        public RegisterUserType() {
            this.versionField = "0.0.1";
            this.serviceField = "WNS";
        }
        
        /// <remarks/>
        public string Name {
            get {
                return this.nameField;
            }
            set {
                this.nameField = value;
            }
        }
        
        /// <remarks/>
        public CommunicationProtocolType CommunicationProtocol {
            get {
                return this.communicationProtocolField;
            }
            set {
                this.communicationProtocolField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Version {
            get {
                return this.versionField;
            }
            set {
                this.versionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Service {
            get {
                return this.serviceField;
            }
            set {
                this.serviceField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("DoNotification", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class DoNotificationType {
        
        private ulong userIDField;
        
        private NotificationMessageType messageField;
        
        private string versionField;
        
        private string serviceField;
        
        public DoNotificationType() {
            this.versionField = "0.0.1";
            this.serviceField = "WNS";
        }
        
        /// <remarks/>
        public ulong UserID {
            get {
                return this.userIDField;
            }
            set {
                this.userIDField = value;
            }
        }
        
        /// <remarks/>
        public NotificationMessageType Message {
            get {
                return this.messageField;
            }
            set {
                this.messageField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Version {
            get {
                return this.versionField;
            }
            set {
                this.versionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Service {
            get {
                return this.serviceField;
            }
            set {
                this.serviceField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("DoCommunication", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class DoCommunicationType {
        
        private ulong userIDField;
        
        private string callbackServerURLField;
        
        private CommunicationRequestMessageType messageField;
        
        /// <remarks/>
        public ulong UserID {
            get {
                return this.userIDField;
            }
            set {
                this.userIDField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType="anyURI")]
        public string CallbackServerURL {
            get {
                return this.callbackServerURLField;
            }
            set {
                this.callbackServerURLField = value;
            }
        }
        
        /// <remarks/>
        public CommunicationRequestMessageType Message {
            get {
                return this.messageField;
            }
            set {
                this.messageField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("DoReply", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class DoReplyType {
        
        private ulong userIDField;
        
        private ulong corrIDField;
        
        private string callbackServerURLField;
        
        private CommunicationReplyMessageType messageField;
        
        /// <remarks/>
        public ulong UserID {
            get {
                return this.userIDField;
            }
            set {
                this.userIDField = value;
            }
        }
        
        /// <remarks/>
        public ulong CorrID {
            get {
                return this.corrIDField;
            }
            set {
                this.corrIDField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType="anyURI")]
        public string CallbackServerURL {
            get {
                return this.callbackServerURLField;
            }
            set {
                this.callbackServerURLField = value;
            }
        }
        
        /// <remarks/>
        public CommunicationReplyMessageType Message {
            get {
                return this.messageField;
            }
            set {
                this.messageField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("RegisterUserResponse", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class RegisterUserResponseType {
        
        private ulong userIDField;
        
        /// <remarks/>
        public ulong UserID {
            get {
                return this.userIDField;
            }
            set {
                this.userIDField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("DoNotificationResponse", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class DoNotificationResponseType {
        
        private DoNotificationResponseTypeStatus statusField;
        
        /// <remarks/>
        public DoNotificationResponseTypeStatus Status {
            get {
                return this.statusField;
            }
            set {
                this.statusField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public enum DoNotificationResponseTypeStatus {
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Notification sending successful")]
        Notificationsendingsuccessful,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Notification sending failed")]
        Notificationsendingfailed,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Notification timed out")]
        Notificationtimedout,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("DoCommunicationResponse", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class DoCommunicationResponseType {
        
        private DoCommunicationResponseTypeStatus statusField;
        
        /// <remarks/>
        public DoCommunicationResponseTypeStatus Status {
            get {
                return this.statusField;
            }
            set {
                this.statusField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public enum DoCommunicationResponseTypeStatus {
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Communication sending successfull")]
        Communicationsendingsuccessfull,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Communication sending failed")]
        Communicationsendingfailed,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Communication sending timed out")]
        Communicationsendingtimedout,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/wns")]
    [System.Xml.Serialization.XmlRootAttribute("DoReplyResponse", Namespace="http://www.opengis.net/wns", IsNullable=false)]
    public partial class DoReplyResponseType {
        
        private DoReplyResponseTypeStatus statusField;
        
        /// <remarks/>
        public DoReplyResponseTypeStatus Status {
            get {
                return this.statusField;
            }
            set {
                this.statusField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/wns")]
    public enum DoReplyResponseTypeStatus {
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Reply forwarding successfully")]
        Replyforwardingsuccessfully,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Reply forwarding failed")]
        Replyforwardingfailed,
        
        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("Reply forwarding timed out")]
        Replyforwardingtimedout,
    }
}
