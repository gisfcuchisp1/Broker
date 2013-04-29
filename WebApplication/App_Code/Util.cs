using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text.RegularExpressions;
using System.Reflection;
using System.ComponentModel;

/// <summary>
/// misc tool
/// </summary>
public static class Util
{
    public static string duplicateChar(char c, int iNum)
    {
        string sRet = "";
        for (int i = 0; i < iNum; i++)
        {
            sRet += c;
        }
        return sRet;
    }

    public static string getDescription(Enum en)
    {
        Type type = en.GetType();

        MemberInfo[] memInfo = type.GetMember(en.ToString());

        if (memInfo != null && memInfo.Length > 0)
        {
            object[] attrs = memInfo[0].GetCustomAttributes(typeof(DescriptionAttribute), false);

            if (attrs != null && attrs.Length > 0)
            {
                return ((DescriptionAttribute)attrs[0]).Description;
            }
        }

        return en.ToString();
    }

    public static String getDescription<T>(String enumString) where T : struct
    {
        var t = toEnum<T>(enumString);
        if (t.HasValue)
        {
            return getDescription(t.Value as Enum);
        }
        else
        {
            return "";
        }
    }

    public static String[] getDescriptions<T>() where T : struct
    {
        Type type = typeof(T);
        if (!type.IsEnum) throw new InvalidEnumArgumentException(typeof(T).ToString() + " is not enum");
        T[] enumValues = (T[])type.GetEnumValues();
        String[] descs = new String[enumValues.Length];
        for (int i = 0; i < enumValues.Length; i++)
        {
            descs[i] = getDescription(enumValues[i] as Enum);
        }
        return descs;
    }

    public static T[] getAllEnum<T>() where T : struct
    {
        Type type = typeof(T);
        if (!type.IsEnum) throw new InvalidEnumArgumentException(typeof(T).ToString() + " is not enum");
        return (T[])type.GetEnumValues();
    }

    public static T? toEnum<T>(String sEnumDesc) where T : struct
    {
        T aa;
        if (Enum.TryParse<T>(sEnumDesc, out aa)) return aa;
        return null;
    }

}