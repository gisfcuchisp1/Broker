/**
MASAS Posting Tool - Maps
Updated: Dec 11, 2012
Independent Joint Copyright (c) 2011 MASAS Contributors.  Published
under the Modified BSD license.  See license.txt for the full text of the license.
*/

/*global MASAS,Ext,OpenLayers,GeoExt */
Ext.namespace('MASAS');

// Adding retries because default is 0
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

/**
Create and configure the Location map, that is used by all applications.
Map customizations that will apply to all applications should be done
here.  Further customizations for individual applications should be done in
those applications .onReady sections.
*/
MASAS.initialize_location_map = function () {
    /**
    Initialize the Location Map
    */
    MASAS.locationMap = new OpenLayers.Map('locationMap', {
        numZoomLevels: 19,
        projection: new OpenLayers.Projection('EPSG:900913'),
        displayProjection: new OpenLayers.Projection('EPSG:4326'),
        units: 'm',
        maxResolution: 'auto',
        maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
        theme: null
    });
    
    // Override so that it zooms to the user's default view.  With no default
    // extent set for GeoExt, it will use this instead.  Also overrides the
    // zoom extent button on the pan zoom toolbar
    MASAS.locationMap.zoomToMaxExtent = MASAS.zoom_to_default_view;
    
    /**
    Add the base layers to Location Map.  Customize as necessary.
    */
    var google_street = new OpenLayers.Layer.Google('Google Street', {
        type: google.maps.MapTypeId.ROADMAP,
        isBaseLayer: true
    });
    MASAS.locationMap.addLayer(google_street);

    /**
    Add common layers to Location Map.  Customize as necessary.
    */
    
    /**
    The current feed entries layer.
    */
    var currentStyleMap = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            // simple style that supports only point icons
            pointRadius: 15,
            externalGraphic: '${icon}',
            graphicOpacity: 0.8 }),
        'select': new OpenLayers.Style({ pointRadius: 18 })
    });
    var currentLayer = new OpenLayers.Layer.Vector('Current', {
        isBaseLayer: false,
        visibility: false,
        styleMap: currentStyleMap,
        projection: new OpenLayers.Projection('EPSG:4326'),
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
            // set later based on viewport
            url: '',
            format: new OpenLayers.Format.MASASFeed()
        }),
        eventListeners: {loadend: function () {
            MASAS.currentLoadingControl.minimizeControl();
            if (this.features.length === 0) {
                alert('No Entries found in the current view.');
            }
        }}
    });
    MASAS.locationMap.addLayer(currentLayer);
    
    /**
    The current feed entries original geometry (lines/polygons) layer.
    */
    var currentGeomStyleMap = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            fillOpacity: 0.5,
            fillColor: 'green',
            strokeOpacity: 0.5,
            strokeColor: 'black',
            strokeWidth: '${myStrokeWidth}'
        }, {
            context: {
                myStrokeWidth: function (feature) {
                    return (feature.geometry && feature.geometry instanceof OpenLayers.Geometry.LineString) ? 4:1;
                }
            }
        })
    });
    
    var currentGeomLayer = new OpenLayers.Layer.Vector('CurrentGeom', {
        isBaseLayer: false,
        visibility: false,
        displayInLayerSwitcher: false,
        styleMap: currentGeomStyleMap
    });
    MASAS.locationMap.addLayer(currentGeomLayer);
    
    /**
    Add common controls to Location Map.  Customize as necessary.
    */
    
    /**
    Current layer controls.
    */
    MASAS.currentLoadingControl = new OpenLayers.Control.LoadingPanel();
    // not using [currentLayer] here so that popups won't obscure the view
    // when a user is trying to select another location feature on the map
    var currentSelect = new OpenLayers.Control.SelectFeature(currentLayer, {
        hover: true,
        highlightOnly: true,
        eventListeners: {
            featurehighlighted: MASAS.show_current_popup,
            featureunhighlighted: MASAS.close_current_popup
        }
    });
    MASAS.locationMap.addControls([MASAS.currentLoadingControl, currentSelect]);
    currentSelect.activate();
};

/**
Create and configure the Select map, that is used by the modify applications.
Map customizations that will apply to modify applications should be done
here.  Further customizations for individual applications should be done in
those applications .onReady sections.
*/
MASAS.initialize_select_map = function () {
    /**
    Initialize the Select Map
    */
    MASAS.selectMap = new OpenLayers.Map('selectMap', {
        numZoomLevels: 19,
        projection: new OpenLayers.Projection('EPSG:900913'),
        displayProjection: new OpenLayers.Projection('EPSG:4326'),
        units: 'm',
        maxResolution: 'auto',
        maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
        theme: null
    });
    
    //TODO: overriding the zoom to max button on the pan zoom bar for
    // now to simplify for users, is this needed for the selectMap?
    MASAS.selectMap.zoomToMaxExtent = function () {};
    
    /**
    Add the base layers to Select Map.  Customize as necessary.
    */
    var google_street = new OpenLayers.Layer.Google('Google Street', {
        type: google.maps.MapTypeId.ROADMAP,
        isBaseLayer: true
    });
    MASAS.selectMap.addLayer(google_street);
    
    /**
    Add common layers to Select Map.  Customize as necessary.
    */
    
    /**
    The select entries to update/cancel layer.
    */
    var selectStyleMap = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            // simple style that supports only point icons
            pointRadius: 15,
            externalGraphic: '${icon}',
            graphicOpacity: 0.8 }),
        'select': new OpenLayers.Style({ pointRadius: 18 })
    });
    var selectLayer = new OpenLayers.Layer.Vector('Select', {
        isBaseLayer: false,
        visibility: true,
        styleMap: selectStyleMap
    });
    // once a feature is selected, no need to show the popup anymore
    // and for layer loading/zoom it needs to be tied to the feature creation
    selectLayer.events.on({
        featureselected: function (evt) {
            evt.feature.isSelected = true;
            MASAS.close_select_popup(evt);
        },
        featureunselected: function (evt) {
            evt.feature.isSelected = false;
        },
        featuresadded: function () {
            MASAS.selectMap.zoomToExtent(selectLayer.getDataExtent());
        }
    });
    MASAS.selectMap.addLayer(selectLayer);
    
    /**
    The select entries original geometry (lines/polygons) layer.
    */
    var selectGeomStyleMap = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            fillOpacity: 0.5,
            fillColor: 'green',
            strokeOpacity: 0.5,
            strokeColor: 'black',
            strokeWidth: '${myStrokeWidth}'
        }, {
            context: {
                myStrokeWidth: function (feature) {
                    return (feature.geometry && feature.geometry instanceof OpenLayers.Geometry.LineString) ? 4:1;
                }
            }
        })
    });
    
    var selectGeomLayer = new OpenLayers.Layer.Vector('SelectGeom', {
        isBaseLayer: false,
        visibility: true,
        displayInLayerSwitcher: false,
        styleMap: selectGeomStyleMap
    });
    MASAS.selectMap.addLayer(selectGeomLayer);
    
    /**
    Add common controls to Select Map.  Customize as necessary.
    */
    
    /**
    Select layer controls.
    */
    MASAS.selectLoadingControl = new OpenLayers.Control.LoadingPanel();
    var selectControl = new OpenLayers.Control.SelectFeature(selectLayer, {
        hover: true,
        highlightOnly: true,
        eventListeners: {
            featurehighlighted: MASAS.show_select_popup,
            featureunhighlighted: MASAS.close_select_popup
        }
    });
    MASAS.selectMap.addControls([MASAS.selectLoadingControl, selectControl]);
    selectControl.activate();
};

