/**
Create New Entry
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
MASAS.locationModifyControl = null;
MASAS.currentLoadingControl = null;
MASAS.attachmentWindow = null;
MASAS.attachmentStore = null;
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

// Custom field validations
Ext.form.VTypes.location = function (v) {
    var location_formfield = Ext.getCmp('entry-location');
    var v_result = [false, true];
    if (location_formfield.geom === 'point') {
        v_result = MASAS.validators.check_point(v);
    } else if (location_formfield.geom === 'line') {
        v_result = MASAS.validators.check_line(v);
    } else if (location_formfield.geom === 'polygon') {
        v_result = MASAS.validators.check_polygon(v);
    } else if (location_formfield.geom === 'circle') {
        v_result = MASAS.validators.check_circle(v);
    } else if (location_formfield.geom === 'box') {
        v_result = MASAS.validators.check_box(v); 
    }
    if (v_result[1] === false) {
        alert('Please note that this Location is outside North America.');
    }
    
    return v_result[0];
};
Ext.form.VTypes.locationText = 'Must be a valid location';

Ext.onReady(function () {
    
    // after setting up the generic locationMap, add new locationMap layers
    MASAS.initialize_location_map();
    
    // extend the default vector style to add styling change specific to lines
    // to make it easier for users to click on lines for editing later
    var location_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style);
    location_style['default']['strokeOpacity'] = 0.8;
    location_style['select']['strokeOpacity'] = 0.8;
    var location_style_context = function (feature) {
        if (!feature.geometry) {
            // expects a value on initial load before geometry exists
            return {geom: 'other'};
        }
        if (feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.LineString') {
            return {geom: 'line'};
        } else {
            return {geom: 'other'};
        }
    };
    var location_style_map = new OpenLayers.StyleMap(location_style);
    var location_style_lookup = {'other': {strokeWidth: 2}, 'line': {strokeWidth: 6} };
    location_style_map.addUniqueValueRules('default', 'geom',
        location_style_lookup, location_style_context);
    location_style_map.addUniqueValueRules('select', 'geom',
        location_style_lookup, location_style_context);
    var locationLayer = new OpenLayers.Layer.Vector('Location', {
        isBaseLayer: false,
        visibility: true,
        styleMap: location_style_map
    });
    // special handlers for modifying circles
    locationLayer.events.register('beforefeaturemodified', null, function (obj) {
        if (obj.feature.circle_center) {
            // since the center point is "behind" the radius polygon and difficult
            // to select, needed a way to set the center point as the feature to be
            // modified so using this timeout hack until a better method can be found.
            setTimeout(function () {
                MASAS.locationModifyControl.selectControl.unselect(obj.feature);
                MASAS.locationModifyControl.selectControl.select(obj.feature.circle_center);
                obj.feature.layer.removeFeatures([obj.feature]);
            }, 500);
            // needed to cancel the modify attempt for the radius polygon            
            return false;
        }
    });
    locationLayer.events.register('featuremodified', null, function (obj) {
        if (obj.feature.child_polygon) {
            MASAS.create_circle_feature(obj.feature);
        }
    });
    MASAS.locationMap.addLayer(locationLayer);
    
    // additonal locationMap controls
    var navControl = new OpenLayers.Control.Navigation({title: 'Pan/Zoom'});
    MASAS.locationModifyControl = new OpenLayers.Control.ModifyFeature(locationLayer,
        {displayClass: 'modifyButton', title: 'Modify Drawing', hover: false,
        featureControl: true});
    var editPanel = new OpenLayers.Control.Panel({displayClass: 'editPanel'});
    editPanel.addControls([
        navControl,
        // using [location_layer] to allow selection when currentLayer is active
        new OpenLayers.Control.SelectFeature([locationLayer],
            {displayClass: 'saveButton', title: 'Save Drawing', hover: false,
            featureControl: true, onSelect: MASAS.save_location_feature}),
        MASAS.locationModifyControl,
        new OpenLayers.Control.SelectFeature([locationLayer],
            {displayClass: 'deleteButton', title: 'Delete Drawing', hover: false,
             featureControl: true, onSelect: function (feature) {
                 if (feature) {
                     if (confirm('Delete this Drawing?')) {
                         locationLayer.removeFeatures([feature]);
                     }
                 }
             }
        })
    ]);
    editPanel.defaultControl = navControl;
    MASAS.locationMap.addControl(editPanel);
    
    var drawPanel = new OpenLayers.Control.Panel({displayClass: 'drawPanel'});
    drawPanel.addControls([
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.Point,
            {displayClass: 'pointButton', title: 'Draw Point', featureControl: true,
            featureAdded: MASAS.save_location_feature}),
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.Path,
            {displayClass: 'lineButton', title: 'Draw Line', featureControl: true,
            featureAdded: MASAS.save_location_feature}),
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.Polygon,
            {displayClass: 'polygonButton', title: 'Draw Polygon', featureControl: true,
            featureAdded: MASAS.save_location_feature}),
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.Point,
            {displayClass: 'circleButton', title: 'Draw Circle', featureControl: true,
             featureAdded: MASAS.create_circle_feature}),
        new OpenLayers.Control.DrawFeature(locationLayer, OpenLayers.Handler.RegularPolygon,
            {displayClass: 'boxButton', title: 'Draw Box', featureControl: true,
             featureAdded: function (feature) {
                 feature.is_box = true;
                 MASAS.save_location_feature(feature);
             }, handlerOptions: {sides: 4, irregular: true}
            })
    ]);
    MASAS.locationMap.addControl(drawPanel);


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
        var card_panel = Ext.getCmp('entry-wizard-panel').getLayout();
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
	    
        // validation for icon tree selection and expires on input card
        if (current_card === '0') {
            var tree_selection = Ext.getCmp('icon-select-tree').getSelectionModel().getSelectedNode();
            if (!tree_selection) {
                alert('An icon must be selected.');
                return;
            } else {
                if (!tree_selection.attributes.term) {
                    alert('An icon must be selected.');
                    return;
                }
            }
            var expires_dt = Ext.get('entry-expires-dt').getValue();
            var expires_tm = Ext.get('entry-expires-tm').getValue();
            //TODO: further validation of the values, such as must be in the future?
            if (expires_dt && !expires_tm) {
                alert('Expires time must be set.');
                return;
            } else if (!expires_dt && expires_tm) {
                alert('Expires date must be set.');
                return;
            }
        }
        
        var next_card = parseInt(current_card, 10) + direction;
        card_panel.setActiveItem(next_card);
        Ext.getCmp('card-prev').setDisabled(next_card==0);
        // set to max number of cards
        Ext.getCmp('card-next').setDisabled(next_card==3);
        if (direction === 1) {
            MASAS.PROGRESS_AMOUNT += MASAS.PROGRESS_INCREMENT;
        } else if (direction === -1) {
            MASAS.PROGRESS_AMOUNT -= MASAS.PROGRESS_INCREMENT;
        }
        progressBar.updateProgress(MASAS.PROGRESS_AMOUNT);
        
        // cleanup stray GeoExt popup windows which stick around between
        // panel changes
        if (current_card === '1') {
            var map_layers = MASAS.locationMap.getLayersByName('Location');
            if (map_layers) {
                var loc_layer = map_layers[0];
                if (loc_layer.features) {
                    for (var i = 0; i < loc_layer.features.length; i++) {
                        var layer_feature = loc_layer.features[i];
                        if (layer_feature.popup) {
                            layer_feature.popup.destroy();
                        }
                    }
                }
            }
        }
    };


    var statusCombo = new Ext.form.ComboBox({
        fieldLabel: '<b>Status</b>',
        name: 'entry-status',
        id: 'entry-status',
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
                [ ['Actual', 'Actual Entries'],
                ['Exercise', 'Exercises and other practice entries'],
                ['Test', 'Test Entries'] ]
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
    
    var categoryCombo = new Ext.form.ComboBox({
        fieldLabel: '<b>Category</b>',
        name: 'entry-category',
        id: 'entry-category',
        allowBlank: false,
        width: 200,
        forceSelection: true,
        triggerAction: 'all',
        mode: 'local',
        displayField: 'e_name',
        valueField: 'value',
        tpl: '<tpl for="."><div ext:qtip="{e_tip}" class="x-combo-list-item">{e_name}</div></tpl>',
        store: new Ext.data.Store({
            proxy: new Ext.data.HttpProxy({url: MASAS.CATEGORY_LIST_URL, disableCaching: false}),
            reader: new Ext.data.JsonReader({
                root: 'categories',
                fields: ['e_name', 'e_tip', 'f_name', 'f_tip', 'value']
            }),
            autoLoad: true,
            listeners: {
                exception: function () {
                    console.error('Category Data failed to load');
                    alert('Unable to load Category Data.');
                }
            }
        })
    });

    var iconTree = new Ext.tree.TreePanel({
        id: 'icon-select-tree',
        autoScroll: true,
        animate: true,
        border: true,
        height: 175,
        width: 500,
        dataUrl: MASAS.ICON_LIST_URL,
        requestMethod: 'GET',
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
            }
        },
        tbar: ['Search:', {
                xtype: 'trigger',
                width: 100,
                triggerClass: 'x-form-clear-trigger',
                onTriggerClick: function () {
                    this.setValue('');
                    iconTree.filter.clear();
                },
                id: 'filter',
                enableKeyEvents: true,
                listeners: {
                    keyup: {buffer: 150, fn: function (field, e) {
                        if (Ext.EventObject.ESC === e.getKey()) {
                            field.onTriggerClick();
                        } else {
                            var val = this.getRawValue();
                            var re = new RegExp('.*' + val + '.*', 'i');
                            iconTree.filter.clear();
                            iconTree.filter.filter(re, 'text');
                        }
                    }}
                }
        }, '->', new Ext.Button({
                cls: 'x-btn-text-icon',
                iconCls: 'iconTreeExpand',
                text: 'Expand',
                tooltip: 'Expand the entire icon tree',
                handler: function () {
                    iconTree.expandAll();
                }
        }), '-', new Ext.Button({
                cls: 'x-btn-text-icon',
                iconCls: 'iconTreeCollapse',
                text: 'Collapse',
                tooltip: 'Collapse the entire icon tree',
                handler: function () {
                    iconTree.collapseAll();
                }
        })
        ]
    });
    iconTree.filter = new Ext.ux.tree.TreeFilterX(iconTree);
    
    var intervalCombo = new Ext.form.ComboBox({
        name: 'entry-expires-interval',
        id: 'entry-expires-interval',
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
                    var dt_check = Ext.get('entry-expires-dt').getValue();
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
    
    MASAS.attachmentStore = new Ext.data.ArrayStore({
        fields: ['title', 'filename', 'num'],
        data: []
    });
    
    function renderRemoveButton(val) {
        return '<a style="color: red; font-weight: bold;" onclick="MASAS.remove_attachment(\'' + val +
            '\')">Remove</a>';
    }

    var attachmentGrid = new Ext.grid.GridPanel({
        fieldLabel: 'Attachment',
        height: 90,
        width: 600,
        autoScroll: true,
        stripeRows: true,
        columnLines: true,
        header: false,
        hideHeaders: true,
        store: MASAS.attachmentStore,
        columns: [{
            dataIndex: 'title'
        }, {
            dataIndex: 'filename',
            width: 200
        }, {
            dataIndex: 'num',
            width: 70,
            renderer: renderRemoveButton
        }],
        autoExpandColumn: '0',
        buttonAlign: 'center',
        buttons: [new Ext.Button({
            id: 'attachment-add',
            width: 75,
            text: 'Add',
            tooltip: 'Attachments get uploaded and attached to this Entry',
            handler: MASAS.add_attachment
        }) ]
    });

    var inputEntryCard = new Ext.FormPanel({
        id: 'card-0',
        labelWidth: 80,
        bodyStyle: 'padding: 10px;',
        defaultType: 'textfield',
        items: [ statusCombo, categoryCombo,
        {
            xtype: 'compositefield',
            fieldLabel: '<b>Icon</b>',
            //width: 300,
            //defaults: { flex: 1 },
            items: [ iconTree,
            {
                xtype: 'displayfield',
                id: 'icon-preview-box',
                html: '<div style="padding: 15px;"></div>'
            }]
        }, {
            fieldLabel: '<b>Title</b>',
            name: 'entry-en-title',
            id: 'entry-en-title',
            width: '75%',
            minLength: 5,
            minLengthText: 'A good title should say what and where',
            maxLength: 250,
            maxLengthText: 'Titles cannot be longer than 250 characters',
            blankText: 'MASAS requires a title value',
            allowBlank: false
        }, {
            xtype: 'textarea',
            fieldLabel: '<b>Content</b>',
            name: 'entry-en-content',
            id: 'entry-en-content',
            height: 80,
            width: '75%',
            minLength: 5,
            minLengthText: 'Content should describe the entry',
            blankText: 'MASAS requires a content value',
            allowBlank: false
        }, {
            xtype: 'radiogroup',
            fieldLabel: 'Severity',
            id: 'entry-severity',
            allowBlank: true,
            width: 500,
            items: [{boxLabel: 'Unknown', name: 'entry-severity', inputValue: 'Unknown'},
                {boxLabel: 'Minor', name: 'entry-severity', inputValue: 'Minor'},
                {boxLabel: 'Moderate', name: 'entry-severity', inputValue: 'Moderate'},
                {boxLabel: 'Severe', name: 'entry-severity', inputValue: 'Severe'},
                {boxLabel: 'Extreme', name: 'entry-severity', inputValue: 'Extreme'}]
        }, {
            xtype: 'radiogroup',
            fieldLabel: 'Certainty',
            id: 'entry-certainty',
            allowBlank: true,
            width: 500,
            items: [{boxLabel: 'Unknown', name: 'entry-certainty', inputValue: 'Unknown'},
                {boxLabel: 'Unlikely', name: 'entry-certainty', inputValue: 'Unlikely'},
                {boxLabel: 'Possible', name: 'entry-certainty', inputValue: 'Possible'},
                {boxLabel: 'Likely', name: 'entry-certainty', inputValue: 'Likely'},
                {boxLabel: 'Observed', name: 'entry-certainty', inputValue: 'Observed'}]
        }, {
            fieldLabel: 'Related URL',
            name: 'entry-en-related',
            id: 'entry-en-related',
            width: '50%',
            allowBlank: true,
            vtype: 'url'
        }, {
            xtype: 'compositefield',
            fieldLabel: 'Expires at',
            //width: 300,
            //defaults: { flex: 1 },
            items: [{
                name: 'entry-expires-dt',
                id: 'entry-expires-dt',
                width: 95,
                xtype: 'datefield',
                format: 'Y-m-d',
                listeners: {select: function () {
                    var it_check = Ext.getCmp('entry-expires-interval').getValue();
                    if (it_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                } }
            }, {
                name: 'entry-expires-tm',
                id: 'entry-expires-tm',
                width: 60,
                xtype: 'timefield',
                format: 'H:i',
                listeners: {select: function () {
                    var it_check = Ext.getCmp('entry-expires-interval').getValue();
                    if (it_check) {
                        alert('Choose either a specified time OR an interval, not both.');
                    }
                } }
            }, {
                xtype: 'displayfield',
                html: 'or Expires in:',
                style: {'padding': '3px 2px 2px 20px'}
            }, intervalCombo ]
        }, attachmentGrid ]
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
        collapsible: false,
        style: 'margin-bottom: 5px;',
        //TODO: resizable?
        height: 375,
        map: MASAS.locationMap,
        bbar: map_toolbar_items
    });

    var locationEntryCard = new Ext.FormPanel({
        id: 'card-1',
        labelWidth: 60,
        items: [{
            xtype: 'fieldset',
            title: 'Location',
            items: [locationMapPanel, {
                xtype: 'textfield',
                fieldLabel: '<b>Location</b>',
                name: 'entry-location',
                id: 'entry-location',
                width: 400,
                vtype: 'location',
                validationEvent: false,
                blankText: 'A location is required',
                allowBlank: false
            }]
        }]
    });
    
    
    var vkeyboard_plugin = new Ext.ux.plugins.VirtualKeyboard();
    
    var optionalEntryCard = new Ext.FormPanel({
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
            id: 'entry-add-french',
            defaultType: 'textfield',
            items: [{
                fieldLabel: '<b>Title</b>',
                name: 'entry-fr-title',
                id: 'entry-fr-title',
                anchor: '75%',
                minLengthText: 'A good title should say what and where',
                maxLength: 250,
                maxLengthText: 'Titles cannot be longer than 250 characters',
                blankText: 'MASAS requires a title value',
                keyboardConfig: { language: 'French', showIcon: true },
                plugins: vkeyboard_plugin
            }, {
                xtype: 'textarea',
                fieldLabel: '<b>Content</b>',
                name: 'entry-fr-content',
                id: 'entry-fr-content',
                height: 80,
                anchor: '75%',
                minLengthText: 'Content should describe the entry',
                blankText: 'MASAS requires a content value',
                keyboardConfig: { language: 'French', showIcon: true },
                plugins: vkeyboard_plugin
            }],
            listeners: {
                expand: function () {
                    // enable validation of french values
                    optionalEntryCard.findById('entry-fr-title').allowBlank = false;
                    optionalEntryCard.findById('entry-fr-title').minLength = 5;
                    optionalEntryCard.findById('entry-fr-content').allowBlank = false;
                    optionalEntryCard.findById('entry-fr-content').minLength = 5;
                },
                collapse: function () {
                    // disable validation of french values when not using
                    optionalEntryCard.findById('entry-fr-title').allowBlank = true;
                    optionalEntryCard.findById('entry-fr-title').minLength = null;
                    optionalEntryCard.findById('entry-fr-content').allowBlank = true;
                    optionalEntryCard.findById('entry-fr-content').minLength = null;
                }
            }
        }, {
            xtype: 'displayfield',
            hideLabel: true,
            html: '<div style="margin: 50px 0px 15px 0px;"><b>Permissions</b> (Optional)</div>'
        }, {
            xtype: 'fieldset',
            checkboxToggle: true,
            collapsed: true,
            title: 'Updates to this Entry',
            items: [{
                xtype: 'radiogroup',
                id: 'entry-update-control',
                allowBlank: false,
                //value: 'user',
                items: [{
                    boxLabel: 'Only My Account May Update',
                    name: 'entry-update-control',
                    inputValue: 'user',
                    checked: true
                }, {
                    boxLabel: 'Allow All Accounts To Update',
                    name: 'entry-update-control',
                    inputValue: 'all'
                }]
            }]
        }]
    });


    var postEntryCard = new Ext.Panel({
        id: 'card-3',
        items: [{
            border: false,
            bodyStyle: 'margin-bottom: 50px',
            html: '<div class="postingCard" id="postingBox"><h1>Ready to Post</h1>' + 
                '<a href="#" onclick="MASAS.preview_entry_xml(); return false;" style="color: grey;">Preview</a>' +
                '<a href="#" onclick="MASAS.post_new_entry(); return false;" style="color: green;">Post Entry</a>' +
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
    
        postEntryCard.add({
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
                xtype: 'displayfield',
                id: 'email-attachment-notice',
                hidden: true,
                html: '<div><span style="color: red; font-weight: bold;">Note:' +
                    '</span> Attachments are not included with this message. ' +
                    'Add the attachments to the forwarded email you receive.</div>'
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


    var entryPanel = new Ext.Panel({
        id: 'entry-wizard-panel',
        title: 'New Entry',
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
            { id: 'card-prev',
                text: '<span style="font-weight: bold; font-size: 130%;">Back</span>',
                iconCls: 'previousButton',
                handler: cardNav.createDelegate(this, [-1]),
                disabled: true
            }, { xtype: 'tbspacer', width: 150 },
            { id: 'card-next',
                text: '<span style="font-weight: bold; font-size: 130%;">Next</span>',
                iconCls: 'nextButton',
                iconAlign: 'right',
                handler: cardNav.createDelegate(this, [1])
            }
        ], buttonAlign: 'center' }),
        // the panels (or "cards") within the layout
        items: [ inputEntryCard, locationEntryCard, optionalEntryCard, postEntryCard ]
    });
    
    // main layout view, uses entire browser viewport
    var mainView = new Ext.Viewport({
        layout: 'border',
        items: [headerBox, entryPanel]
    });

    //TODO: focusing on category opens the drop-down, perhaps distracting
    //Ext.get('entry-category').focus();
    
    // Clear out any old attachments stored by the demonstration server to start
    // and setup allowable types and sizes
    OpenLayers.Request.GET({
        url: MASAS.SETUP_ATTACH_URL,
        params: {'feed': MASAS.FEED_URL, 'secret': MASAS.USER_SECRET},
        failure: function () {
            alert('Unable to setup attachment handling.');
            console.error('Unable to purge and setup attachments');
            Ext.getCmp('attachment-add').disable();
        }
    });

});


MASAS.add_attachment = function () {
    // only one attachment window allowed
    if (MASAS.attachmentWindow) {
        MASAS.attachmentWindow.destroy();
    }
    var filePanel = new Ext.FormPanel({
        fileUpload: true,
        frame: true,
        labelWidth: 40,
        defaults: { allowBlank: false, msgTarget: 'side' },
        items: [{
                xtype: 'textfield',
                fieldLabel: '<b>Title</b>',
                name: 'attachment-title',
                id: 'attachment-title',
                width: 200
            }, {
                xtype: 'fileuploadfield',
                fieldLabel: '<b>File</b>',
                name: 'attachment-file',
                id: 'attachment-file',
                emptyText: 'Select a file to upload',
                width: 350
        }],
        buttons: [{
                text: 'Upload',
                handler: function () {
                    if (filePanel.getForm().isValid()) {
                        filePanel.getForm().submit({
                                url: MASAS.ADD_ATTACH_URL,
                                submitEmptyText: false,
                                waitMsg: 'Uploading the file...',
                                success: MASAS.add_attachment_success,
                                failure: function (form, response) {
                                    console.error('Upload Attachment Error: ' +
                                        response.result.message);
                                    Ext.Msg.alert('Upload Error',
                                        'Unable to upload the file.  ' + response.result.message);
                                    MASAS.attachmentWindow.destroy();
                                }
                        });
                    }
                }
        }]
    });
    MASAS.attachmentWindow = new Ext.Window({
        title: 'Add Attachment',
        closable: true,
        width: 500,
        height: 140,
        layout: 'fit',
        items: [filePanel]
    });
    MASAS.attachmentWindow.show(this);
};

MASAS.add_attachment_success = function (form, response) {
    try {
        var new_rec = new MASAS.attachmentStore.recordType({
            title: response.form.getFieldValues()['attachment-title'],
            filename: response.form.getFieldValues()['attachment-file'],
            num: response.result.num
        });
        MASAS.attachmentStore.add(new_rec);
        MASAS.attachmentStore.commitChanges();
        MASAS.USE_ATTACH_PROXY = true;
        console.debug('Added attachment ' + new_rec.data.num);
        MASAS.attachmentWindow.destroy();
    } catch (err) {
        console.error('Add Attachment Error: ' + err);
        alert('Unable to add this attachment.');
        MASAS.attachmentWindow.destroy();
    }
};

MASAS.remove_attachment = function (num) {
    var r_confirm = confirm('Are you sure you want to remove this attachment?');
    if (r_confirm === true) {
        Ext.Ajax.request({
            url: OpenLayers.Util.urlAppend(MASAS.REMOVE_ATTACH_URL,
                'num=' + num),
            method: 'DELETE',
            success: MASAS.remove_attachment_success(num),
            failure: function (response) {
                console.error('Delete Attachment Error: ' + response.responseText);
                alert('Unable to remove attachment.');
            }
        });
    }
};

MASAS.remove_attachment_success = function (num) {
    var idx = MASAS.attachmentStore.find('num', num);
    if (idx === -1) {
        console.error('Remove Attachment ' + num + ' Error');
        alert('Unable to remove attachment.');
    } else {
        MASAS.attachmentStore.removeAt(idx);
        MASAS.attachmentStore.commitChanges();
        console.debug('Removed Attachment ' + num);
    }
};

MASAS.create_circle_feature = function (feature) {
    var radius_field = new Ext.form.TextField({
        width: 50,
        blankText: 'A radius is required',
        allowBlank: false
    });
    if (feature.child_polygon) {
        // set to previous value if modifying an existing circle
        if (feature.child_polygon.circle_radius) {
            radius_field.setValue(feature.child_polygon.circle_radius);
        }
    }
    var draw_button = new Ext.Button({
        text: 'Draw',
        width: 50,
        handler: function () {
            if (feature && radius_field) {
                if (feature.child_polygon) {
                    feature.layer.removeFeatures([feature.child_polygon]);
                    feature.child_polygon = null;
                }
                var center = feature.geometry.getCentroid();
                var radius = radius_field.getValue();
                if (center && radius) {
                    var circle_polygon = OpenLayers.Geometry.Polygon.createRegularPolygon(
                        center, radius * 1000, 40);
                    var circle_feature = new OpenLayers.Feature.Vector(circle_polygon);
                    circle_feature.circle_center = feature;
                    circle_feature.circle_radius = radius;
                    feature.layer.addFeatures([circle_feature]);
                    feature.child_polygon = circle_feature;
                } else {
                    // nothing entered for radius so show field error
                    radius_field.markInvalid();
                }
            }
        }
    });
    var save_button = new Ext.Button({
        text: 'Save',
        width: 50,
        handler: function () {
            if (feature) {
                if (feature.child_polygon) {
                    feature.circle_popup.hide();
                    MASAS.save_location_feature(feature.child_polygon);
                }
            }
        }
    });
    feature.circle_popup = new GeoExt.Popup({
        title: 'Draw Circle',
        location: feature,
        width: 275,
        items: [{
            xtype: 'compositefield',
            items: [{
                xtype: 'displayfield',
                html: '<b>Radius (km) :</b>'
            }, radius_field, draw_button, save_button]
        }]
    });
    feature.circle_popup.show();
    radius_field.focus(true, 500);
};

MASAS.save_location_feature = function (feature) {
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
    // update the location form values with this geometry
    var location_input = document.getElementById('entry-location');
    var location_formfield = Ext.getCmp('entry-location');
    var measure_value = null;
    // the notification message for the popup beside the location field
    var notification_str = 'Location Saved';
    if (location_formfield.geom) {
        var notification_str = 'Updated Location';
    }
    if (feature.geometry) {
        var point_result = [];
        var feature_points = feature.geometry.getVertices();
        for (var i = 0; i < feature_points.length; i++) {
            var new_point = new OpenLayers.Geometry.Point(feature_points[i].x,
                feature_points[i].y);
            new_point.transform(MASAS.locationMap.getProjectionObject(),
                new OpenLayers.Projection('EPSG:4326'));
            point_result.push(new_point.y.toPrecision(8) + ',' + new_point.x.toPrecision(8));
        }
        if (feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.Point') {
            if (point_result.length === 1) {
                location_input.value = point_result[0];
                location_formfield.label.update('<b>Point:</b>');
                location_formfield.geom = 'point';
            }
        } else if (feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.LineString') {
            if (point_result.length > 1) {
                location_input.value = point_result.join(' ');
                location_formfield.label.update('<b>Line:</b>');
                location_formfield.geom = 'line';
                // getGeodesicLength/Area was not returning correct values
                // map units are currently in meters, using getLength okay for now
                var l_measure = feature.geometry.getLength() / 1000;
                measure_value = ['Length',  l_measure.toFixed(2) + ' km'];
            }
        } else if (feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.Polygon') {
            if (feature.circle_center && feature.circle_radius) {
                var center_point = feature.circle_center.geometry.getCentroid();
                center_point.transform(MASAS.locationMap.getProjectionObject(),
                    new OpenLayers.Projection('EPSG:4326'));
                location_input.value = center_point.y.toPrecision(8) + ',' + 
                    center_point.x.toPrecision(8) + ' ' + parseFloat(feature.circle_radius, 10) * 1000;
                location_formfield.label.update('<b>Circle:</b>');
                location_formfield.geom = 'circle';
            } else if (feature.is_box) {
                // need to create a whole new bounds otherwise the transform
                // modifies the geometry's actual bounds and won't display
                var orig_bounds = feature.geometry.getBounds().toArray();
                var box_bounds = new OpenLayers.Bounds.fromArray(orig_bounds);
                box_bounds.transform(MASAS.locationMap.getProjectionObject(),
                    new OpenLayers.Projection('EPSG:4326'));
                var box_points = box_bounds.toArray(true);
                location_input.value = box_points[0].toPrecision(8) + ',' +
                    box_points[1].toPrecision(8) + ' ' + box_points[2].toPrecision(8) +
                    ',' + box_points[3].toPrecision(8);
                location_formfield.label.update('<b>Box:</b>');
                location_formfield.geom = 'box';
            } else {
                if (point_result.length > 2) {
                    // close the polygon, as getVertices does not
                    point_result.push(point_result[0]);
                    location_input.value = point_result.join(' ');
                    location_formfield.label.update('<b>Polygon:</b>');
                    location_formfield.geom = 'polygon';
                }
            }
            // The approximate area of the polygon in square meters
            var p_measure = feature.geometry.getArea() / 1000000;
            measure_value = ['Area', p_measure.toFixed(2) + ' km2'];
        } else {
            console.error('Unknown geometry type');
            alert('Geometry type not supported.');
            return;
        }
        // display a temporary notification message to better inform the user when
        // the field value that will be used for location is saved/updated
        var msg = Ext.Msg.show({
            msg: notification_str,
            cls: 'locationNotificationMsg',
            closable: false,
            modal: false,
            minWidth: 170
        });
        msg.getDialog().alignTo('entry-location', 'tr?', [25, -25]);
        setTimeout(function () {
            Ext.Msg.hide();
        }, 2500);
    }
    // deselect whatever control was used to draw/save this feature to set
    // the map back up as originally viewed by user
    var feature_controls = MASAS.locationMap.getControlsBy('featureControl', true);
    for (var c = 0; c < feature_controls.length; c++) {
        feature_controls[c].deactivate();
    }
    MASAS.locationMap.getControlsBy('title', 'Pan/Zoom')[0].activate();
    // display a measurement popup at the first point of this geometry
    if (measure_value) {
        if (feature.popup) {
            // remove any existing so no duplicates
            feature.popup.destroy();
        }
        feature.popup = new GeoExt.Popup({
            title: measure_value[0],
            location: feature,
            width: 100,
            html: measure_value[1]
        });
        feature.popup.show();
    }
    console.debug(location_formfield.geom + ': ' + location_input.value);
};

MASAS.generate_entry_xml = function () {
    if (!MASAS.ATOM_ENTRY) {
        console.error('Atom Entry Missing');
        alert('Unable to load Atom Entry.');
    }
    // cloning ATOM_ENTRY each time required for cases where a user
    // goes back and add/removes values after doing a preview which
    // results in a modified ATOM_ENTRY being used to build the post XML
    var new_entry = MASAS.clone_object(MASAS.ATOM_ENTRY);
    
    // building a new array in order to maintain ordering if we have to drop
    // either severity or certainty, just deleting in place doesn't work.
    var new_categories = [];
    new_entry.entry.category[0]['@term'] = Ext.getCmp('entry-status').getValue();
    new_categories.push(new_entry.entry.category[0]);
    var severity_val = Ext.getCmp('entry-severity').getValue();
    if (severity_val) {
        new_entry.entry.category[1]['@term'] = severity_val.getGroupValue();
        new_categories.push(new_entry.entry.category[1]);
    }
    var certainty_val = Ext.getCmp('entry-certainty').getValue();
    if (certainty_val) {
        new_entry.entry.category[2]['@term'] = certainty_val.getGroupValue();
        new_categories.push(new_entry.entry.category[2]);
    }
    new_entry.entry.category[3]['@term'] = Ext.getCmp('entry-category').getValue();
    new_categories.push(new_entry.entry.category[3]);
    var tree_selection = Ext.getCmp('icon-select-tree').getSelectionModel().getSelectedNode();
    new_entry.entry.category[4]['@term'] = tree_selection.attributes.term;
    new_categories.push(new_entry.entry.category[4]);
    // replace with the new array
    new_entry.entry.category = new_categories;
    
    var en_title = new_entry.entry.title.div.div[0];
    en_title['#text'] = MASAS.xml_encode(Ext.get('entry-en-title').getValue());
    var en_content = new_entry.entry.content.div.div[0];
    en_content['#text'] = MASAS.xml_encode(Ext.get('entry-en-content').getValue());
    if (Ext.getCmp('entry-add-french').collapsed) {
        // remove the french divs by converting from an array of two
        // objects to just one
        new_entry.entry.title.div.div = en_title;
        new_entry.entry.content.div.div = en_content;
    } else {
        var fr_title = new_entry.entry.title.div.div[1];
        fr_title['#text'] = MASAS.xml_encode(Ext.get('entry-fr-title').getValue());
        var fr_content = new_entry.entry.content.div.div[1];
        fr_content['#text'] = MASAS.xml_encode(Ext.get('entry-fr-content').getValue());
    }
    
    var en_rel_link = Ext.get('entry-en-related').getValue();
    if (en_rel_link) {
        new_entry.entry.link['@href'] = MASAS.xml_encode(en_rel_link);
    } else {
        delete new_entry.entry.link;
    }
    
    // GeoRSS format is "lat lon lat lon"
    var location_formfield = Ext.getCmp('entry-location');
    var location_obj = {'@xmlns': 'http://www.georss.org/georss',
        '#text': location_formfield.getValue().replace(/,/g, ' ')};
    if (location_formfield.geom === 'point') {
        new_entry.entry.point = location_obj;
    } else if (location_formfield.geom === 'line') {
        new_entry.entry.line = location_obj;
    } else if (location_formfield.geom === 'polygon') {
        new_entry.entry.polygon = location_obj;
    } else if (location_formfield.geom === 'circle') {
        new_entry.entry.circle = location_obj;
    } else if (location_formfield.geom === 'box') {
        new_entry.entry.box = location_obj;
    } else {
        // defaulted to middle of country instead
        new_entry.entry.point = {'@xmlns': 'http://www.georss.org/georss', '#text': '51.3 -93.4'};
    }
    
    var expires_dt = Ext.get('entry-expires-dt').getValue();
    var expires_tm = Ext.get('entry-expires-tm').getValue();
    var expires_it = Ext.getCmp('entry-expires-interval').getValue();
    if (expires_dt && expires_tm) {
        // using Ext parsing and formatting extensions added to normal Date    
        var local_expires = expires_dt + 'T' + expires_tm + ':00';
        var local_time = new Date();
        local_time = Date.parseDate(local_expires, 'c');
        var local_epoch = local_time.getTime();
        // convert to UTC for Atom accounting for format times being in -/+ seconds
        var local_offset = parseInt(local_time.format('Z'), 10);
        if (local_offset < 0) {
            local_epoch = (Math.abs(local_offset) * 1000) + local_epoch;
        } else if (local_offset > 0) {
            local_epoch = (Math.abs(local_offset) * 1000) - local_epoch;
        }
        var atom_date = new Date();
        atom_date.setTime(local_epoch);
        new_entry.entry.expires['#text'] = atom_date.format('Y-m-d\\TH:i:00\\Z');
    } else if (expires_it) {
        var expires_time = new Date();
        var expires_epoch = expires_time.getTime();
        // offset for the interval
        expires_epoch += parseInt(expires_it, 10) * 3600000;
        // offset to UTC
        var local_offset = parseInt(expires_time.format('Z'), 10);
        if (local_offset < 0) {
            expires_epoch = (Math.abs(local_offset) * 1000) + expires_epoch;
        } else if (local_offset > 0) {
            expires_epoch = (Math.abs(local_offset) * 1000) - expires_epoch;
        }
        expires_time.setTime(expires_epoch);
        new_entry.entry.expires['#text'] = expires_time.format('Y-m-d\\TH:i:00\\Z');
    } else {
        delete new_entry.entry.expires;
    }
    
    var update_control_val = Ext.getCmp('entry-update-control').getValue().getGroupValue();
    if (update_control_val === 'all') {
        new_entry.entry.control = {'@xmlns': 'http://www.w3.org/2007/app',
            'update': {'@xmlns': 'masas:extension:control', '#text': 'all'}};
    }
    
    var new_xml = xmlJsonClass.json2xml(new_entry, '');
    new_xml = MASAS.format_xml(new_xml);
    new_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new_xml;
    
    return [new_xml, new_entry];
};

MASAS.preview_entry_xml = function () {
    // only one review window allowed
    if (MASAS.reviewWindow) {
        MASAS.reviewWindow.destroy();
    }
    
    var preview_xml_vals = MASAS.generate_entry_xml();
    var display_xml = preview_xml_vals[0];
    preview_xml_vals[1].entry.id = 'New Entry';
    try {
        // XTemplate from post-templates.js
        var display_html = MASAS.EntryToHTMLTemplate.apply(preview_xml_vals[1]);
    } catch (err) {
        console.error('Preview Entry Template Error: ' + err);
        alert('Entry Template Error.');
        return;
    }
    // preview before posting needs to add attachments separately, after posting
    // the XTemplate will show instead    
    if (MASAS.attachmentStore.getCount() > 0) {
        display_html += '<div class="TemplateDisplayBox"><h2>Attachments</h2>';
        MASAS.attachmentStore.each(function (rec) {
            display_html += '<p><b>' + rec.data.title + '</b> - ' + rec.data.filename + '</p>';
        });
        display_html += '</div>';
    }
    // preview for update control also needs to be shown separately
    if (preview_xml_vals[1].entry.control) {
        if (preview_xml_vals[1].entry.control.update) {
            display_html += '<div class="TemplateDisplayBox"><h2>Entry Updates</h2>';
            display_html += '<p><b>Allow All</b></p></div>';
        }
    }
    display_xml = display_xml.replace(/</g, '&lt;');
    display_xml = display_xml.replace(/>/g, '&gt;');
    display_html += '<br><br>&nbsp;&nbsp;<a href="#" onclick="' +
        'document.getElementById(\'preview-xml-box\').style.display=\'block\'; return false;">' +
        '<b>Entry XML</b></a><div id="preview-xml-box" style="display: none;"><pre>' +
        display_xml + '</pre></div>';
    
    MASAS.reviewWindow = new Ext.Window({
        title: 'Entry Preview',
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

MASAS.post_new_entry = function () {
    var posting_html = '<h1>Posting Entry</h1><div class="postingWait"></div>';
    document.getElementById('postingBox').innerHTML = posting_html;
    MASAS.postingTimer = setTimeout(MASAS.post_timeout_error, 15000);
    // once a post is made, don't allow going back to retry with this session's data
    //TODO: the following is not working to prevent going back
    //Ext.getCmp('card-prev').setDisabled();
    var new_entry_xml_vals = MASAS.generate_entry_xml();
    console.debug('Posting New Entry');
    if (MASAS.USE_ATTACH_PROXY === true) {
        var do_post = new OpenLayers.Request.POST({
                url: MASAS.ATTACH_PROXY_URL +
                    encodeURIComponent(OpenLayers.Util.urlAppend(MASAS.FEED_URL,
                        'secret=' + MASAS.USER_SECRET)),
                // proxy is ignored for same origin hosts, but we need it to always
                // force the use of the attach proxy, so modify url instead
                data: new_entry_xml_vals[0],
                callback: MASAS.post_complete_result
        });
    } else {
        var do_post = new OpenLayers.Request.POST({
                url: MASAS.FEED_URL,
                params: {'secret': MASAS.USER_SECRET},
                proxy: MASAS.AJAX_PROXY_URL,
                headers: {'Content-Type': 'application/atom+xml'},
                data: new_entry_xml_vals[0],
                callback: MASAS.post_complete_result
        });
    }
};

