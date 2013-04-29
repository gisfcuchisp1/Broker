namespace ogc.capalert {
    using System.Xml.Serialization;
    
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace="urn:oasis:names:tc:emergency:cap:1.2", IsNullable=false)]
    public partial class alert {
        
        private string identifierField;
        
        private string senderField;
        
        private System.DateTime sentField;
        
        private alertStatus statusField;
        
        private alertMsgType msgTypeField;
        
        private string sourceField;
        
        private alertScope scopeField;
        
        private string restrictionField;
        
        private string addressesField;
        
        private string[] codeField;
        
        private string noteField;
        
        private string referencesField;
        
        private string incidentsField;
        
        private alertInfo[] infoField;
        
        private System.Xml.XmlElement[] anyField;
        
        /// <remarks/>
        public string identifier {
            get {
                return this.identifierField;
            }
            set {
                this.identifierField = value;
            }
        }
        
        /// <remarks/>
        public string sender {
            get {
                return this.senderField;
            }
            set {
                this.senderField = value;
            }
        }
        
        /// <remarks/>
        public System.DateTime sent {
            get {
                return this.sentField;
            }
            set {
                this.sentField = value;
            }
        }
        
        /// <remarks/>
        public alertStatus status {
            get {
                return this.statusField;
            }
            set {
                this.statusField = value;
            }
        }
        
        /// <remarks/>
        public alertMsgType msgType {
            get {
                return this.msgTypeField;
            }
            set {
                this.msgTypeField = value;
            }
        }
        
        /// <remarks/>
        public string source {
            get {
                return this.sourceField;
            }
            set {
                this.sourceField = value;
            }
        }
        
        /// <remarks/>
        public alertScope scope {
            get {
                return this.scopeField;
            }
            set {
                this.scopeField = value;
            }
        }
        
        /// <remarks/>
        public string restriction {
            get {
                return this.restrictionField;
            }
            set {
                this.restrictionField = value;
            }
        }
        
        /// <remarks/>
        public string addresses {
            get {
                return this.addressesField;
            }
            set {
                this.addressesField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("code")]
        public string[] code {
            get {
                return this.codeField;
            }
            set {
                this.codeField = value;
            }
        }
        
        /// <remarks/>
        public string note {
            get {
                return this.noteField;
            }
            set {
                this.noteField = value;
            }
        }
        
        /// <remarks/>
        public string references {
            get {
                return this.referencesField;
            }
            set {
                this.referencesField = value;
            }
        }
        
        /// <remarks/>
        public string incidents {
            get {
                return this.incidentsField;
            }
            set {
                this.incidentsField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("info")]
        public alertInfo[] info {
            get {
                return this.infoField;
            }
            set {
                this.infoField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAnyElementAttribute()]
        public System.Xml.XmlElement[] Any {
            get {
                return this.anyField;
            }
            set {
                this.anyField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertStatus {
        
        /// <remarks/>
        Actual,
        
        /// <remarks/>
        Exercise,
        
        /// <remarks/>
        System,
        
        /// <remarks/>
        Test,
        
        /// <remarks/>
        Draft,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertMsgType {
        
        /// <remarks/>
        Alert,
        
        /// <remarks/>
        Update,
        
        /// <remarks/>
        Cancel,
        
        /// <remarks/>
        Ack,
        
        /// <remarks/>
        Error,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertScope {
        
        /// <remarks/>
        Public,
        
        /// <remarks/>
        Restricted,
        
        /// <remarks/>
        Private,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public partial class alertInfo {
        
        private string languageField;
        
        private alertInfoCategory[] categoryField;
        
        private string eventField;
        
        private alertInfoResponseType[] responseTypeField;
        
        private alertInfoUrgency urgencyField;
        
        private alertInfoSeverity severityField;
        
        private alertInfoCertainty certaintyField;
        
        private string audienceField;
        
        private alertInfoEventCode[] eventCodeField;
        
        private System.DateTime effectiveField;
        
        private bool effectiveFieldSpecified;
        
        private System.DateTime onsetField;
        
        private bool onsetFieldSpecified;
        
        private System.DateTime expiresField;
        
        private bool expiresFieldSpecified;
        
        private string senderNameField;
        
        private string headlineField;
        
        private string descriptionField;
        
        private string instructionField;
        
        private string webField;
        
        private string contactField;
        
        private alertInfoParameter[] parameterField;
        
        private alertInfoResource[] resourceField;
        
        private alertInfoArea[] areaField;
        
        public alertInfo() {
            this.languageField = "en-US";
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType="language")]
        [System.ComponentModel.DefaultValueAttribute("en-US")]
        public string language {
            get {
                return this.languageField;
            }
            set {
                this.languageField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("category")]
        public alertInfoCategory[] category {
            get {
                return this.categoryField;
            }
            set {
                this.categoryField = value;
            }
        }
        
        /// <remarks/>
        public string @event {
            get {
                return this.eventField;
            }
            set {
                this.eventField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("responseType")]
        public alertInfoResponseType[] responseType {
            get {
                return this.responseTypeField;
            }
            set {
                this.responseTypeField = value;
            }
        }
        
        /// <remarks/>
        public alertInfoUrgency urgency {
            get {
                return this.urgencyField;
            }
            set {
                this.urgencyField = value;
            }
        }
        
        /// <remarks/>
        public alertInfoSeverity severity {
            get {
                return this.severityField;
            }
            set {
                this.severityField = value;
            }
        }
        
        /// <remarks/>
        public alertInfoCertainty certainty {
            get {
                return this.certaintyField;
            }
            set {
                this.certaintyField = value;
            }
        }
        
        /// <remarks/>
        public string audience {
            get {
                return this.audienceField;
            }
            set {
                this.audienceField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("eventCode")]
        public alertInfoEventCode[] eventCode {
            get {
                return this.eventCodeField;
            }
            set {
                this.eventCodeField = value;
            }
        }
        
        /// <remarks/>
        public System.DateTime effective {
            get {
                return this.effectiveField;
            }
            set {
                this.effectiveField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool effectiveSpecified {
            get {
                return this.effectiveFieldSpecified;
            }
            set {
                this.effectiveFieldSpecified = value;
            }
        }
        
        /// <remarks/>
        public System.DateTime onset {
            get {
                return this.onsetField;
            }
            set {
                this.onsetField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool onsetSpecified {
            get {
                return this.onsetFieldSpecified;
            }
            set {
                this.onsetFieldSpecified = value;
            }
        }
        
        /// <remarks/>
        public System.DateTime expires {
            get {
                return this.expiresField;
            }
            set {
                this.expiresField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool expiresSpecified {
            get {
                return this.expiresFieldSpecified;
            }
            set {
                this.expiresFieldSpecified = value;
            }
        }
        
        /// <remarks/>
        public string senderName {
            get {
                return this.senderNameField;
            }
            set {
                this.senderNameField = value;
            }
        }
        
        /// <remarks/>
        public string headline {
            get {
                return this.headlineField;
            }
            set {
                this.headlineField = value;
            }
        }
        
        /// <remarks/>
        public string description {
            get {
                return this.descriptionField;
            }
            set {
                this.descriptionField = value;
            }
        }
        
        /// <remarks/>
        public string instruction {
            get {
                return this.instructionField;
            }
            set {
                this.instructionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType="anyURI")]
        public string web {
            get {
                return this.webField;
            }
            set {
                this.webField = value;
            }
        }
        
        /// <remarks/>
        public string contact {
            get {
                return this.contactField;
            }
            set {
                this.contactField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("parameter")]
        public alertInfoParameter[] parameter {
            get {
                return this.parameterField;
            }
            set {
                this.parameterField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("resource")]
        public alertInfoResource[] resource {
            get {
                return this.resourceField;
            }
            set {
                this.resourceField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("area")]
        public alertInfoArea[] area {
            get {
                return this.areaField;
            }
            set {
                this.areaField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertInfoCategory {
        
        /// <remarks/>
        Geo,
        
        /// <remarks/>
        Met,
        
        /// <remarks/>
        Safety,
        
        /// <remarks/>
        Security,
        
        /// <remarks/>
        Rescue,
        
        /// <remarks/>
        Fire,
        
        /// <remarks/>
        Health,
        
        /// <remarks/>
        Env,
        
        /// <remarks/>
        Transport,
        
        /// <remarks/>
        Infra,
        
        /// <remarks/>
        CBRNE,
        
        /// <remarks/>
        Other,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertInfoResponseType {
        
        /// <remarks/>
        Shelter,
        
        /// <remarks/>
        Evacuate,
        
        /// <remarks/>
        Prepare,
        
        /// <remarks/>
        Execute,
        
        /// <remarks/>
        Avoid,
        
        /// <remarks/>
        Monitor,
        
        /// <remarks/>
        Assess,
        
        /// <remarks/>
        AllClear,
        
        /// <remarks/>
        None,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertInfoUrgency {
        
        /// <remarks/>
        Immediate,
        
        /// <remarks/>
        Expected,
        
        /// <remarks/>
        Future,
        
        /// <remarks/>
        Past,
        
        /// <remarks/>
        Unknown,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertInfoSeverity {
        
        /// <remarks/>
        Extreme,
        
        /// <remarks/>
        Severe,
        
        /// <remarks/>
        Moderate,
        
        /// <remarks/>
        Minor,
        
        /// <remarks/>
        Unknown,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public enum alertInfoCertainty {
        
        /// <remarks/>
        Observed,
        
        /// <remarks/>
        Likely,
        
        /// <remarks/>
        Possible,
        
        /// <remarks/>
        Unlikely,
        
        /// <remarks/>
        Unknown,
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public partial class alertInfoEventCode {
        
        private string valueNameField;
        
        private string valueField;
        
        /// <remarks/>
        public string valueName {
            get {
                return this.valueNameField;
            }
            set {
                this.valueNameField = value;
            }
        }
        
        /// <remarks/>
        public string value {
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
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public partial class alertInfoParameter {
        
        private string valueNameField;
        
        private string valueField;
        
        /// <remarks/>
        public string valueName {
            get {
                return this.valueNameField;
            }
            set {
                this.valueNameField = value;
            }
        }
        
        /// <remarks/>
        public string value {
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
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public partial class alertInfoResource {
        
        private string resourceDescField;
        
        private string mimeTypeField;
        
        private string sizeField;
        
        private string uriField;
        
        private string derefUriField;
        
        private string digestField;
        
        /// <remarks/>
        public string resourceDesc {
            get {
                return this.resourceDescField;
            }
            set {
                this.resourceDescField = value;
            }
        }
        
        /// <remarks/>
        public string mimeType {
            get {
                return this.mimeTypeField;
            }
            set {
                this.mimeTypeField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType="integer")]
        public string size {
            get {
                return this.sizeField;
            }
            set {
                this.sizeField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType="anyURI")]
        public string uri {
            get {
                return this.uriField;
            }
            set {
                this.uriField = value;
            }
        }
        
        /// <remarks/>
        public string derefUri {
            get {
                return this.derefUriField;
            }
            set {
                this.derefUriField = value;
            }
        }
        
        /// <remarks/>
        public string digest {
            get {
                return this.digestField;
            }
            set {
                this.digestField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public partial class alertInfoArea {
        
        private string areaDescField;
        
        private string[] polygonField;
        
        private string[] circleField;
        
        private alertInfoAreaGeocode[] geocodeField;
        
        private decimal altitudeField;
        
        private bool altitudeFieldSpecified;
        
        private decimal ceilingField;
        
        private bool ceilingFieldSpecified;
        
        /// <remarks/>
        public string areaDesc {
            get {
                return this.areaDescField;
            }
            set {
                this.areaDescField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("polygon")]
        public string[] polygon {
            get {
                return this.polygonField;
            }
            set {
                this.polygonField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("circle")]
        public string[] circle {
            get {
                return this.circleField;
            }
            set {
                this.circleField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("geocode")]
        public alertInfoAreaGeocode[] geocode {
            get {
                return this.geocodeField;
            }
            set {
                this.geocodeField = value;
            }
        }
        
        /// <remarks/>
        public decimal altitude {
            get {
                return this.altitudeField;
            }
            set {
                this.altitudeField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool altitudeSpecified {
            get {
                return this.altitudeFieldSpecified;
            }
            set {
                this.altitudeFieldSpecified = value;
            }
        }
        
        /// <remarks/>
        public decimal ceiling {
            get {
                return this.ceilingField;
            }
            set {
                this.ceilingField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ceilingSpecified {
            get {
                return this.ceilingFieldSpecified;
            }
            set {
                this.ceilingFieldSpecified = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="urn:oasis:names:tc:emergency:cap:1.2")]
    public partial class alertInfoAreaGeocode {
        
        private string valueNameField;
        
        private string valueField;
        
        /// <remarks/>
        public string valueName {
            get {
                return this.valueNameField;
            }
            set {
                this.valueNameField = value;
            }
        }
        
        /// <remarks/>
        public string value {
            get {
                return this.valueField;
            }
            set {
                this.valueField = value;
            }
        }
    }
}
