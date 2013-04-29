/**
Update/Cancel CAP Alert
Updated: Dec 11, 2012
Independent Joint Copyright (c) 2011 MASAS Contributors.  Published
 under the Modified BSD license.  See license.txt for the full text of the license.
 
@requires common.js
@requires validators.js
@requires post-templates.js
@requires post-map.js
*/

/*global MASAS,Ext,OpenLayers,GeoExt */
Ext.namespace('MASAS');
// blank objects to start
MASAS.selectMap = null;
MASAS.selectLoadingControl = null;
MASAS.selectStore = null;
MASAS.selectGridPanel = null;
MASAS.oldAtom = null;
MASAS.oldCAP = null;
MASAS.locationMap = null;
MASAS.areaZoneStore = null;
MASAS.areaSearchGrid = null;
MASAS.currentAreaGrid = null;
MASAS.currentLoadingControl = null;
MASAS.reviewWindow = null;
MASAS.postingTimer = null;
MASAS.POST_RESULT = '';

// for progress bar indicator
MASAS.PROGRESS_AMOUNT = 0;
// complete is 1 so divide by number of pages
MASAS.PROGRESS_INCREMENT = 0.25;

// turn on validation errors beside the field globally
Ext.form.Field.prototype.msgTarget = 'side';

// Tooltips on
Ext.QuickTips.init();

// Additional validation types
Ext.form.VTypes.radius = function (v) {
    // checking seperately for 0 because it validates as !check_val = false
    if (v === '0') {
        return true;
    }
    var check_val = parseFloat(v);
    if (!check_val || check_val < 0 || check_val > 500) {
        return false;
    } else {
        return true;
    }
};
Ext.form.VTypes.radiusText = 'Between 0 and 500 is allowed';

Ext.form.VTypes.latlon = function (v) {
    // for cases where event location point isn't being used
    if (v === 'Not Available') {
        return true;
    }
    var v_result = MASAS.validators.check_point(v);
    if (v_result[1] === false) {
        alert('Please note that this Location is outside North America.');
    }
    
    return v_result[0];
};
Ext.form.VTypes.latlonText = 'Must be valid latitude,longitude';

Ext.onReady(function () {
    
    // setting up selectMap and the layer used by the selectStore
    MASAS.initialize_select_map();
    var selectLayer = MASAS.selectMap.getLayersByName('Select')[0];
    
    // after setting up the generic locationMap, add new locationMap layers
    MASAS.initialize_location_map();
    
    var locationLayer = new OpenLayers.Layer.Vector('Location', {
        isBaseLayer: false,
        visibility: true
    });
    var sgcLayer = new OpenLayers.Layer.Vector('SGC', {
        isBaseLayer: false,
        visibility: false
    });
    MASAS.locationMap.addLayers([locationLayer, sgcLayer]);
    
    // additonal locationMap controls
    var navControl = new OpenLayers.Control.Navigation({title: 'Pan/Zoom'});
    var editPanel = new OpenLayers.Control.Panel({displayClass: 'editPanel'});
    editPanel.addControls([
        navControl,
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.Point,
            {displayClass: 'pointButton', title: 'Add point', featureControl: true,
            featureAdded: MASAS.save_location_point}),
        // using [location_layer] to allow selection when currentLayer is active
        new OpenLayers.Control.SelectFeature([locationLayer],
            {displayClass: 'saveButton', title: 'Save Point', hover: false,
            featureControl: true, onSelect: MASAS.save_location_point})
    ]);
    editPanel.defaultControl = navControl;
    MASAS.locationMap.addControl(editPanel);


    var headerBox = new Ext.BoxComponent({
        region: 'north',
        height: 30,
        html: '<div id="headerTitleBlock">MASAS Posting Tool</div>' +
            '<div id="headerDetailBlock">Version 0.2</div>'
    });
    
    var progressBar = new Ext.ProgressBar({
        id: 'progressBar',
        width: 150,
        style: 'margin-left: 25px',
        text: 'Progress'
    });
    
    var cardNav = function (direction) {
        var card_panel = Ext.getCmp('cap-wizard-panel').getLayout();
        var current_card = card_panel.activeItem.id.split('card-')[1];
        
        // first card's validation is update/cancel selection, comment out to bypass
        if (!MASAS.oldCAP) {
            alert('Select an Alert first.');
            return;
        }
        
        // validate this card's form items first, first card has no forms
        if (current_card !== '0') {
            var found_invalid_item = false;
            card_panel.activeItem.cascade(function (item) {
                if (item.isFormField) {
                    if (!item.validate()) {
                        found_invalid_item = true;
                    }
                }
            });
            // form based validation check, comment out to bypass
            if (found_invalid_item) {
                return;
            }
        }
        
        // validation for expires on input card
        if (current_card === '1') {
            var expires_dt = Ext.get('cap-expires-dt').getValue();
            var expires_tm = Ext.get('cap-expires-tm').getValue();
            //TODO: further validation of the values, such as must be in the future?
            if (expires_dt && !expires_tm) {
                alert('Expires time must be set.');
                return;
            } else if (!expires_dt && expires_tm) {
                alert('Expires date must be set.');
                return;
            }
        }
        
        // special validation for area on location card
        if (current_card === '2') {
            // need to select at least one type of area input
            if (Ext.getCmp('areaCurrentSet').collapsed &&
            Ext.getCmp('areaSelectSet').collapsed &&
            Ext.getCmp('areaCreateSet').collapsed) {
                // area type validation, comment out to bypass
                alert('Area input type is required.');
                return;
            }
            if (MASAS.currentAreaGrid.doValidation) {
                if (!MASAS.currentAreaGrid.getSelectionModel().hasSelection()) {
                    // current area select validations, comment out to bypass
                    alert('Area selection is required.');
                    return;
                }
            }
            if (MASAS.areaSearchGrid.doValidation) {
                if (!MASAS.areaSearchGrid.getSelectionModel().hasSelection()) {
                    // area select validations, comment out to bypass
                    alert('Area selection is required.');
                    return;
                }
            }
            if (Ext.get('cap-location').getValue() === 'Not Available') {
                // a custom area needs a location point and since validation for
                // the point allows Not Available, disallow if discard isn't checked
                if (!Ext.getCmp('areaCreateSet').collapsed || !Ext.getCmp('discard-event-location').checked) {
                    alert('A Location Point is Required.');
                    return;
                }
            }
            // when a Custom Area is chosen, search for any applicable
            // SGC geocodes to use, async search as part of leaving this card
            if (!Ext.getCmp('areaCreateSet').collapsed) {
                MASAS.custom_geocode_search();
            }
        }

        var next_card = parseInt(current_card, 10) + direction;
        card_panel.setActiveItem(next_card);
        Ext.getCmp('card-prev').setDisabled(next_card==0);
        // set to max number of cards
        Ext.getCmp('card-next').setDisabled(next_card==4);
        if (direction === 1) {
            MASAS.PROGRESS_AMOUNT += MASAS.PROGRESS_INCREMENT;
        } else if (direction === -1) {
            MASAS.PROGRESS_AMOUNT -= MASAS.PROGRESS_INCREMENT;
        }
        progressBar.updateProgress(MASAS.PROGRESS_AMOUNT);
    };


    var historyCombo = new Ext.form.ComboBox({
        fieldLabel: '<b>Your Postings</b>',
        id: 'history-interval',
        allowBlank: false,
        width: 150,
        typeAhead: true,
        forceSelection: true,
        triggerAction: 'all',
        mode: 'local',
        displayField: 'name',
        valueField: 'period',
        // default is alerts that are still current
        value: 0,
        store: new Ext.data.ArrayStore({
            id: 0,
            fields: ['name', 'period'],
            data: [['Current', 0],
                ['Past 24 Hours', 24],
                ['Past 48 Hours', 48],
                ['Past Week', 168]]
        }),
        listeners: {select: MASAS.load_user_entries}
    });

    MASAS.selectStore = new GeoExt.data.FeatureStore({
        layer: selectLayer,
        fields: [
            {name: 'icon', type: 'string'},
            {name: 'title', type: 'string'},
            {name: 'published', type: 'date', dateFormat: 'Y-m-d\\TH:i:s\\Z'},
            {name: 'updated', type: 'date', dateFormat: 'Y-m-d\\TH:i:s\\Z'},
            {name: 'expires', type: 'date', dateFormat: 'Y-m-d\\TH:i:s\\Z'},
            {name: 'point', type: 'string'},
            {name: 'content', type: 'string'},
            {name: 'links', type: 'auto'},
            {name: 'CAP', type: 'string'}
        ],
        sortInfo: {field: 'updated', direction: "DESC"},
        proxy: new GeoExt.data.ProtocolProxy({
            protocol: new OpenLayers.Protocol.HTTP({
                url: '',
                format: new OpenLayers.Format.MASASFeed({
                    internalProjection: MASAS.selectMap.getProjectionObject(),
                    externalProjection: new OpenLayers.Projection('EPSG:4326')
                })
            })
        }),
        autoLoad: false,
        listeners: {load: function () {
                MASAS.selectLoadingControl.minimizeControl();
                this.filterBy(function (record, id) {
                    //console.log(record);
                    if (record.get('CAP') === 'Y') {
                        return true;
                    } else {
                        return false;
                    }
                });
            },
            exception: function () {
                console.error('Unable to load previous alerts');
                alert('Unable to load previous Alerts.');
            }
        }
    });
    
    // row expander
    var expander = new Ext.ux.grid.RowExpander({
        tpl: new Ext.Template('<p>{content}</p>')
    });
    
    // icons displayed in rows
    function renderEventIcon(val) {
        return '<img alt="Event" height="18px" width="18px" src="' + val + '">';
    }
    
    function renderCloneButton(val) {
        if (val.ATOM && val.CAP) {
            return '<button type="button" style="color: blue;" onclick="MASAS.load_past_alert(\'' +
            val.ATOM.href + '\', \'' + val.CAP.href + '\', \'Clone\')">Clone</button>';
        }
    }
    
    function renderUpdateButton(val) {
        if (val.ATOM && val.CAP) {
            return '<button type="button" style="color: blue;" onclick="MASAS.load_past_alert(\'' +
            val.ATOM.href + '\', \'' + val.CAP.href + '\', \'Update\')">Update</button>';
        }
    }
    
    function renderCancelButton(val) {
        if (val.ATOM && val.CAP) {
            return '<button type="button" style="color: red;" onclick="MASAS.load_past_alert(\'' +
            val.ATOM.href + '\', \'' + val.CAP.href + '\', \'Cancel\')">Cancel</button>';
        }
    }
    
    var select_grid_columns = [expander, {
            header: 'Icon',
            width: 35,
            renderer: renderEventIcon,
            sortable: true,
            dataIndex: 'icon'
        }, {
            header: 'Title',
            sortable: true,
            dataIndex: 'title'
        }, {
            header: 'Published',
            renderer: Ext.util.Format.dateRenderer('m/d g:i:s A'),
            width: 110,
            sortable: true,
            dataIndex: 'published'
        }, {
            header: 'Updated',
            renderer: Ext.util.Format.dateRenderer('m/d g:i:s A'),
            width: 110,
            sortable: true,
            dataIndex: 'updated'
        }, {
            header: 'Expires',
            renderer: Ext.util.Format.dateRenderer('m/d g:i:s A'),
            width: 110,
            sortable: true,
            dataIndex: 'expires'
    }];
    if (MASAS.UPDATE_OPERATION === 'Clone') {
        select_grid_columns.push({
            width: 100,
            renderer: renderCloneButton,
            sortable: false,
            dataIndex: 'links'
        });
    } else {
        select_grid_columns.push({
            width: 100,
            renderer: renderUpdateButton,
            sortable: false,
            dataIndex: 'links'
        });
        select_grid_columns.push({
            width: 100,
            renderer: renderCancelButton,
            sortable: false,
            dataIndex: 'links'
        });
    }
    
    // create grid panel configured with feature store
    MASAS.selectGridPanel = new Ext.grid.GridPanel({
        title: 'Previous Alerts',
        height: 130,
        collapsible: false,
        autoScroll: true,
        stripeRows: true,
        columnLines: true,
        header: false,
        store: MASAS.selectStore,
        columns: select_grid_columns,
        autoExpandColumn: '2',
        plugins: expander,
        sm: new GeoExt.grid.FeatureSelectionModel()
    });

    // create map panel
    var selectMapPanel = new GeoExt.MapPanel({
        style: 'margin: 10px 0px;',
        //TODO: resizable?
        height: 300,
        collapsible: false,
        map: MASAS.selectMap
    });
        
    var selectCAPCard = new Ext.FormPanel({
        id: 'card-0',
        labelWidth: 100,
        bodyStyle: 'padding: 10px;',
        items: [historyCombo, selectMapPanel, MASAS.selectGridPanel]
    });
    
    
    var intervalCombo = new Ext.form.ComboBox({
        name: 'cap-expires-interval',
        id: 'cap-expires-interval',
        allowBlank: true,
        width: 125,
        typeAhead: true,
        forceSelection: true,
        triggerAction: 'all',
        mode: 'local',
        displayField: 'name',
        valueField: 'interval',
        tpl: '<tpl for="."><div ext:qtip="{tip}" class="x-combo-list-item">{name}&nbsp;</div></tpl>',
        store: new Ext.data.ArrayStore({
            id: 0,
            fields: ['interval', 'name', 'tip'],
            data: [ [null, '', 'Do not set expires'],
                [1, '1 Hour', 'Expires in 1 hour'],
                [6, '6 Hours', 'Expires in 6 hours'],
                [12, '12 Hours', 'Expires in 12 hours'],
                [24, '24 Hours', 'Expires in 1 day'],
                [48, '48 Hours', 'Expires in 2 days'] ]
        }),
        listeners: {
            select: function (combo, record, index) {
                if (record.data.interval) {
                    var dt_check = Ext.get('cap-expires-dt').getValue();
                    if (dt_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                }
                // any change removes highlighting of initial default
                combo.removeClass('expiresIntervalDefault');
            },
            afterrender: function (combo) {
                if (MASAS.DEFAULT_EXPIRES_INTERVAL) {
                    // if a default expires interval is provided, modify the
                    // display name, select the default, and highlight it to
                    // make clear to the user it was defaulted.
                    var d_idx = combo.getStore().find('interval',
                        MASAS.DEFAULT_EXPIRES_INTERVAL);
                    if (d_idx !== -1) {
                        var d_rec = combo.getStore().getAt(d_idx);
                        var d_val = d_rec.get('name');
                        if (d_val.search('-Default') === -1) {
                            d_rec.set('name', d_val + '-Default');
                            d_rec.commit();
                        }
                        combo.setValue(d_rec.get('interval'));
                        combo.addClass('expiresIntervalDefault');
                    }
                }
            }
        }
    });

    var inputCAPCard = new Ext.FormPanel({
        id: 'card-1',
        labelWidth: 80,
        bodyStyle: 'padding: 10px;',
        defaultType: 'textfield',
        items: [{
            xtype: 'displayfield',
            fieldLabel: '<b>Status</b>',
            id: 'cap-status',
            html: 'Status'
        }, {
            xtype: 'displayfield',
            fieldLabel: '<b>Event</b>',
            id: 'cap-en-event',
            html: 'Event'
        }, {
            xtype: 'radiogroup',
            fieldLabel: '<b>Urgency</b>',
            id: 'cap-urgency',
            allowBlank: false,
            //width: 500,
            anchor: '60%',
            items: [{boxLabel: 'Unknown', name: 'cap-urgency', inputValue: 'Unknown'},
                {boxLabel: 'Past', name: 'cap-urgency', inputValue: 'Past'},
                {boxLabel: 'Future', name: 'cap-urgency', inputValue: 'Future'},
                {boxLabel: 'Expected', name: 'cap-urgency', inputValue: 'Expected'},
                {boxLabel: 'Immediate', name: 'cap-urgency', inputValue: 'Immediate'}]
        }, {
            xtype: 'radiogroup',
            fieldLabel: '<b>Severity</b>',
            id: 'cap-severity',
            allowBlank: false,
            //width: 500,
            anchor: '60%',
            items: [{boxLabel: 'Unknown', name: 'cap-severity', inputValue: 'Unknown'},
                {boxLabel: 'Minor', name: 'cap-severity', inputValue: 'Minor'},
                {boxLabel: 'Moderate', name: 'cap-severity', inputValue: 'Moderate'},
                {boxLabel: 'Severe', name: 'cap-severity', inputValue: 'Severe'},
                {boxLabel: 'Extreme', name: 'cap-severity', inputValue: 'Extreme'}]
        }, {
            xtype: 'radiogroup',
            fieldLabel: '<b>Certainty</b>',
            id: 'cap-certainty',
            allowBlank: false,
            //width: 500,
            anchor: '60%',
            items: [{boxLabel: 'Unknown', name: 'cap-certainty', inputValue: 'Unknown'},
                {boxLabel: 'Unlikely', name: 'cap-certainty', inputValue: 'Unlikely'},
                {boxLabel: 'Possible', name: 'cap-certainty', inputValue: 'Possible'},
                {boxLabel: 'Likely', name: 'cap-certainty', inputValue: 'Likely'},
                {boxLabel: 'Observed', name: 'cap-certainty', inputValue: 'Observed'}]
        }, {
            fieldLabel: '<b>Headline</b>',
            name: 'cap-en-headline',
            id: 'cap-en-headline',
            width: '75%',
            minLength: 5,
            minLengthText: 'A good headline should say what and where',
            maxLength: 160,
            maxLengthText: 'CAP Headlines cannot be longer than 160 characters',
            blankText: 'MASAS requires a headline value',
            allowBlank: false
        }, {
            xtype: 'textarea',
            fieldLabel: 'Description',
            name: 'cap-en-description',
            id: 'cap-en-description',
            height: 80,
            width: '75%'
        }, {
            fieldLabel: 'Contact',
            name: 'cap-en-contact',
            id: 'cap-en-contact',
            width: '50%'
        }, {
            fieldLabel: 'Web Link',
            name: 'cap-en-web',
            id: 'cap-en-web',
            width: '50%',
            allowBlank: true,
            vtype: 'url'
        }, {
            xtype: 'compositefield',
            fieldLabel: 'Expires at',
            //width: 300,
            //defaults: { flex: 1 },
            items: [{
                name: 'cap-expires-dt',
                id: 'cap-expires-dt',
                width: 95,
                xtype: 'datefield',
                format: 'Y-m-d',
                listeners: {select: function () {
                    var it_check = Ext.getCmp('cap-expires-interval').getValue();
                    if (it_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                } }
            }, {
                name: 'cap-expires-tm',
                id: 'cap-expires-tm',
                width: 60,
                xtype: 'timefield',
                format: 'H:i',
                listeners: {select: function () {
                    var it_check = Ext.getCmp('cap-expires-interval').getValue();
                    if (it_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                } }
            }, {
                xtype: 'displayfield',
                html: 'or Expires in:',
                style: {'padding': '3px 2px 2px 20px'}
            }, intervalCombo ]
        } ]
    });
    
    // create toolbar actions for the map
    var new_action;
    var map_toolbar_items = [];
    // zoom control, TODO: consider removing as zoom extent button exists
    new_action = new Ext.Button({
        text: 'Zoom to Saved View',
        tooltip: 'Zoom to your saved Map View',
        handler: MASAS.zoom_to_default_view
    });
    map_toolbar_items.push(new_action);
    map_toolbar_items.push('-');
    
    var nav_control = new OpenLayers.Control.NavigationHistory();
    MASAS.locationMap.addControl(nav_control);
    // navigation history - two "button" controls
    new_action = new GeoExt.Action({
        text: 'Previous',
        tooltip: 'Zoom to previous view from history',
        iconCls: 'btnLeftArrow',
        control: nav_control.previous,
        disabled: true
    });
    map_toolbar_items.push(new_action);
    map_toolbar_items.push('-');
    new_action = new GeoExt.Action({
        text: 'Next',
        tooltip: 'Zoom to next view in history',
        iconCls: 'btnRightArrow',
        iconAlign: 'right',
        control: nav_control.next,
        disabled: true
    });
    map_toolbar_items.push(new_action);
    map_toolbar_items.push({xtype: 'tbspacer', width: 50});
    
    // address search box for remote geocode searches
    var addressSearchCombo = new Ext.form.ComboBox({
        width: 200,
        listWidth: 300,
        // minimum characters before search query is sent
        minChars: 6,
        // hide trigger of the combo
        hideTrigger: true,
        forceSelection: true,
        loadingText: 'Searching...',
        emptyText: 'Address Search',
        allowBlank: true,
        displayField: 'address',
        store: new Ext.data.Store({
            proxy: new Ext.data.HttpProxy({
                url: MASAS.ADDRESS_SEARCH_URL,
                method: 'GET',
                disableCaching: false
            }),
            reader: new Ext.data.JsonReader({
                root: 'results',
                fields: ['address', 'lat', 'lon']
            })
        }),
        listeners: {select: function (combo, record) {
            var address_xy = new OpenLayers.LonLat(record.data.lon, record.data.lat);
            address_xy = address_xy.transform(new OpenLayers.Projection('EPSG:4326'),
                MASAS.locationMap.getProjectionObject());
            var address_point = new OpenLayers.Geometry.Point(address_xy.lon, address_xy.lat);
            var address_feature = new OpenLayers.Feature.Vector(address_point, null,
                {fillColor: 'red', fillOpacity: 1, strokeColor: 'red', strokeOpacity: 1,
                 pointRadius: 6, label: record.data.address, labelYOffset: 15});
            MASAS.locationMap.getLayersByName('Location')[0].addFeatures([address_feature]);
            MASAS.locationMap.setCenter(address_xy, 14);
        } }
    });
    map_toolbar_items.push(addressSearchCombo);
    map_toolbar_items.push('->');
    
    // show/hide a layer of current entries
    var current_display_button = new Ext.Button({
        text: 'Show Current Feed',
        tooltip: 'Show current feed entries',
        enableToggle: true,
        handler: MASAS.load_current_entries
    });
    map_toolbar_items.push(current_display_button);
    
    // create map panel
    var locationMapPanel = new GeoExt.MapPanel({
        id: 'locationMapPanel',
        collapsible: false,
        style: 'margin-bottom: 5px;',
        //TODO: resizable?
        height: 300,
        map: MASAS.locationMap,
        bbar: map_toolbar_items
    });
    
    var currentAreaSelection = new Ext.grid.CheckboxSelectionModel();
    MASAS.currentAreaGrid = new Ext.grid.GridPanel({
        hideHeaders: true,
        fieldLabel: 'Current',
        hideLabel: true,
        name: 'cap-area-current',
        id: 'cap-area-current',
        width: 250,
        height: 75,
        doValidation: true,
        store: new Ext.data.ArrayStore({
            id: 0,
            fields: ['pos', 'name'],
            data: []
        }),
        cm: new Ext.grid.ColumnModel({
            defaults: { sortable: false },
            columns: [currentAreaSelection, {
                header: "Name",
                width: 225,
                dataIndex: "name"
            }]
        }),
        sm: currentAreaSelection
    });
    
    var areaSearchCombo = new Ext.form.ComboBox({
        id: 'area-search-radius',
        width: 90,
        typeAhead: true,
        forceSelection: true,
        triggerAction: 'all',
        mode: 'local',
        emptyText: 'within...',
        displayField: 'name',
        valueField: 'value',
        store: new Ext.data.ArrayStore({
            id: 0,
            fields: ['value', 'name'],
            data: [ [5, '5 KM'], [50, '50 KM'], [100, '100 KM'] ]
        }),
        listeners: {select: MASAS.existing_area_search}
    });
    
    var areaTypeCombo = new Ext.form.ComboBox({
        id: 'area-search-type',
        width: 150,
        typeAhead: true,
        forceSelection: true,
        triggerAction: 'all',
        mode: 'local',
        displayField: 'name',
        valueField: 'value',
        store: new Ext.data.ArrayStore({
            id: 0,
            fields: ['value', 'name'],
            data: [ ['csd', 'Cities/Towns - CSD'], ['cd', 'Counties - CD'],
                ['other', 'Other'] ]
        }),
        value: 'csd',
        listeners: {select: MASAS.existing_area_search}
    });
    
    MASAS.areaZoneStore = new GeoExt.data.FeatureStore({
        layer: sgcLayer,
        fields: [
            {name: 'e_name', type: 'string'},
            {name: 'f_name', type: 'string'},
            {name: 'sgc', type: 'string'}
        ],
        proxy: new GeoExt.data.ProtocolProxy({
            protocol: new OpenLayers.Protocol.HTTP({
                url: MASAS.AREA_ZONE_URL,
                format: new OpenLayers.Format.GeoJSON({
                    internalProjection: MASAS.locationMap.getProjectionObject(),
                    externalProjection: new OpenLayers.Projection('EPSG:4326')
                })
            })
        }),
        autoLoad: false
    });
    
    MASAS.areaSearchGrid = new Ext.grid.GridPanel({
        hideHeaders: true,
        fieldLabel: '<b>Select</b>',
        name: 'cap-area-zones',
        id: 'cap-area-zones',
        width: 250,
        height: 75,
        doValidation: false,
        store: MASAS.areaZoneStore,
        columns: [{
            header: "Name",
            width: 245,
            dataIndex: "e_name"
        }],
        sm: new GeoExt.grid.FeatureSelectionModel() 
    });

    var locationCAPCard = new Ext.FormPanel({
        id: 'card-2',
        labelWidth: 80,
        items: [{
            xtype: 'fieldset',
            title: 'Location',
            items: [locationMapPanel, {
                xtype: 'compositefield',
                items: [{
                    xtype: 'textfield',
                    fieldLabel: '<b>Point</b> (lat,lon)',
                    name: 'cap-location',
                    id: 'cap-location',
                    width: 200,
                    vtype: 'latlon',
                    blankText: 'MASAS requires a location point',
                    allowBlank: false
                }, {
                    boxLabel: '<span style="color: #606060">Use Alert Area for Location instead of this Point</span>',
                    xtype: 'checkbox',
                    style: 'margin-left: 100px',
                    name: 'discard-event-location',
                    id: 'discard-event-location',
                    checked: false
                }]
            }]
        }, {
            layout: 'column',
            border: false,
            items: [{
                xtype: 'fieldset',
                width: '20%',
                style: 'margin-right: 15px; padding: 5px;',                
                checkboxToggle: true,
                collapsed: false,
                title: 'Current Areas',
                id: 'areaCurrentSet',
                items: [ MASAS.currentAreaGrid ],
                listeners: {
                    expand: function () {
                        MASAS.currentAreaGrid.doValidation = true;
                    },
                    collapse: function () {
                        MASAS.currentAreaGrid.doValidation = false;
                    }
                }
            }, {
                xtype: 'fieldset',
                width: '30%',
                style: 'margin-right: 15px; padding: 5px;',
                labelWidth: 45,
                checkboxToggle: true,
                // default for now is to use create new instead
                collapsed: true,
                title: 'Add Area: Defined Boundaries (CAP-CP)',
                id: 'areaSelectSet',
                items: [{
                    xtype: 'compositefield',
                    fieldLabel: '<b>Search</b>',
                    items: [ areaSearchCombo, areaTypeCombo ]
                }, MASAS.areaSearchGrid ],
                listeners: {
                    expand: function () {
                        var sgc_layer = MASAS.locationMap.getLayersByName('SGC')[0];
                        sgc_layer.setVisibility(true);
                        // collapse the create fieldset, toggle validated fields
                        locationCAPCard.findById('areaCreateSet').collapse();
                        areaSearchCombo.allowBlank = false;
                        MASAS.areaSearchGrid.doValidation = true;
                    },
                    collapse: function () {
                        // hiding the SGC layer because if its not going to be used
                        // it can clutter the map
                        var sgc_layer = MASAS.locationMap.getLayersByName('SGC')[0];
                        sgc_layer.setVisibility(false);
                        areaSearchCombo.allowBlank = true;
                        MASAS.areaSearchGrid.doValidation = false;
                    }
                }
            }, { xtype: 'displayfield', hideLabel: true, html: '<b> OR </b>' }, {
                xtype: 'fieldset',
                width: '20%',
                style: 'margin-left: 15px; padding: 5px;',
                checkboxToggle: true,
                // default for now is to use create new instead
                collapsed: true,
                title: 'Add Area: Custom Boundary',
                id: 'areaCreateSet',
                items: [{
                    xtype: 'displayfield',
                    hideLabel: true,
                    html: 'Using Location as the center of a new area circle'
                }, {
                    xtype: 'textfield',
                    fieldLabel: '<b>Radius</b> (KM)',
                    name: 'cap-radius',
                    id: 'cap-radius',
                    width: 50,
                    vtype: 'radius',
                    blankText: 'A radius in KM is required',
                    allowBlank: false
                }, {
                    xtype: 'textfield',
                    fieldLabel: '<b>Description</b>',
                    name: 'cap-en-area-description',
                    id: 'cap-en-area-description',
                    width: 250,
                    maxLength: 100,
                    blankText: 'An area description is required',
                    allowBlank: false
                }],
                listeners: {
                    expand: function () {
                        // collapse the select fieldset, toggle validated fields
                        locationCAPCard.findById('areaSelectSet').collapse();
                        locationCAPCard.findById('cap-radius').allowBlank = false;
                        locationCAPCard.findById('cap-radius').vtype = 'radius';
                        locationCAPCard.findById('cap-en-area-description').allowBlank = false;
                        optionalCAPCard.findById('cap-fr-area-description').show();
                    },
                    collapse: function () {
                        locationCAPCard.findById('cap-radius').allowBlank = true;
                        locationCAPCard.findById('cap-radius').vtype = null;
                        locationCAPCard.findById('cap-en-area-description').allowBlank = true;
                        optionalCAPCard.findById('cap-fr-area-description').hide();
                    }
                },
                // container to hold SGC geocode search results, with default
                sgcGeocode: ['none']
            }]
        }]
    });


    var vkeyboard_plugin = new Ext.ux.plugins.VirtualKeyboard();
    
    var optionalCAPCard = new Ext.FormPanel({
        id: 'card-3',
        labelWidth: 80,
        bodyStyle: 'padding: 10px;',
        items: [{
            xtype: 'displayfield',
            hideLabel: true,
            html: '<div style="margin-bottom: 15px;"><b>Multiple Languages</b> (Optional)</div>'
        }, {
            xtype: 'fieldset',
            checkboxToggle: true,
            collapsed: true,
            title: 'Add French Content?',
            id: 'cap-add-french',
            defaultType: 'textfield',
            items: [{
                xtype: 'displayfield',
                fieldLabel: '<b>Event</b>',
                name: 'cap-fr-event',
                id: 'cap-fr-event',
                html: 'Event'
            }, {
                fieldLabel: '<b>Headline</b>',
                name: 'cap-fr-headline',
                id: 'cap-fr-headline',
                anchor: '75%',
                minLengthText: 'A good headline should say what and where',
                maxLength: 160,
                maxLengthText: 'CAP Headlines cannot be longer than 160 characters',
                blankText: 'MASAS requires a headline value',
                keyboardConfig: { language: 'French', showIcon: true },
                plugins: vkeyboard_plugin
            }, {
                xtype: 'textarea',
                fieldLabel: 'Description',
                name: 'cap-fr-description',
                id: 'cap-fr-description',
                height: 80,
                anchor: '75%',
                keyboardConfig: { language: 'French', showIcon: true },
                plugins: vkeyboard_plugin
            }, {
                fieldLabel: 'Contact',
                name: 'cap-fr-contact',
                id: 'cap-fr-contact',
                anchor: '50%',
                keyboardConfig: { language: 'French', showIcon: true },
                plugins: vkeyboard_plugin
            }, {
                fieldLabel: 'Web Link',
                name: 'cap-fr-web',
                id: 'cap-fr-web',
                width: '50%',
                allowBlank: true,
                vtype: 'url'
            }, {
                fieldLabel: '<b>Area</b>',
                name: 'cap-fr-area-description',
                id: 'cap-fr-area-description',
                anchor: '35%',
                maxLength: 100,
                blankText: 'An area description is required',
                keyboardConfig: { language: 'French', showIcon: true },
                plugins: vkeyboard_plugin
            }],
            listeners: {
                expand: function () {
                    // enable validation of french values
                    optionalCAPCard.findById('cap-fr-headline').allowBlank = false;
                    optionalCAPCard.findById('cap-fr-headline').minLength = 5;
                    if (!locationCAPCard.findById('areaCreateSet').collapsed) {
                        optionalCAPCard.findById('cap-fr-area-description').allowBlank = false;
                    }
                },
                collapse: function () {
                    // disable validation of french values when not using
                    optionalCAPCard.findById('cap-fr-headline').allowBlank = true;
                    optionalCAPCard.findById('cap-fr-headline').minLength = null;
                    optionalCAPCard.findById('cap-fr-area-description').allowBlank = true;
                }
            }
        }]
    });
    
    
    var postCAPCard = new Ext.Panel({
        id: 'card-4',
        items: [{
            border: false,
            bodyStyle: 'margin-bottom: 50px',
            html: '<div class="postingCard" id="postingBox"><h1>Ready to Post</h1>' + 
                '<a href="#" onclick="MASAS.preview_cap_xml(); return false;" ' +
                'style="color: grey;">Preview</a><a href="#" onclick="MASAS.' + 
                (('Clone' === MASAS.UPDATE_OPERATION) ? 'post_new_alert' : 'post_alert_update') +
                '(); return false;" style="color: green;">Post Alert</a></div>'
        }]
    });
    
    if (MASAS.EMAIL_ADDRESS_LIST) {
        var emailToCombo = new Ext.form.ComboBox({
            fieldLabel: '<b>To</b>',
            name: 'email-to-address',
            id: 'email-to-address',
            width: 300,
            typeAhead: true,
            forceSelection: true,
            triggerAction: 'all',
            mode: 'local',
            store: MASAS.EMAIL_ADDRESS_LIST
        });
    
        postCAPCard.add({
            xtype: 'fieldset',
            id: 'email-to-fieldset',
            hidden: true,
            collapsible: true,
            collapsed: true,
            title: 'Email Forwarding',
            labelWidth: 70,
            listeners: {expand: MASAS.generate_email_content },
            items: [ emailToCombo, {
                xtype: 'textfield',
                fieldLabel: '<b>Subject</b>',
                name: 'email-to-subject',
                id: 'email-to-subject',
                width: 400,
                minLength: 5,
                minLengthText: 'A subject is required',
                maxLength: 250,
                maxLengthText: 'Subject cannot be longer than 250 characters'
            }, {
                xtype: 'textarea',
                fieldLabel: '<b>Message</b>',
                name: 'email-to-message',
                id: 'email-to-message',
                height: 150,
                width: 800,
                minLength: 5,
                minLengthText: 'A message is required'
            }, {
                xtype: 'button',
                fieldLabel: ' ',
                labelSeparator: '',
                text: 'Send',
                width: 75,
                handler: MASAS.post_email_message
            }]
        });
    }


    var capPanel = new Ext.Panel({
        id: 'cap-wizard-panel',
        title: MASAS.UPDATE_OPERATION + ' CAP Alert',
        region: 'center',
        layout: 'card',
        activeItem: 0,
        bodyStyle: 'padding: 10px;',
        defaults: { border: false, autoScroll: true },
        tbar: [
            progressBar,
            '->',
            {text: '<b>Abort</b>',
                iconCls: 'abortButton',
                handler: function () {
                    window.close();
                }
            }
        ],
        bbar: new Ext.Toolbar({ items: [
            {id: 'card-prev',
                text: '<span style="font-weight: bold; font-size: 130%;">Back</span>',
                iconCls: 'previousButton',
                handler: cardNav.createDelegate(this, [-1]),
                disabled: true
            }, { xtype: 'tbspacer', width: 150 },
            {id: 'card-next',
                text: '<span style="font-weight: bold; font-size: 130%;">Next</span>',
                iconCls: 'nextButton',
                iconAlign: 'right',
                handler: cardNav.createDelegate(this, [1])
            }
        ], buttonAlign: 'center' }),
        // the panels (or "cards") within the layout
        items: [ selectCAPCard, inputCAPCard, locationCAPCard, optionalCAPCard, postCAPCard ]
    });
    
    // main layout view, uses entire browser viewport
    var mainView = new Ext.Viewport({
        layout: 'border',
        items: [headerBox, capPanel]
    });


    MASAS.selectMap.setCenter(new OpenLayers.LonLat(-94.0, 52.0).transform(
        new OpenLayers.Projection('EPSG:4326'), MASAS.selectMap.getProjectionObject()), 4);

    MASAS.load_user_entries();
});


MASAS.load_user_entries = function () {
    MASAS.selectLoadingControl.maximizeControl();
    var history_val = Ext.getCmp('history-interval').getValue();
    // default is 0 for alerts that are still current
    var feed_url = OpenLayers.Util.urlAppend(MASAS.FEED_URL,
        'secret=' + MASAS.USER_SECRET + '&lang=en&author=' + MASAS.USER_URI);
    if (history_val !== 0) {
        var now_time = new Date();
        var now_epoch = now_time.getTime();
        // number of epoch milliseconds based on issued hours difference
        var diff_hours = parseInt(history_val, 10);
        var diff_epoch = now_epoch - (3600000 * diff_hours);
        // convert to UTC for Atom accounting for format times being in -/+ seconds
        var now_offset = parseInt(now_time.format('Z'), 10);
        if (now_offset < 0) {
            diff_epoch = (Math.abs(now_offset) * 1000) + diff_epoch;
        } else if (now_offset > 0) {
            diff_epoch = (Math.abs(now_offset) * 1000) - diff_epoch;
        }
        var since_date = new Date();
        since_date.setTime(diff_epoch);
        // using Ext extensions to Date for formatting
        var since_string = since_date.format('Y-m-d\\TH:i:s\\Z');
        feed_url += '&dtsince=' + since_string;
    }
    // support proxies
    if (MASAS.AJAX_PROXY_URL) {
        feed_url = MASAS.AJAX_PROXY_URL + encodeURIComponent(feed_url);
    }
    console.debug('Loading User Entries');
    console.log(feed_url);
    MASAS.selectStore.proxy.protocol.options.url = feed_url;
    MASAS.selectStore.load();
};

MASAS.load_past_alert = function (atom_link, cap_link, msg_type) {
    if (!cap_link || !atom_link) {
        console.error('Links missing');
        alert('Entry or Alert Link Unavailable');
        return;
    }
    MASAS.UPDATE_OPERATION = msg_type;
    console.debug('Loading Past Entry: ' + atom_link);
    // sync loading these urls
    var atom_get = new OpenLayers.Request.GET({
        url: atom_link,
        params: {'secret': MASAS.USER_SECRET},
        async: false,
        proxy: MASAS.AJAX_PROXY_URL
    });
    if (atom_get.status !== 200) {
        console.error('Load Past Entry Error: ' + atom_get.responseText);
        alert('Unable to load Atom Entry.');
        return;
    }
    var xml_doc = MASAS.parse_xml(atom_get.responseText);
    if (!xml_doc) {
        console.error('Error parsing past entry XML');
        alert('Unable to parse Atom Entry.');
        return;
    }
    var atom_json = xmlJsonClass.xml2json(xml_doc, '  ');
    try {
        MASAS.oldAtom = JSON.parse(atom_json);
    } catch (err) {
        console.error('Past entry JSON parse error: ' + err);
        alert('Unable to parse Atom Entry.');
        MASAS.oldAtom = null;
        return;
    }
    console.debug('Loading Past CAP: ' + cap_link);
    var cap_get = new OpenLayers.Request.GET({
        url: cap_link,
        params: {'secret': MASAS.USER_SECRET},
        async: false,
        proxy: MASAS.AJAX_PROXY_URL
    });
    if (cap_get.status !== 200) {
        console.error('Load Past CAP Error: ' + cap_get.responseText);
        alert('Unable to load CAP Alert.');
        return;
    }
    var cap_json = xmlJsonClass.xml2json(MASAS.parse_xml(cap_get.responseText), '  ');
    try {
        MASAS.oldCAP = JSON.parse(cap_json);
    } catch (err) {
        console.error('Past CAP JSON parse error: ' + err);
        alert('Unable to parse CAP Entry.');
        MASAS.oldCAP = null;
        return;
    }
    if (MASAS.oldCAP.alert.msgType === 'Cancel') {
        alert('Cannot use an already Cancelled Message.');
        return;
    }
    var value_result = MASAS.load_past_values();
    if (!value_result) {
        alert('Unable to Load CAP Message.');
        return;
    }
    // set Cancel to expire in 1 hour as default
    if (msg_type === 'Cancel') {
        Ext.getCmp('cap-expires-interval').setValue(1);
        Ext.getCmp('cap-expires-interval').addClass('expiresIntervalDefault');
    }
    
    // advance to the next card
    var next_button = Ext.getCmp('card-next');
    next_button.handler.call(next_button.scope, next_button, Ext.EventObject);
};

MASAS.load_past_values = function () {
    if (!MASAS.oldAtom || !MASAS.oldCAP) {
        console.error('oldAtom or oldCAP missing, unable to load past values');
        return false;
    }
    console.debug('Loading Past Values');
    console.log(MASAS.oldAtom);
    console.log(MASAS.oldCAP);
    
    // reset all of the form fields in case user is changing the selected alert
    Ext.getCmp('card-1').getForm().reset();
    Ext.getCmp('cap-expires-interval').fireEvent('afterrender',
        Ext.getCmp('cap-expires-interval'));
    Ext.getCmp('card-2').getForm().reset();
    MASAS.locationMap.getLayersByName('Location')[0].removeAllFeatures();
    MASAS.locationMap.getLayersByName('SGC')[0].removeAllFeatures();
    Ext.getCmp('cap-area-current').store.removeAll();
    Ext.getCmp('areaSelectSet').collapse();
    Ext.getCmp('areaCreateSet').collapse();
    Ext.getCmp('card-3').getForm().reset();
    Ext.getCmp('cap-add-french').collapse();
    //TODO: if a user selects an english only alert, then goes back and selects
    //      a bilingual alert, it will show the input boxes because of this
    //      reset, but they are sized wrong on the screen
    Ext.getCmp('cap-add-french').show();
    
    Ext.getCmp('cap-status').setValue(MASAS.oldCAP.alert.status);
    // info blocks may be english only or english and french
    //TODO: add better ability to detect the correct info block
    var en_info = null;
    var fr_info = null;
    if (MASAS.oldCAP.alert.info instanceof Array) {
        if (MASAS.oldCAP.alert.info[0].language === 'en-CA') {
            en_info = MASAS.oldCAP.alert.info[0];
        }
        if (MASAS.oldCAP.alert.info[1].language === 'fr-CA') {
            fr_info = MASAS.oldCAP.alert.info[1];
        }
    } else if (typeof(MASAS.oldCAP.alert.info) === "object") {
        if (MASAS.oldCAP.alert.info.language === 'en-CA') {
            en_info = MASAS.oldCAP.alert.info;
        }
    }
    if (!en_info) {
        return false;
    }
    
    Ext.getCmp('cap-en-event').setValue(en_info.event);
    Ext.getCmp('cap-urgency').setValue(en_info.urgency);
    Ext.getCmp('cap-severity').setValue(en_info.severity);
    Ext.getCmp('cap-certainty').setValue(en_info.certainty);
    if (en_info.headline) {
        Ext.getCmp('cap-en-headline').setValue(en_info.headline);
    }
    if (en_info.description) {
        Ext.getCmp('cap-en-description').setValue(en_info.description);
    }
    if (en_info.contact) {
        Ext.getCmp('cap-en-contact').setValue(en_info.contact);
    }
    if (en_info.web) {
        Ext.getCmp('cap-en-web').setValue(en_info.web);
    }
    
    //TODO: handle multiple parameters and other types
    var event_location_param = null;
    if (en_info.parameter) {
        if (typeof(en_info.parameter) === 'object') {
            if (en_info.parameter.valueName === 'layer:CAPAN:eventLocation:point') {
                event_location_param = en_info.parameter.value;
            }
        } else if (typeof(en_info.parameter) === 'array') {
            for (var i = 0; i < en_info.parameter.length; i++) {
                if (en_info.parameter[i].valueName === 'layer:CAPAN:eventLocation:point') {
                    event_location_param = en_info.parameter[i].value;
                    break;
                }
            }
        }
    }
    if (event_location_param) {
        Ext.getCmp('cap-location').setValue(event_location_param);
        var location_vals = event_location_param.split(',');
        var location_xy = new OpenLayers.LonLat(location_vals[1], location_vals[0]);
        location_xy = location_xy.transform(new OpenLayers.Projection('EPSG:4326'),
            MASAS.locationMap.getProjectionObject());
        var location_point = new OpenLayers.Geometry.Point(location_xy.lon, location_xy.lat);
        var location_feature = new OpenLayers.Feature.Vector(location_point);
        MASAS.locationMap.getLayersByName('Location')[0].addFeatures([location_feature]);
        // zoom to show the new feature, GeoExt will override and use the mapPanel
        // center,zoom,extent values when the panel is first opened, after that
        // the normal OpenLayers methods work for any subsequent loads
        var map_panel = Ext.getCmp('locationMapPanel');
        map_panel.center = location_xy;
        map_panel.zoom = 12;
        MASAS.locationMap.setCenter(location_xy, 12);
    } else {
        //TODO: since the map doesn't have anything to zoom to, could instead
        //            use the Entry's geometry instead
        Ext.getCmp('cap-location').setValue('Not Available');
        Ext.getCmp('discard-event-location').setValue(true);
    }
    
    if (!en_info.area) {
        return false;
    }
    var area_current = Ext.getCmp('cap-area-current');
    // current area array position used for an ID for now
    if (en_info.area instanceof Array) {
        for (var i = 0; i < en_info.area.length; i++) {
            area_current.store.add(new Ext.data.Record({pos: i, name: en_info.area[i].areaDesc}));
        }
    } else if (typeof(en_info.area) === "object") {
        area_current.store.add(new Ext.data.Record({pos: 0, name: en_info.area.areaDesc}));
    }
    area_current.getSelectionModel().selectAll();
    
    if (fr_info) {
        Ext.getCmp('cap-add-french').expand();
        Ext.getCmp('cap-fr-event').setValue(fr_info.event);
        if (fr_info.headline) {
            Ext.getCmp('cap-fr-headline').setValue(fr_info.headline);
        }
        if (fr_info.description) {
            Ext.getCmp('cap-fr-description').setValue(fr_info.description);
        }
        if (fr_info.contact) {
            Ext.getCmp('cap-fr-contact').setValue(fr_info.contact);
        }
        if (fr_info.web) {
            Ext.getCmp('cap-fr-web').setValue(fr_info.web);
        }
    } else {
        // no updates to add french to an original english only alert for now
        Ext.getCmp('cap-add-french').hide();
    }
    
    return true;
};

MASAS.save_location_point = function (feature) {
    console.debug('Saving Location');
    console.log(feature);
    // highlight the geometry that will be used for location
    if (feature.layer) {
        for (var f = 0; f < feature.layer.features.length; f++) {
            feature.layer.features[f].renderIntent = 'default';
        }
        feature.renderIntent = 'select';
        feature.layer.redraw();
    }
    if (feature.geometry) {
        var new_point = new OpenLayers.Geometry.Point(feature.geometry.x, feature.geometry.y);
        new_point.transform(MASAS.locationMap.getProjectionObject(), new OpenLayers.Projection('EPSG:4326'));
        var location_box = document.getElementById('cap-location');
        location_box.value = new_point.y.toPrecision(7) + ',' + new_point.x.toPrecision(7);
        // display a temporary notification message to better inform the user when
        // the field value that will be used for location has been updated
        var msg = Ext.Msg.show({
            msg: 'Updated Location',
            cls: 'locationNotificationMsg',
            closable: false,
            modal: false,
            minWidth: 170
        });
        msg.getDialog().alignTo('cap-location', 'tr?', [25, -25]);
        setTimeout(function () {
            Ext.Msg.hide();
        }, 2500);
        // deselect whatever control was used to draw/save this feature to set
        // the map back up as originally viewed by user
        var feature_controls = MASAS.locationMap.getControlsBy('featureControl', true);
        for (var c = 0; c < feature_controls.length; c++) {
            feature_controls[c].deactivate();
        }
        MASAS.locationMap.getControlsBy('title', 'Pan/Zoom')[0].activate();
    }
    console.debug('Point: ' + location_box.value);
};

MASAS.existing_area_search = function () {
    var point_value = Ext.getCmp('cap-location').getValue();
    var search_radius = Ext.getCmp('area-search-radius').value;
    var search_type = Ext.getCmp('area-search-type').value;
    if (Ext.form.VTypes.latlon(point_value) === false || point_value === 'Not Available') {
        alert('A valid Location Point is needed for Area Search.');
        return;
    }
    if (!search_radius) {
        alert('Search Radius Missing.');
        return;
    }
    // options.url is what's used for actual loading
    var new_url = OpenLayers.Util.urlAppend(MASAS.AREA_ZONE_URL,
        'point=' + point_value + '&radius=' + search_radius + '&type=' + search_type);
    MASAS.areaZoneStore.proxy.protocol.options.url = new_url;
    MASAS.areaZoneStore.load();
};

MASAS.custom_geocode_search = function () {
    var point_value = Ext.getCmp('cap-location').getValue();
    var search_radius = Ext.getCmp('cap-radius').getValue();
    if (!point_value) {
        alert('Location Point Missing.');
        return;
    }
    if (!search_radius) {
        alert('Custom Boundary Radius Missing.');
        return;
    }
    OpenLayers.Request.GET({
        url: MASAS.AREA_ZONE_URL,
        params: {'point': point_value, 'radius': search_radius, 'type': 'csd',
            'geocode': 'yes'},
        success: function (xhr) {
            try {
                // should be a list of any applicable geocodes
                Ext.getCmp('areaCreateSet').sgcGeocode = JSON.parse(xhr.responseText);
            } catch (err) {
                // not warning user, will continue with existing default 'none'
                console.error('Custom Geocode Error: ' + err);
            }
        },
        failure: function () {
            // not warning user, will continue with existing default 'none'
            console.error('Error geocoding custom boundary');
        }
    });
};

MASAS.generate_cap_xml = function () {
    if (!MASAS.CAP_MESSAGE) {
        console.error('CAP Object missing');
        alert('Unable to load CAP Message.');
    }
    // cloning CAP_MESSAGE each time required for cases where a user
    // goes back and add/removes values after doing a preview which
    // results in a modified CAP_MESSAGE being used to build the post XML
    var new_message = MASAS.clone_object(MASAS.CAP_MESSAGE);
    
    //TODO: consider using only UTC for this sent date??
    var sent_time = new Date();
    // using Ext extensions to Date for formatting
    new_message.alert.sent = sent_time.format('Y-m-d\\TH:i:sP');
    new_message.alert.status = MASAS.oldCAP.alert.status;
    if (MASAS.UPDATE_OPERATION !== 'Clone') {
        new_message.alert.msgType = MASAS.UPDATE_OPERATION;
        if (MASAS.oldCAP.alert.references) {
            new_message.alert.references = MASAS.oldCAP.alert.references + ' ' +
                MASAS.oldCAP.alert.sender + ',' + MASAS.oldCAP.alert.identifier + ',' +
                MASAS.oldCAP.alert.sent;
        } else {
            new_message.alert.references = MASAS.oldCAP.alert.sender + ',' +
                MASAS.oldCAP.alert.identifier + ',' + MASAS.oldCAP.alert.sent;
        }
    }
    // new info_block order for english users
    var en_info = new_message.alert.info[0];
    var fr_info = new_message.alert.info[1];
    // info blocks may be english only or english and french
    //TODO: add better ability to detect the correct info block
    var old_en_info = null;
    var old_fr_info = null;
    if (MASAS.oldCAP.alert.info instanceof Array) {
        if (MASAS.oldCAP.alert.info[0].language === 'en-CA') {
            old_en_info = MASAS.oldCAP.alert.info[0];
        }
        if (MASAS.oldCAP.alert.info[1].language === 'fr-CA') {
            old_fr_info = MASAS.oldCAP.alert.info[1];
        }
    } else if (typeof(MASAS.oldCAP.alert.info) === "object") {
        if (MASAS.oldCAP.alert.info.language === 'en-CA') {
            old_en_info = MASAS.oldCAP.alert.info;
        }
    }
    
    en_info.event = old_en_info.event;
    en_info.category = old_en_info.category;
    en_info.eventCode.value = old_en_info.eventCode.value;
    // adding some form based french values, if no french block will delete later
    if (old_fr_info) {
        fr_info.event = old_fr_info.event;
        fr_info.category = old_fr_info.category;
        fr_info.eventCode.value = old_fr_info.eventCode.value;
    }
    en_info.urgency = Ext.getCmp('cap-urgency').getValue().getGroupValue();
    en_info.severity = Ext.getCmp('cap-severity').getValue().getGroupValue();
    en_info.certainty = Ext.getCmp('cap-certainty').getValue().getGroupValue();
    fr_info.urgency = Ext.getCmp('cap-urgency').getValue().getGroupValue();
    fr_info.severity = Ext.getCmp('cap-severity').getValue().getGroupValue();
    fr_info.certainty = Ext.getCmp('cap-certainty').getValue().getGroupValue();
    var expires_dt = Ext.get('cap-expires-dt').getValue();
    var expires_tm = Ext.get('cap-expires-tm').getValue();
    var expires_it = Ext.getCmp('cap-expires-interval').getValue();
    if (expires_dt && expires_tm) {
        en_info.expires = expires_dt + 'T' + expires_tm + ':00' + sent_time.format('P');
        fr_info.expires = expires_dt + 'T' + expires_tm + ':00' + sent_time.format('P');
    } else if (expires_it) {
        var expires_time = new Date();
        var expires_epoch = expires_time.getTime();
        expires_epoch += parseInt(expires_it, 10) * 3600000;
        expires_time.setTime(expires_epoch);
        en_info.expires = expires_time.format('Y-m-d\\TH:i:00P');
        fr_info.expires = expires_time.format('Y-m-d\\TH:i:00P');
    } else {
        delete en_info.expires;
        delete fr_info.expires;
    }
    en_info.headline = MASAS.xml_encode(Ext.get('cap-en-headline').getValue());
    fr_info.headline = MASAS.xml_encode(Ext.get('cap-fr-headline').getValue());
    // clean out defaults for area that the user didn't fill in
    en_info.headline = en_info.headline.replace(' for (area)', '');
    fr_info.headline = fr_info.headline.replace(' pour (area)', '');
    var en_description = Ext.get('cap-en-description').getValue();
    if (en_description) {
        en_info.description = MASAS.xml_encode(en_description);
    } else {
        delete en_info.description;
    }
    var fr_description = Ext.get('cap-fr-description').getValue();
    if (fr_description) {
        fr_info.description = MASAS.xml_encode(fr_description);
    } else {
        delete fr_info.description;
    }
    var en_contact = Ext.get('cap-en-contact').getValue();
    if (en_contact) {
        en_info.contact = MASAS.xml_encode(en_contact);
    } else {
        delete en_info.contact;
    }
    var fr_contact = Ext.get('cap-fr-contact').getValue();
    if (fr_contact) {
        fr_info.contact = MASAS.xml_encode(fr_contact);
    } else {
        delete fr_info.contact;
    }
    var en_web = Ext.get('cap-en-web').getValue();
    if (en_web) {
        en_info.web = MASAS.xml_encode(en_web);
    } else {
        delete en_info.web;
    }
    var fr_web = Ext.get('cap-fr-web').getValue();
    if (fr_web) {
        fr_info.web = MASAS.xml_encode(fr_web);
    } else {
        delete fr_info.web;
    }
    if (Ext.getCmp('discard-event-location').checked) {
        // location will be based on area polygons instead
        delete en_info.parameter;
        delete fr_info.parameter;
    } else {
        en_info.parameter.value = Ext.get('cap-location').getValue();
        fr_info.parameter.value = Ext.get('cap-location').getValue();
    }
    
    var en_area_blocks = [];
    var fr_area_blocks = [];
    // add any old selected areas first before adding new ones
    if (!Ext.getCmp('areaCurrentSet').collapsed) {
        var current_vals = MASAS.currentAreaGrid.getSelectionModel().getSelections();
        if (old_en_info.area instanceof Array) {
            if (current_vals.length !== 0) {
                for (var i = 0; i < current_vals.length; i++) {
                    old_en_info.area[current_vals[i].data.pos].areaDesc = MASAS.xml_encode(old_en_info.area[current_vals[i].data.pos].areaDesc);
                    en_area_blocks.push(old_en_info.area[current_vals[i].data.pos]);
                }
            }
        } else if (typeof(old_en_info.area) === "object") {
            if (current_vals.length !== 0) {
                // only one old area and its the only selection as well
                old_en_info.area.areaDesc = MASAS.xml_encode(old_en_info.area.areaDesc);
                en_area_blocks.push(old_en_info.area);
            }
        }
        // assuming that english area ordering is the same as french...
        if (old_fr_info) {
            if (old_fr_info.area instanceof Array) {
                if (current_vals.length !== 0) {
                    for (var j = 0; j < current_vals.length; j++) {
                        old_fr_info.area[current_vals[j].data.pos].areaDesc = MASAS.xml_encode(old_fr_info.area[current_vals[j].data.pos].areaDesc);
                        fr_area_blocks.push(old_fr_info.area[current_vals[j].data.pos]);
                    }
                }
            } else if (typeof(old_fr_info.area) === "object") {
                if (current_vals.length !== 0) {
                    // only one old area and its the only selection as well
                    old_fr_info.area.areaDesc = MASAS.xml_encode(old_fr_info.area.areaDesc);
                    fr_area_blocks.push(old_fr_info.area);
                }
            }
        }
    }
    if (!Ext.getCmp('areaCreateSet').collapsed) {
        // custom area with any found geocodes that match
        var circle_val = Ext.get('cap-location').getValue() + ' ' +
            Ext.get('cap-radius').getValue();
        var geocode_list = Ext.getCmp('areaCreateSet').sgcGeocode;
        var new_geocodes = [];
        for (var k = 0; k < geocode_list.length; k++) {
            new_geocodes.push({valueName: 'profile:CAP-CP:Location:0.3',
                value: geocode_list[k]});
        }
        en_area_blocks.push({areaDesc: MASAS.xml_encode(Ext.get('cap-en-area-description').getValue()),
            circle: circle_val, geocode: new_geocodes});
        fr_area_blocks.push({areaDesc: MASAS.xml_encode(Ext.get('cap-fr-area-description').getValue()),
            circle: circle_val, geocode: new_geocodes});
    } else if (!Ext.getCmp('areaSelectSet').collapsed) {    
        var zone_vals = MASAS.areaSearchGrid.getSelectionModel().getSelections();
        for (var k = 0; k < zone_vals.length; k++) {
            var each_zone = zone_vals[k];
            var zone_feature = each_zone.data.feature.clone();
            zone_feature.geometry.transform(MASAS.locationMap.getProjectionObject(),
                new OpenLayers.Projection('EPSG:4326'));
            var zone_points = [];
            for (var l = 0; l < zone_feature.geometry.components[0].components.length; l++) {
                zone_points.push(zone_feature.geometry.components[0].components[l].y.toPrecision(8) +
                    ',' + zone_feature.geometry.components[0].components[l].x.toPrecision(8));
            }
            en_area_blocks.push({areaDesc: each_zone.data.e_name,
                polygon: zone_points.join(' '),
                geocode: {valueName: 'profile:CAP-CP:Location:0.3',
                    value: each_zone.data.sgc}
            });
            fr_area_blocks.push({areaDesc: each_zone.data.f_name,
                polygon: zone_points.join(' '),
                geocode: {valueName: 'profile:CAP-CP:Location:0.3',
                    value: each_zone.data.sgc}
            });
        }
    }
    // check for single areas which don't get set as an array of objects
    if (en_area_blocks.length === 1) {
        en_info.area = en_area_blocks[0];
    } else {
        en_info.area = en_area_blocks;
    }
    if (fr_area_blocks.length === 1) {
        fr_info.area = fr_area_blocks[0];
    } else {
        fr_info.area = fr_area_blocks;
    }
    
    if (Ext.getCmp('cap-add-french').collapsed) {
        // remove the french info block by converting from an array of two
        // objects to just one
        new_message.alert.info = en_info;
    }
    
    var new_xml = xmlJsonClass.json2xml(new_message, '');
    new_xml = MASAS.format_xml(new_xml);
    new_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new_xml;
    
    return [new_xml, new_message];
};

MASAS.preview_cap_xml = function () {
    // only one review window allowed
    if (MASAS.reviewWindow) {
        MASAS.reviewWindow.destroy();
    }
    
    var preview_xml_vals = MASAS.generate_cap_xml();
    var display_xml = preview_xml_vals[0];
    try {
        // XTemplate from post-templates.js
        var display_html = MASAS.CAPToHTMLTemplate.apply(preview_xml_vals[1]);
    } catch (err) {
        console.error('Preview CAP Template Error: ' + err);
        alert('CAP Template Error.');
        return;
    }
    display_xml = display_xml.replace(/</g, '&lt;');
    display_xml = display_xml.replace(/>/g, '&gt;');
    display_html += '<br><br>&nbsp;&nbsp;<a href="#" onclick="' +
        'document.getElementById(\'preview-xml-box\').style.display=\'block\'; return false;">' +
        '<b>CAP XML</b></a><div id="preview-xml-box" style="display: none;"><pre>' +
        display_xml + '</pre></div>';
    
    MASAS.reviewWindow = new Ext.Window({
        title: 'CAP Preview',
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

MASAS.post_new_alert = function () {
    var posting_html = '<h1>Posting Alert</h1><div class="postingWait"></div>';
    document.getElementById('postingBox').innerHTML = posting_html;
    MASAS.postingTimer = setTimeout(MASAS.post_timeout_error, 15000);
    // once a post is made, don't allow going back to retry with this session's data
    //TODO: the following is not working to prevent going back
    //Ext.getCmp('card-prev').setDisabled();
    var new_cap_xml_vals = MASAS.generate_cap_xml();
    console.debug('Posting New CAP Alert');
    var do_post = new OpenLayers.Request.POST({
        url: MASAS.FEED_URL,
        params: {'secret': MASAS.USER_SECRET},
        proxy: MASAS.AJAX_PROXY_URL,
        headers: {'Content-Type': 'application/common-alerting-protocol+xml'},
        data: new_cap_xml_vals[0],
        callback: MASAS.post_complete_result
    });
};

MASAS.post_alert_update = function () {
    var posting_html = '<h1>Posting Alert</h1><div class="postingWait"></div>';
    document.getElementById('postingBox').innerHTML = posting_html;
    MASAS.postingTimer = setTimeout(MASAS.post_timeout_error, 15000);
    // once a post is made, don't allow going back to retry with this session's data
    //TODO: not working
    //Ext.getCmp('card-prev').setDisabled();
    // find the content link to update/cancel CAP content
    var content_url = null;
    for (var i = 0; i < MASAS.oldAtom.entry.link.length; i++) {
        if (MASAS.oldAtom.entry.link[i]['@rel'] === 'edit-media') {
            content_url = MASAS.oldAtom.entry.link[i]['@href'];
        }
    }
    if (content_url === null) {
        console.error('Unable to find edit url to post update to Alert');
        alert('Cannot Post this Alert.');
        return;
    }
    var new_cap_xml_vals = MASAS.generate_cap_xml();
    console.debug('Posting Alert Update');
    var do_post = new OpenLayers.Request.PUT({
        url: content_url,
        params: {'secret': MASAS.USER_SECRET},
        proxy: MASAS.AJAX_PROXY_URL,
        headers: {'Content-Type': 'application/common-alerting-protocol+xml'},
        data: new_cap_xml_vals[0],
        callback: MASAS.post_complete_result
    });
};

