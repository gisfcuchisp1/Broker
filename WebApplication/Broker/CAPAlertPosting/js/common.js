/**
MASAS Posting Tool - Common Functions
Updated: Dec 11, 2012
Independent Joint Copyright (c) 2011 MASAS Contributors.  Published
under the Modified BSD license.  See license.txt for the full text of the license.
*/

/*global MASAS,Ext,OpenLayers,GeoExt */
Ext.namespace('MASAS');

/* Functions that are fairly standalone, no other MASAS.x dependencies */

/**
Uses the browser's builtin parser for XML

@param {String} - the plain text version of some XML
@return {Object} - an XML DOM object
*/
MASAS.parse_xml = function (xml) {
    var doc = null;
    if (window.DOMParser) {
        try {
            doc = (new DOMParser()).parseFromString(xml, 'text/xml');
        } catch (err) {
            doc = null;
        }
    } else if (window.ActiveXObject) {
        try {
            doc = new ActiveXObject('Microsoft.XMLDOM');
            doc.async = false;
            if (!doc.loadXML(xml)) {
                doc = null;
            }
        } catch (err) {
            doc = null;
        }
    }
    return doc;
};

/**
Clones an object

@param {Object} - the source object to be cloned
@return {Object} - a new object cloned from the source
*/
MASAS.clone_object = function (obj) {
    if (obj === null || typeof(obj) !== 'object') {
        return obj;
    }
    var temp = new obj.constructor(); // changed (twice)
    var key = null;
    for (key in obj) {
        temp[key] = MASAS.clone_object(obj[key]);
    }
    return temp;
};

/**
Nicely formats/pretty-prints XML

@param {String} - XML to be formatted
@return {String} - the newly formatted XML
*/
MASAS.format_xml = function (xml) {
    var reg = /(>)(<)(\/*)/g;
    var wsexp = / *(.*) +\n/g;
    var contexp = /(<.+>)(.+\n)/g;
    xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
    var formatted = '';
    var lines = xml.split('\n');
    var indent = 0;
    var lastType = 'other';
    // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions 
    var transitions = {
        'single->single': 0,
        'single->closing': -1,
        'single->opening': 0,
        'single->other': 0,
        'closing->single': 0,
        'closing->closing': -1,
        'closing->opening': 0,
        'closing->other': 0,
        'opening->single': 1,
        'opening->closing': 0,
        'opening->opening': 1,
        'opening->other': 1,
        'other->single': 0,
        'other->closing': -1,
        'other->opening': 0,
        'other->other': 0
    };
    for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
        var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
        var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
        var type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
        var fromTo = lastType + '->' + type;
        lastType = type;
        var padding = '';

        indent += transitions[fromTo];
        for (var j = 0; j < indent; j++) {
            padding += '  ';
        }
        if (fromTo === 'opening->closing') {
            formatted = formatted.substr(0, formatted.length - 1) + ln + '\n'; // substr removes line break (\n) from prev loop
        } else {
            formatted += padding + ln + '\n';
        }
    }
    return formatted;
};

/**
Encode any XML reserved characters in a block of text, such as
<tag>here & there</tag>

@param {String} - text to check for reserved characters
@return {String} - text which has had entities substituted instead
*/
MASAS.xml_encode = function (text) {
    text = text.replace(/\&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    return text;
};

/**
Decode any entities back into reserved XML characters

@param {String} - text to check for entities
@return {String} - text which has had entities replaced with characters
*/
MASAS.xml_decode = function (text) {
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    return text;
};


/* Functions that have other MASAS.x dependencies */

/**
When selecting an entry/alert to modify, show a GeoExt popup on the map
with some basic details about that entry/alert.

@param {Object} - the event object with information about the map
feature that was selected
*/
MASAS.show_select_popup = function (evt) {
    if (evt.feature) {
        // clear an existing popup first
        if (evt.feature.popup) {
            evt.feature.popup.destroy();
            evt.feature.popup = null;
        }
        // don't show a popup for an already selected feature
        if (evt.feature.isSelected) {
            return;
        }
        var content = '<div> Author: ' + evt.feature.attributes.author_name + '</div>' +
            '<div style="padding: 5px;">' + evt.feature.attributes.content + '</div>';
        evt.feature.popup = new GeoExt.Popup({
            title: evt.feature.attributes.title,
            html: content,
            location: evt.feature,
            width: 350,
	        minHeight: 100,
	        autoScroll: true,
	        // hide the close, max/min, and pin buttons
	        closable: false,
	        collapsible: false,
	        unpinnable: false,
	        panIn: false
        });
        evt.feature.popup.show();
        // highlight the corresponding grid record
        var grid_view = MASAS.selectGridPanel.getView();
        var row_num = MASAS.selectStore.find('fid', evt.feature.fid);
        // the icon may be visible on the map but not in the table because
        // it was filtered out, either as Entry or Alert depending, note the find
        // returns -1 while there can be valid row 0
        if (row_num !== -1) {
            grid_view.focusRow(row_num);
            Ext.fly(grid_view.getRow(row_num)).addClass('x-grid3-row-selected');
        }
        // display associated geometry in addition to the popup if its not
        // already present on the map, ignores points for now
        if (evt.feature.originalGeom && !evt.feature.originalGeomFeature) {
            if (evt.feature.originalGeom.CLASS_NAME !== 'OpenLayers.Geometry.Point') {
                var geom_layer = MASAS.selectMap.getLayersByName('SelectGeom')[0];
                var new_geom = evt.feature.originalGeom.clone();
                var new_feature = new OpenLayers.Feature.Vector(new_geom);
                geom_layer.addFeatures([new_feature]);
                evt.feature.originalGeomFeature = new_feature;
            }
        }
    }
};

/**
After selecting an entry/alert to modify, close its info popup.

@param {Object} - the event object with information about the map
feature that was selected
*/
MASAS.close_select_popup = function (evt) {
    if (evt.feature && evt.feature.popup) {
        evt.feature.popup.destroy();
        evt.feature.popup = null;
        // ensure grid is unfocused
        var grid_view = MASAS.selectGridPanel.getView();
        var row_num = MASAS.selectStore.find('fid', evt.feature.fid);
        if (row_num !== -1) {
            Ext.fly(grid_view.getRow(row_num)).removeClass('x-grid3-row-selected');
        }
        // remove associated geometry
        if (evt.feature.originalGeomFeature) {
            var geom_layer = MASAS.selectMap.getLayersByName('SelectGeom')[0];
            geom_layer.removeFeatures([evt.feature.originalGeomFeature]);
            evt.feature.originalGeomFeature = null;
        }
    }
};

/**
Zoom and re-center the map to either a default location (North America)
or to the user's saved location.  Is triggered by both a button on the
map and when the Location Map is first displayed.
*/
MASAS.zoom_to_default_view = function () {
    if (MASAS.MAP_DEFAULT_VIEW) {
        var default_view_bounds = new OpenLayers.Bounds.fromString(MASAS.MAP_DEFAULT_VIEW);
        default_view_bounds.transform(new OpenLayers.Projection('EPSG:4326'),
            MASAS.locationMap.getProjectionObject());
        MASAS.locationMap.zoomToExtent(default_view_bounds);
    } else {
        MASAS.locationMap.setCenter(new OpenLayers.LonLat(-94.0, 52.0).transform(
            new OpenLayers.Projection('EPSG:4326'), MASAS.locationMap.getProjectionObject()), 4);
    }
};

/**
Loads current feed entries from the Hub chosen for posting based on the
viewport of the Location map.  Two layers used, one for the icon locations
and the other to display the original geometry, both geometries are provided
by the MASAS feed parser.

@param {Object} - the map toolbar button object, toggles layer on/off
*/
MASAS.load_current_entries = function (btn) {
    var current_layer = MASAS.locationMap.getLayersByName('Current')[0];
    var current_layer_geom = MASAS.locationMap.getLayersByName('CurrentGeom')[0];
    if (!current_layer  || !current_layer_geom) {
        console.error('Current layers not found');
        return;
    }
    if (btn.pressed) {
        // append the parameters as needed to load the current feed
        var feed_url = OpenLayers.Util.urlAppend(MASAS.FEED_URL,
            'secret=' + MASAS.USER_SECRET + '&lang=en');
        // current viewport only, creating new bounds because of the transform
        var current_bounds = MASAS.locationMap.getExtent().toArray();
        var current_view = new OpenLayers.Bounds.fromArray(current_bounds);
        current_view.transform(MASAS.locationMap.getProjectionObject(),
            new OpenLayers.Projection('EPSG:4326'));
        feed_url += '&bbox=' + current_view.toBBOX(4);
        // support proxies
        if (MASAS.AJAX_PROXY_URL) {
            feed_url = MASAS.AJAX_PROXY_URL + encodeURIComponent(feed_url);
        }
        MASAS.currentLoadingControl.maximizeControl();
        if (!current_layer.protocol.url) {
            current_layer.protocol.url = feed_url;
            current_layer.protocol.options.url = feed_url;
            // this will also load the data the first time its used
            current_layer.setVisibility(true);
        } else {
            current_layer.protocol.url = feed_url;
            current_layer.protocol.options.url = feed_url;
            current_layer.setVisibility(true);
            // forcing a reload following times since url may have changed
            current_layer.strategies[0].load();
        }
        current_layer_geom.setVisibility(true);
        console.debug('Show current entries');
    } else {
        current_layer.setVisibility(false);
        // cleaning up as some geom features can get left behind
        current_layer_geom.removeAllFeatures();
        current_layer_geom.setVisibility(false);
        console.debug('Hide current entries');
    }
};

/**
Display a basic info popup for current feed entries.  Geometry for the entry
is not displayed on the map, like the viewing tool, just the icon.

@param {Object} - the event object with information about the map
feature that was selected
*/
MASAS.show_current_popup = function (evt) {
    if (evt.feature) {
        if (evt.feature.popup) {
            if (evt.feature.popup.draggable) {
                // if the window pin has been pushed, this window will be moveable
                // and so should then need to use the X to close.
                return;
            }
            evt.feature.popup.destroy();
            evt.feature.popup = null;
        }
        var content = '<div> Updated: ' + evt.feature.attributes.updated + '</div>' +
            '<div> Author: ' + evt.feature.attributes.author_name + '</div>' +
            '<div style="padding: 5px;">' + evt.feature.attributes.content + '</div>';
        evt.feature.popup = new GeoExt.Popup({
            title: evt.feature.attributes.title,
            html: content,
            location: evt.feature,
            width: 350,
	        minHeight: 100,
	        autoScroll: true,
	        closable: true,
	        collapsible: false,
	        panIn: false,
	        listeners: {close: function (evt) {
	            // when the close button is clicked after a window has become
	            // draggable, need to reset that value to allow new windows again
	            evt.draggable = false;
	        } }
        });
        evt.feature.popup.show();
        // display associated geometry in addition to the popup if its not
        // already present on the map, ignores points for now
        if (evt.feature.originalGeom && !evt.feature.originalGeomFeature) {
            if (evt.feature.originalGeom.CLASS_NAME !== 'OpenLayers.Geometry.Point') {
                var geom_layer = MASAS.locationMap.getLayersByName('CurrentGeom')[0];
                var new_geom = evt.feature.originalGeom.clone();
                // originalGeom should be in 4326 projection from Atom/GeoRSS
                new_geom.transform(new OpenLayers.Projection('EPSG:4326'),
                    MASAS.locationMap.getProjectionObject());
                var new_feature = new OpenLayers.Feature.Vector(new_geom);
                geom_layer.addFeatures([new_feature]);
                evt.feature.originalGeomFeature = new_feature;
            }
        }
    }
};

/**
After selecting a current feed entry, close its info popup.

@param {Object} - the event object with information about the map
feature that was selected
*/
MASAS.close_current_popup = function (evt) {
    if (evt.feature && evt.feature.popup) {
        // if the window pin has been pushed, this window will be moveable
        // and so should then need to use the X to close.
        if (!evt.feature.popup.draggable) {
            evt.feature.popup.destroy();
            evt.feature.popup = null;
            // remove associated geometry, however it does stick around if
            // user has clicked the pushpin, then used close box instead
            if (evt.feature.originalGeomFeature) {
                var geom_layer = MASAS.locationMap.getLayersByName('CurrentGeom')[0];
                geom_layer.removeFeatures([evt.feature.originalGeomFeature]);
                evt.feature.originalGeomFeature = null;
            }
        }
    }
};

/**
If a posting attempt times out, displays the failure on the results page.
*/
MASAS.post_timeout_error = function () {
    //TODO: cancel the do_post request handler
    console.error('Posting Timeout');
    var result_html = '<h1 style="color: red;">Failed Post</h1>' +
        '<div style="margin: 25px;">Posting Timed Out</div>' +
        '<a href="#" onclick="window.close(); return false;" style="color: blue;">Return</a>';
    document.getElementById('postingBox').innerHTML = result_html;
};

/**
After a successful post, display results and additional operations such
as reviewing the new entry and forwarding via email.

@param {Object} - The XMLHttpRequest Object
*/
MASAS.post_complete_result = function (xhr) {
    var result_html = '';
    clearTimeout(MASAS.postingTimer);
    if (xhr.status == '200' || xhr.status == '201') {
        MASAS.POST_RESULT = xhr.responseText;
        result_html = '<h1 style="color: green;">Successful Post</h1>' +
            '<a href="#" onclick="MASAS.review_new_entry(); return false;" style="color: grey;">Review New Entry</a>' +
            '<a href="#" onclick="window.close(); return false;" style="color: blue;">Return</a>';
        if (MASAS.EMAIL_ADDRESS_LIST) {
            Ext.getCmp('email-to-fieldset').show();
        }
        //console.debug('Successful Post');
        alert('Successful Post');
    } else {
        var postingErrorText = xhr.responseText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        result_html = '<h1 style="color: red;">Failed Post</h1>' +
            '<div style="margin: 25px;"><pre>' + postingErrorText + '</pre></div>' +
            '<a href="#" onclick="window.close(); return false;" style="color: blue;">Return</a>';
        //console.error('Posting Error: ' + postingErrorText);
        alert('Posting Error: ' + postingErrorText);
    }
    document.getElementById('postingBox').innerHTML = result_html;
};

/**
Create a popup window to review the newly created entry.
*/
MASAS.review_new_entry = function () {
    // only one review window allowed
    if (MASAS.reviewWindow) {
        MASAS.reviewWindow.destroy();
    }
    
    var display_xml = MASAS.POST_RESULT;
    var display_html = '';
    try {
        var atom_json = xmlJsonClass.xml2json(MASAS.parse_xml(MASAS.POST_RESULT), '  ');
        var newAtom = JSON.parse(atom_json);
        // XTemplate from post-templates.js
        display_html += MASAS.EntryToHTMLTemplate.apply(newAtom);
    } catch (err) {
        console.error('Review Entry Template Error: ' + err);
        alert('Entry Template Error.');
        return;
    }
    display_xml = display_xml.replace(/</g, '&lt;');
    display_xml = display_xml.replace(/>/g, '&gt;');
    display_html += '<br><br>&nbsp;&nbsp;<a href="#" onclick="' +
        'document.getElementById(\'preview-xml-box\').style.display=\'block\'; return false;">' +
        '<b>Entry XML</b></a><div id="preview-xml-box" style="display: none;"><pre>' +
        display_xml + '</pre></div>';
    
    MASAS.reviewWindow = new Ext.Window({
        title: 'New Entry Review',
        closable: true,
        width: 700,
        height: 500,
        autoScroll: true,
        bodyStyle: 'background-color: white;',
        layout: 'fit',
        html: display_html
    });
    MASAS.reviewWindow.show(this);
};

/**
When the email forwarding fieldset is opened, generate the text content for
the display/form fields.
*/
MASAS.generate_email_content = function () {
    var message_subject = '';
    var message_txt = '';
    
    if (MASAS.EMAIL_HEADER) {
        message_txt += MASAS.EMAIL_HEADER;
    }
    
    message_subject += 'Fwd: MASAS ';
    message_txt += '\n\n--- Forwarded MASAS ';
    if (MASAS.CAP_MESSAGE) {
        message_subject += 'Alert Message: ';
        message_txt += 'Alert Message ';
    } else {
        message_subject += 'Entry: ';
        message_txt += 'Entry ';
    }
    message_txt += '---\n\n';
    
    if (MASAS.CAP_MESSAGE) {
        var cap_xml_vals = MASAS.generate_cap_xml();
        try {
            // XTemplate from post-templates.js
            message_txt += MASAS.CAPToEmailTemplate.apply(cap_xml_vals[1]);
        } catch (err) {
            console.error('Email CAP Template Error: ' + err);
            alert('CAP Template Error.');
        }
    }
    
    try {
        var atom_json = xmlJsonClass.xml2json(MASAS.parse_xml(MASAS.POST_RESULT), '  ');
        var newAtom = JSON.parse(atom_json);
        // XTemplates from post-templates.js
        if (MASAS.CAP_MESSAGE) {
            message_txt += '\n--- Entry Summary ---\n\n';
            message_txt += MASAS.EntrySummaryToEmailTemplate.apply(newAtom);
        } else {
            message_txt += MASAS.EntryToEmailTemplate.apply(newAtom);
        }
        try {
            if (newAtom.entry.title.div.div instanceof Array) {
                // assuming first value is the english one
                if (newAtom.entry.title.div.div[0]['#text']) {
                    message_subject += newAtom.entry.title.div.div[0]['#text'];
                }
            } else if (newAtom.entry.title.div.div['#text']) {
                message_subject += newAtom.entry.title.div.div['#text'];
            }
        } catch (err) {
            console.error('Email Entry Title Error: ' + err);
        }
    } catch (err) {
        console.error('Email Entry Template Error: ' + err);
        alert('Entry Template Error.');
    }
    
    if (MASAS.EMAIL_FOOTER) {
        message_txt += MASAS.EMAIL_FOOTER;
    }
    
    Ext.getCmp('email-to-message').setValue(message_txt);
    Ext.getCmp('email-to-subject').setValue(message_subject);
    
    if (MASAS.attachmentStore) {
        if (MASAS.attachmentStore.getCount() > 0) {
            Ext.getCmp('email-attachment-notice').show();
        }
    }
};

/**
Forward the entry summary email, submitting the form fields to
the server proxy.

@param {Object} - the Send button Object
*/
MASAS.post_email_message = function (btn) {
    var email_to = Ext.getCmp('email-to-address').getValue();
    if (!email_to) {
        alert('Email To address not selected.');
        return;
    }
    var email_subject = Ext.getCmp('email-to-subject').getValue();
    if (!email_subject) {
        alert('Email Subject not entered.');
        return;
    }
    var email_message = Ext.getCmp('email-to-message').getValue();
    if (!email_message) {
        alert('Email Message not entered.');
        return;
    }
    var do_post = new OpenLayers.Request.POST({
        url: MASAS.EMAIL_FORWARD_URL,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: OpenLayers.Util.getParameterString({'to': email_to,
            'subject': email_subject, 'message': email_message}),
        callback: function (xhr) {
            if (xhr.status == '200' || xhr.status == '201') {
                console.debug('Email Forward Successful');
                btn.label.update('<span style="color: green; font-weight: bold;"> Sent </span>');
            } else {
                console.error('Email Forward Failed');
                btn.label.update('<span style="color: red; font-weight: bold;"> Error </span>');
            }
        }
    });
};

