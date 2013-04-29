namespace ogc.service {
    using System.Xml.Serialization;
    
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType=true, Namespace="http://www.opengis.net/ogc")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace="http://www.opengis.net/ogc", IsNullable=false)]
    public partial class ServiceExceptionReport {
        
        private ServiceExceptionType[] serviceExceptionField;
        
        private string versionField;
        
        public ServiceExceptionReport() {
            this.versionField = "1.2.0";
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("ServiceException")]
        public ServiceExceptionType[] ServiceException {
            get {
                return this.serviceExceptionField;
            }
            set {
                this.serviceExceptionField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string version {
            get {
                return this.versionField;
            }
            set {
                this.versionField = value;
            }
        }
    }
    
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.0.30319.1")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(Namespace="http://www.opengis.net/ogc")]
    public partial class ServiceExceptionType {
        
        private string codeField;
        
        private string locatorField;
        
        private string valueField;
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string code {
            get {
                return this.codeField;
            }
            set {
                this.codeField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string locator {
            get {
                return this.locatorField;
            }
            set {
                this.locatorField = value;
            }
        }
        
        /// <remarks/>
        [System.Xml.Serialization.XmlTextAttribute()]
        public string Value {
            get {
                return this.valueField;
            }
            set {
                this.valueField = value;
            }
        }
    }
}
