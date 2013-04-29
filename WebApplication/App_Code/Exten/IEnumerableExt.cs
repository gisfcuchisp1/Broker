using Microsoft.VisualBasic;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Reflection;
public static class IEnumerableExt
{
    /// <summary>
    /// IEnumerable to DataTable
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="collection">The collection.</param>
    /// <returns></returns>
    public static DataTable ToDataTable<TResult>(this IEnumerable<TResult> value) where TResult : class
    {
        List<PropertyInfo> pList = new List<PropertyInfo>();
        Type type = typeof(TResult);
        DataTable dt = new DataTable();
        Array.ForEach<PropertyInfo>(type.GetProperties(), p => { pList.Add(p); dt.Columns.Add(p.Name, p.PropertyType); });
        foreach (var item in value)
        {
            DataRow row = dt.NewRow();
            pList.ForEach(p => row[p.Name] = p.GetValue(item, null));
            dt.Rows.Add(row);
        }
        return dt;
    }  
}