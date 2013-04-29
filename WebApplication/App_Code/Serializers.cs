using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml.Serialization;
using System.Text;
using System.IO;
using System.Xml;

/// <summary>
/// Serializer Tool for xml and entity object
/// </summary>
public static class Serializers
{
    private static Dictionary<Type, XmlSerializer> dtnSerializer = new Dictionary<Type, XmlSerializer>();
    public static XmlSerializer GetSerializer<T>()
    {
        var type = typeof(T);
        if (!dtnSerializer.ContainsKey(type))
        {
            dtnSerializer.Add(type, new XmlSerializer(type));
        }
        return dtnSerializer[type];
    }

    public static String Serialize<T>(T o)
    {
        MemoryStream sb = new MemoryStream();
        //StringWriter sw = new StringWriter(sb);
        var setting = new XmlWriterSettings();
        setting.Encoding = Encoding.UTF8;
        XmlWriter xw = XmlWriter.Create(sb, setting);
        GetSerializer<T>().Serialize(xw, o);
        xw.Flush();
        xw.Close();
        var arbContent = sb.ToArray();
        if (arbContent[0] == 0xEF && arbContent[1] == 0xBB && arbContent[2] == 0xBF)
        {
            return new UTF8Encoding().GetString(arbContent, 3, arbContent.Length - 3);
        }
        else
        {
            return new UTF8Encoding().GetString(sb.GetBuffer());
        }
    }

    public static T Deserialize<T>(String sData)
    {
        StringReader sr = new StringReader(sData);
        return (T)GetSerializer<T>().Deserialize(sr);
    }

    public static T Deserialize<T>(XmlReader reader)
    {
        return (T)GetSerializer<T>().Deserialize(reader);
    }

}