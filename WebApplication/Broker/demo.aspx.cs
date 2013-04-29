using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using WNSModel;
public partial class Broker_Demo : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack) { 
            WNSEntities ctx = new WNSEntities();
            //ddlPOI.DataSource = ctx.MONITORDATAs;
            //ddlPOI.DataBind();
            //ddlPOI.Items.Insert(0, new ListItem("", ""));

            //ddlMeasurementUnit.DataSource = ctx.FREQUENCies;
            //ddlMeasurementUnit.DataBind();

            //ddlNotificationType.DataSource = ctx.NOTIFICATIONTYPEs;
            //ddlNotificationType.DataBind();
        }
    }
}