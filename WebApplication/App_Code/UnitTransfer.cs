using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Unit Transfer
/// </summary>
public static class UnitTransfer
{
    public static double MetersToFeet(double meters)
    {
        return meters * 3.2808399;
    }

    public static double FeetToMeters(double feet)
    {
        return feet * 0.3048;
    }

    public static double CFPSecondToCMPDay(double CFPSecond)
    {
        // 0.028316846592 * 86400
        return CFPSecond * 2446.5755455488;
    }

    public static double CMPDayToCFPSecond(double CMPDay)
    {
        return CMPDay / 2446.5755455488;
    }
}