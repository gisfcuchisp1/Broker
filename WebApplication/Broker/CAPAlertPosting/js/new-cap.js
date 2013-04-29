/**
Create New CAP Alert
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
MASAS.locationMap = null;
MASAS.areaZoneStore = null;
MASAS.areaSearchGrid = null;
MASAS.currentLoadingControl = null;
MASAS.reviewWindow = null;
MASAS.postingTimer = null;
MASAS.POST_RESULT = '';

// for progress bar indicator
MASAS.PROGRESS_AMOUNT = 0;
// complete is 1 so divide by number of pages
MASAS.PROGRESS_INCREMENT = 0.33;

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
    var v_result = MASAS.validators.check_point(v);
    if (v_result[1] === false) {
        alert('Please note that this Location is outside North America.');
    }
    
    return v_result[0];
};
Ext.form.VTypes.latlonText = 'Must be valid latitude,longitude';

Ext.onReady(function () {

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
    var navControl = new OpenLayers.Control.Navigation({ title: 'Pan/Zoom' });
    var editPanel = new OpenLayers.Control.Panel({ displayClass: 'editPanel' });
    editPanel.addControls([
        navControl,
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.Point,
            { displayClass: 'pointButton', title: 'Add point', featureControl: true,
                featureAdded: MASAS.save_location_point
            }),
    // using [location_layer] to allow selection when currentLayer is active
        new OpenLayers.Control.SelectFeature([locationLayer],
            { displayClass: 'saveButton', title: 'Save Point', hover: false,
                featureControl: true, onSelect: MASAS.save_location_point
            })
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

        // validate this card's form items first
        var found_invalid_item = false;
        card_panel.activeItem.cascade(function (item) {
            if (item.isFormField) {
                if (!item.validate()) {
                    found_invalid_item = true;
                }
            }
        });
        // validation check is performed here, comment out to bypass
        if (found_invalid_item) {
            return;
        }

        // validation for event tree selection and expires on input card
        if (current_card === '0') {
            var event_selection = Ext.getCmp('cap-event').getSelectionModel().getSelectedNode();
            if (!event_selection) {
                alert('An event must be selected.');
                return;
            } else {
                if (!event_selection.attributes.term) {
                    alert('An event must be selected.');
                    return;
                }
            }
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

        // special validation for area zones since its a grid
        if (current_card === '1') {
            if (MASAS.areaSearchGrid.doValidation) {
                if (!MASAS.areaSearchGrid.getSelectionModel().hasSelection()) {
                    alert('Area selection is required.');
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
        //Ext.getCmp('card-prev').setDisabled(next_card == 0);
        // set to max number of cards
        //Ext.getCmp('card-next').setDisabled(next_card == 3);
        if (direction === 1) {
            MASAS.PROGRESS_AMOUNT += MASAS.PROGRESS_INCREMENT;
        } else if (direction === -1) {
            MASAS.PROGRESS_AMOUNT -= MASAS.PROGRESS_INCREMENT;
        }
        progressBar.updateProgress(MASAS.PROGRESS_AMOUNT);
    };

    var doSubmit = function () {
        var accesscode = Ext.getCmp('cap-accesscode').getValue();
        if (!accesscode) {
            alert("Access Code must be set.");
            return;
        }
        var event_selection = Ext.getCmp('cap-event').getSelectionModel().getSelectedNode();
        if (!event_selection) {
            alert('An event must be selected.');
            return;
        } else {
            if (!event_selection.attributes.term) {
                alert('An event must be selected.');
                return;
            }
        }
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
        var urgency = Ext.getCmp('cap-urgency').getValue();
        var severity = Ext.getCmp('cap-severity').getValue();
        var certainty = Ext.getCmp('cap-certainty').getValue();
        if (!urgency) {
            alert("Urgency must be set.");
            return;
        }
        if (!severity) {
            alert("Severity must be set.");
            return;
        }
        if (!certainty) {
            alert("Certainty must be set.");
            return;
        }

        if (!confirm("Are you sure you want to submit this event?")) {
            return;
        }

        MASAS.post_new_alert();
    };


    var statusCombo = new Ext.form.ComboBox({
        fieldLabel: '<b>Status</b>',
        name: 'cap-status',
        id: 'cap-status',
        allowBlank: false,
        width: 100,
        forceSelection: true,
        triggerAction: 'all',
        mode: 'local',
        displayField: 'name',
        valueField: 'name',
        tpl: '<tpl for="."><div ext:qtip="{tip}" class="x-combo-list-item">{name}</div></tpl>',
        store: new Ext.data.ArrayStore({
            id: 0,
            fields: ['name', 'tip'],
            // used by MASAS-X to set different values depending on Mode
            data: (MASAS.CUSTOM_STATUS_VALUES) ? MASAS.CUSTOM_STATUS_VALUES :
                [['Actual', 'Actual Entries'],
                ['Exercise', 'Exercises and other practice entries'],
                ['Test', 'Test Entries']]
        }),
        listeners: {
            afterrender: function (combo) {
                // need to set an initial selection this way because you don't
                // know what the first value might be up front when using
                // custom values, 
                var first_val = combo.getStore().getAt(0);
                combo.setValue(first_val.get('name'));
            }
        }
    });

    var eventTree = new Ext.tree.TreePanel({
        id: 'cap-event',
        autoScroll: true,
        animate: true,
        border: true,
        height: 175,
        width: 500,
        dataUrl: MASAS.EVENT_LIST_URL,
        requestMethod: 'GET',
        //TODO: listeners: {exception: function () { alert('Unable to load Event Data'); }}
        root: {
            nodeType: 'async',
            text: 'Root Node'
        },
        rootVisible: false,
        listeners: {
            render: function () {
                this.getRootNode().expand();
            },
            click: function (node) {
                if (node.attributes.term !== null) {
                    var icon_url = MASAS.ICON_PREVIEW_URL + node.attributes.term +
                        '/large.png';
                    Ext.getCmp('icon-preview-box').setValue('<div style="padding: 15px;"><img src="' +
                        icon_url + '" alt="Icon"></div>');
                }
                // updating both english and french values, setRawValue means no validation
                if (node.attributes.text) {
                    inputCAPCard.findById('cap-en-headline').setRawValue(node.attributes.text +
                        ' alert issued by ' + MASAS.CAP_MESSAGE.alert.info[0].senderName + ' for (area)');
                }
                if (node.attributes.f_text) {
                    optionalCAPCard.findById('cap-fr-headline').setRawValue(node.attributes.f_text +
                        ' alerte publie du ' + MASAS.CAP_MESSAGE.alert.info[1].senderName + ' pour (area)');
                }
            }
        },
        tbar: ['Search:', {
            xtype: 'trigger',
            width: 100,
            triggerClass: 'x-form-clear-trigger',
            onTriggerClick: function () {
                this.setValue('');
                eventTree.filter.clear();
            },
            id: 'filter',
            enableKeyEvents: true,
            listeners: {
                keyup: { buffer: 150, fn: function (field, e) {
                    if (Ext.EventObject.ESC === e.getKey()) {
                        field.onTriggerClick();
                    } else {
                        var val = this.getRawValue();
                        var re = new RegExp('.*' + val + '.*', 'i');
                        eventTree.filter.clear();
                        eventTree.filter.filter(re, 'text');
                    }
                }
                }
            }
        }, '->', new Ext.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'iconTreeExpand',
            text: 'Expand',
            tooltip: 'Expand the entire event tree',
            handler: function () {
                eventTree.expandAll();
            }
        }), '-', new Ext.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'iconTreeCollapse',
            text: 'Collapse',
            tooltip: 'Collapse the entire event tree',
            handler: function () {
                eventTree.collapseAll();
            }
        })
        ]
    });
    eventTree.filter = new Ext.ux.tree.TreeFilterX(eventTree);

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
            data: [[null, '', 'Do not set expires'],
                [1, '1 Hour', 'Expires in 1 hour'],
                [6, '6 Hours', 'Expires in 6 hours'],
                [12, '12 Hours', 'Expires in 12 hours'],
                [24, '24 Hours', 'Expires in 1 day'],
                [48, '48 Hours', 'Expires in 2 days']]
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
        id: 'card-0',
        labelWidth: 80,
        bodyStyle: 'padding: 10px;',
        defaultType: 'textfield',
        items: [
        {
            fieldLabel: '<b>Access Code</b>',
            name: 'cap-accesscode',
            id: 'cap-accesscode',
            allowBlank: false,
            width: 200
        },
        statusCombo,
        {
            xtype: 'compositefield',
            fieldLabel: '<b>Event</b>',
            //width: 300,
            //defaults: { flex: 1 },
            items: [eventTree,
            {
                xtype: 'displayfield',
                id: 'icon-preview-box',
                html: '<div style="padding: 15px;"></div>'
            }]
        }, {
            xtype: 'radiogroup',
            fieldLabel: '<b>Urgency</b>',
            id: 'cap-urgency',
            allowBlank: false,
            width: 500,
            items: [{ boxLabel: 'Unknown', name: 'cap-urgency', inputValue: 'Unknown' },
                { boxLabel: 'Past', name: 'cap-urgency', inputValue: 'Past' },
                { boxLabel: 'Future', name: 'cap-urgency', inputValue: 'Future' },
                { boxLabel: 'Expected', name: 'cap-urgency', inputValue: 'Expected' },
                { boxLabel: 'Immediate', name: 'cap-urgency', inputValue: 'Immediate'}]
        }, {
            xtype: 'radiogroup',
            fieldLabel: '<b>Severity</b>',
            id: 'cap-severity',
            allowBlank: false,
            width: 500,
            items: [{ boxLabel: 'Unknown', name: 'cap-severity', inputValue: 'Unknown' },
                { boxLabel: 'Minor', name: 'cap-severity', inputValue: 'Minor' },
                { boxLabel: 'Moderate', name: 'cap-severity', inputValue: 'Moderate' },
                { boxLabel: 'Severe', name: 'cap-severity', inputValue: 'Severe' },
                { boxLabel: 'Extreme', name: 'cap-severity', inputValue: 'Extreme'}]
        }, {
            xtype: 'radiogroup',
            fieldLabel: '<b>Certainty</b>',
            id: 'cap-certainty',
            allowBlank: false,
            width: 500,
            items: [{ boxLabel: 'Unknown', name: 'cap-certainty', inputValue: 'Unknown' },
                { boxLabel: 'Unlikely', name: 'cap-certainty', inputValue: 'Unlikely' },
                { boxLabel: 'Possible', name: 'cap-certainty', inputValue: 'Possible' },
                { boxLabel: 'Likely', name: 'cap-certainty', inputValue: 'Likely' },
                { boxLabel: 'Observed', name: 'cap-certainty', inputValue: 'Observed'}]
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
            width: '75%',
            value: defaultDescription
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
            width: 400,
            defaults: { flex: 1 },
            items: [{
                name: 'cap-expires-dt',
                id: 'cap-expires-dt',
                width: 95,
                xtype: 'datefield',
                format: 'Y-m-d',
                listeners: { select: function () {
                    var it_check = Ext.getCmp('cap-expires-interval').getValue();
                    if (it_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                }
                }
            }, {
                name: 'cap-expires-tm',
                id: 'cap-expires-tm',
                width: 60,
                xtype: 'timefield',
                format: 'H:i',
                listeners: { select: function () {
                    var it_check = Ext.getCmp('cap-expires-interval').getValue();
                    if (it_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                }
                }
            }, {
                xtype: 'displayfield',
                html: 'or Expires in:',
                style: { 'padding': '3px 2px 2px 20px' }
            }, intervalCombo]
        }]
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
    map_toolbar_items.push({ xtype: 'tbspacer', width: 50 });

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
        listeners: { select: function (combo, record) {
            var address_xy = new OpenLayers.LonLat(record.data.lon, record.data.lat);
            address_xy = address_xy.transform(new OpenLayers.Projection('EPSG:4326'),
                MASAS.locationMap.getProjectionObject());
            var address_point = new OpenLayers.Geometry.Point(address_xy.lon, address_xy.lat);
            var address_feature = new OpenLayers.Feature.Vector(address_point, null,
                { fillColor: 'red', fillOpacity: 1, strokeColor: 'red', strokeOpacity: 1,
                    pointRadius: 6, label: record.data.address, labelYOffset: 15
                });
            MASAS.locationMap.getLayersByName('Location')[0].addFeatures([address_feature]);
            MASAS.locationMap.setCenter(address_xy, 14);
        }
        }
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
        collapsible: false,
        style: 'margin-bottom: 5px;',
        //TODO: resizable?
        height: 300,
        map: MASAS.locationMap,
        bbar: map_toolbar_items
    });

    var areaSearchCombo = new Ext.form.ComboBox({
        id: 'area-search-radius',
        width: 100,
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
            data: [[5, '5 KM'], [50, '50 KM'], [100, '100 KM']]
        }),
        listeners: { select: MASAS.existing_area_search }
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
            data: [['csd', 'Cities/Towns - CSD'], ['cd', 'Counties - CD'],
                ['other', 'Other']]
        }),
        value: 'csd',
        listeners: { select: MASAS.existing_area_search }
    });

    MASAS.areaZoneStore = new GeoExt.data.FeatureStore({
        layer: sgcLayer,
        fields: [
            { name: 'e_name', type: 'string' },
            { name: 'f_name', type: 'string' },
            { name: 'sgc', type: 'string' }
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
        id: 'card-1',
        labelWidth: 100,
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
                width: '40%',
                style: 'margin-right: 15px; padding: 5px;',
                checkboxToggle: true,
                // default for now is to use create new instead
                collapsed: true,
                title: 'Area: Defined Boundaries (CAP-CP)',
                id: 'areaSelectSet',
                items: [{
                    xtype: 'compositefield',
                    fieldLabel: '<b>Search</b>',
                    items: [areaSearchCombo, areaTypeCombo]
                }, MASAS.areaSearchGrid],
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
                        // don't allow both fieldsets to be collapsed
                        if (locationCAPCard.findById('areaCreateSet').collapsed) {
                            locationCAPCard.findById('areaCreateSet').expand();
                            return;
                        }
                        areaSearchCombo.allowBlank = true;
                        MASAS.areaSearchGrid.doValidation = false;
                    }
                }
            }, { xtype: 'displayfield', hideLabel: true, html: '<b> OR </b>' }, {
                xtype: 'fieldset',
                width: '40%',
                style: 'margin-left: 15px; padding: 5px;',
                checkboxToggle: true,
                // default for now is to use create new instead
                collapsed: false,
                title: 'Area: Custom Boundary',
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
                        // don't allow both fieldsets to be collapsed
                        if (locationCAPCard.findById('areaSelectSet').collapsed) {
                            locationCAPCard.findById('areaSelectSet').expand();
                            return;
                        }
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
        id: 'card-2',
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
        id: 'card-3',
        items: [{
            border: false,
            bodyStyle: 'margin-bottom: 50px',
            html: '<div class="postingCard" id="postingBox"><h1>Ready to Post</h1>' +
                '<a href="#" onclick="MASAS.preview_cap_xml(); return false;" style="color: grey;">Preview</a>' +
                '<a href="#" onclick="MASAS.post_new_alert(); return false;" style="color: green;">Post Alert</a>' +
                '</div>'
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
            listeners: { expand: MASAS.generate_email_content },
            items: [emailToCombo, {
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
        title: 'New CAP Alert',
        region: 'center',
        layout: 'card',
        activeItem: 0,
        bodyStyle: 'padding: 10px;',
        defaults: { border: false, autoScroll: true },
        bbar: new Ext.Toolbar({ items: [
            { id: 'card-submit',
                text: '<span style="font-weight: bold; font-size: 130%;">Submit</span>',
                iconCls: 'nextButton',
                iconAlign: 'right',
                handler: doSubmit
            }
        ], buttonAlign: 'center'
        }),
        // the panels (or "cards") within the layout
        items: [inputCAPCard, locationCAPCard, optionalCAPCard, postCAPCard]
    });

    // main layout view, uses entire browser viewport
    var mainView = new Ext.Viewport({
        layout: 'border',
        items: [headerBox, capPanel]
    });

});


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
        // the notification message for the popup beside the location field
        var notification_str = 'Location Saved';
        if (location_box.value) {
            var notification_str = 'Updated Location';
        }
        // set the new value, assuming default precision
        location_box.value = new_point.y.toPrecision(7) + ',' + new_point.x.toPrecision(7);
        // display a temporary notification message to better inform the user when
        // the field value that will be used for location is saved/updated
        var msg = Ext.Msg.show({
            msg: notification_str,
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
    if (!point_value) {
        alert('Location Point Missing.');
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

    MASAS.USER_SECRET = Ext.getCmp('cap-accesscode').getValue();

    //TODO: consider using only UTC for this sent date??
    var sent_time = new Date();
    // using Ext extensions to Date for formatting
    new_message.alert.sent = sent_time.format('Y-m-d\\TH:i:sP');
    new_message.alert.status = Ext.get('cap-status').getValue();
    // info_block order for english users
    var en_info = new_message.alert.info[0];
    var fr_info = new_message.alert.info[1];

    var event_selection = Ext.getCmp('cap-event').getSelectionModel().getSelectedNode();
    if (!event_selection) {
        alert('Unable to create CAP XML - Event Data Missing.');
    }
    en_info.event = event_selection.attributes.text;
    fr_info.event = event_selection.attributes.f_text;
    en_info.category = event_selection.attributes.category;
    fr_info.category = event_selection.attributes.category;
    en_info.eventCode.value = event_selection.attributes.value;
    fr_info.eventCode.value = event_selection.attributes.value;

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

    delete en_info.parameter;
    en_info.area = [];
    for (var i = 0; i < eventStations.length; i++) {
        var eventStation = eventStations[i];
        //en_info.parameter.push({ valueName: 'layer:CAPAN:eventLocation:point', value: eventStation.lat + "," + eventStation.lng });
        en_info.area.push({
            areaDesc: MASAS.xml_encode(eventStation.id),
            circle: eventStation.lat + "," + eventStation.lng + " " + eventRadius,
            geocode: {
                valueName: 'profile:CAP-CP:Location:0.3',
                value: 'none'
            }
        });
    }

    //    if (Ext.getCmp('discard-event-location').checked) {
    //        // location will be based on area polygons instead
    //        delete en_info.parameter;
    //        delete fr_info.parameter;
    //    } else {
    //        en_info.parameter.value = Ext.get('cap-location').getValue();
    //        fr_info.parameter.value = Ext.get('cap-location').getValue();
    //    }
    //    if (Ext.getCmp('areaSelectSet').collapsed) {
    //        // custom area with any found geocodes that match
    //        var circle_val = Ext.get('cap-location').getValue() + ' ' +
    //            Ext.get('cap-radius').getValue();
    //        var geocode_list = Ext.getCmp('areaCreateSet').sgcGeocode;
    //        var new_geocodes = [];
    //        for (var i = 0; i < geocode_list.length; i++) {
    //            new_geocodes.push({ valueName: 'profile:CAP-CP:Location:0.3',
    //                value: geocode_list[i]
    //            });
    //        }
    //        en_info.area = { areaDesc: MASAS.xml_encode(Ext.get('cap-en-area-description').getValue()),
    //            circle: circle_val, geocode: new_geocodes
    //        };
    //        fr_info.area = { areaDesc: MASAS.xml_encode(Ext.get('cap-fr-area-description').getValue()),
    //            circle: circle_val, geocode: new_geocodes
    //        };
    //    } else {
    //        var en_area_blocks = [];
    //        var fr_area_blocks = [];
    //        var zone_vals = MASAS.areaSearchGrid.getSelectionModel().getSelections();
    //        for (var i = 0; i < zone_vals.length; i++) {
    //            var each_zone = zone_vals[i];
    //            var zone_feature = each_zone.data.feature.clone();
    //            zone_feature.geometry.transform(MASAS.locationMap.getProjectionObject(),
    //                new OpenLayers.Projection('EPSG:4326'));
    //            var zone_points = [];
    //            for (var j = 0; j < zone_feature.geometry.components[0].components.length; j++) {
    //                zone_points.push(zone_feature.geometry.components[0].components[j].y.toPrecision(8) +
    //                    ',' + zone_feature.geometry.components[0].components[j].x.toPrecision(8));
    //            }
    //            en_area_blocks.push({ areaDesc: each_zone.data.e_name,
    //                polygon: zone_points.join(' '),
    //                geocode: { valueName: 'profile:CAP-CP:Location:0.3',
    //                    value: each_zone.data.sgc
    //                }
    //            });
    //            fr_area_blocks.push({ areaDesc: each_zone.data.f_name,
    //                polygon: zone_points.join(' '),
    //                geocode: { valueName: 'profile:CAP-CP:Location:0.3',
    //                    value: each_zone.data.sgc
    //                }
    //            });
    //        }
    //        // check for single areas which don't get set as an array of objects
    //        if (en_area_blocks.length === 1) {
    //            en_info.area = en_area_blocks[0];
    //        } else {
    //            en_info.area = en_area_blocks;
    //        }
    //        if (fr_area_blocks.length === 1) {
    //            fr_info.area = fr_area_blocks[0];
    //        } else {
    //            fr_info.area = fr_area_blocks;
    //        }
    //    }

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
    console.log('Posting New CAP Alert');
    var do_post = new OpenLayers.Request.POST({
        url: MASAS.FEED_URL,
        params: {'secret': MASAS.USER_SECRET},
        proxy: MASAS.AJAX_PROXY_URL,
        headers: {'Content-Type': 'application/common-alerting-protocol+xml'},
        data: new_cap_xml_vals[0],
        callback: MASAS.post_complete_result
    });
};

