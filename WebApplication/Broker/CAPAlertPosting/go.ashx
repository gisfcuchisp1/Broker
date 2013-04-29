<%@ WebHandler Language="C#" Class="go" %>

using System;
using System.Web;
using System.Net;
using System.Linq;
using System.Linq.Expressions;

public class go : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        HttpWebRequest request = WebRequest.Create(context.Request["url"]) as HttpWebRequest;
        request.Method = context.Request.HttpMethod;
        request.ContentType = context.Request.ContentType;
        //request.Headers.Clear();
        //foreach (var headerName in context.Request.Headers.AllKeys)
        //{
        //    request.Headers.Add(headerName, context.Request.Headers[headerName]);
        //}
        var inputStream = context.Request.InputStream;
        byte[] buffer = new byte[1024];
        while(inputStream.Position != inputStream.Length)
        {
            var length = inputStream.Read(buffer, 0, 1024);
            request.GetRequestStream().Write(buffer, 0, length);
        }
        HttpWebResponse res = request.GetResponse() as HttpWebResponse;
        var remoteStream = res.GetResponseStream();
        while (true)
        {
            var length = remoteStream.Read(buffer, 0, 1024);
            if (length == 0)
            {
                break;
            }
            context.Response.OutputStream.Write(buffer, 0, length);
        }
    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}