using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel;

public enum RegisterPoiStatusEnum : byte
{
    Pending = 0,
    Valid = 1,
    Invalid = 9
}

public enum UserRoleEnum : byte
{
    Normal = (byte)'N',
    EM = (byte)'E'
}

public enum WaterLevelUnitEnum
{
    Meters,
    Feet
}

public enum WaterFlowUnitEnum
{
    [Description("Cubic Meters/Day")]
    CubicMetersPerDay,
    [Description("Cubic Feet/Second")]
    CubicFeetPerSecond
}