/**
Validator Functions
Updated: Jun 11, 2012
Independent Joint Copyright (c) 2011 MASAS Contributors.  Published
under the Modified BSD license.  See license.txt for the full text of the license.
*/

/* TODO: other polygon validation steps ?
https://view.softwareborsen.dk/Softwareborsen/viskort/Branches/Release_11.02/VisKort/JavaScript/OpenLayers/Geometry/Geometry.js
*/

/*global MASAS,Ext,OpenLayers,GeoExt */
Ext.namespace('MASAS.validators');

/**
Validates a point

@param {String} - a lat,lon point
@return {Array} - {Boolean} for a valid point, {Boolean} for located in
North America
*/
MASAS.validators.check_point = function (val) {
    // between -90 and 90 , -180 and 180 with maximum of 10 decimal places
    var regExp = /^(-?(90|(\d|[1-8]\d)(\.\d{1,10}){0,1}))\,{1}(-?(180|(\d|\d\d|1[0-7]\d)(\.\d{1,10}){0,1}))$/;
    var p_result = regExp.test(val);
    var b_result = true;
    if (p_result) {
        // within a box around north america bottom-left 15,-170 top-right 85,-45
        var coords = val.split(',');
        var lat = parseInt(coords[0], 10);
        var lon = parseInt(coords[1], 10);
        if (lat < 15  || lat > 85) {
            b_result = false;
        }
        if (lon < -170 || lon > -45) {
            b_result = false;
        }
    }
    
    return [p_result, b_result];
};

/**
Validates a line and its list of points

@param {String} - space delimited sets of lat,lon points
@return {Array} - {Boolean} for a valid line, {Boolean} for located in
North America
*/
MASAS.validators.check_line = function (val) {
    // minimum of two points for a line
    var points = val.split(' ');
    if (points.length < 2) {
        return [false, true];
    }
    var l_result = true;
    var b_result = true;
    for (var i = 0; i < points.length; i++) {
        var p_check = MASAS.validators.check_point(points[i]);
        // if there is any check failure, only set to false the first time so subsequent
        // passes don't overwrite
        if (!p_check[0]) {
            if (l_result) {
                l_result = false;
            }
        }
        if (!p_check[1]) {
            if (b_result) {
                b_result = false;
            }
        }
    }
    
    return [l_result, b_result];
};

/**
Validates a polygon and its list of points

@param {String} - space delimited sets of lat,lon points
@return {Array} - {Boolean} for a valid polygon, {Boolean} for located in
North America
*/
MASAS.validators.check_polygon = function (val) {
    // minimum of four points for a polygon
    var points = val.split(' ');
    if (points.length < 4) {
        return [false, true];
    }
    // last point must each first to close polygon
    if (points[0] !== points[points.length - 1]) {
        return [false, true];
    }
    // reuse check_line to check individual points in this polygon
    var result = MASAS.validators.check_line(val);
    
    return result;
};

/**
Validates a circle and its center point and radius

@param {String} - space delimited set of lat,lon and radius in meters
@return {Array} - {Boolean} for a valid circle, {Boolean} for located in
North America
*/
MASAS.validators.check_circle = function (val) {
    // should be a point and a radius
    var points = val.split(' ');
    if (points.length !== 2) {
        return [false, true];
    }
    // check for a valid radius, setting 10,000 KM as max
    try {
        var radius = parseInt(points[1], 10);
        if (radius < 1 || radius > 10000000) {
            return [false, true];
        }
    } catch (err) {
        return [false, true];
    }
    
    return MASAS.validators.check_point(points[0]);
};

/**
Validates a box and its two points

@param {String} - space delimited set of two lat,lon points
@return {Array} - {Boolean} for a valid box, {Boolean} for located in
North America
*/
MASAS.validators.check_box = function (val) {
    // should be only two points
    var points = val.split(' ');
    if (points.length !== 2) {
        return [false, true];
    }
    //TODO: check bottom-left and top-right for the values?
    // reuse check_line to check individual points in this box
    var result = MASAS.validators.check_line(val);
    
    return result;
};

