/* Original Work Copyright by OpenLayers Contributors and published under the
 * Clear BSD License.  See OpenLayers/license.txt for the full text of the license.
 *
 * Derivative Work Independent Joint Copyright (c) 2011-2012 MASAS Contributors.
 * Published under the Modified BSD license.  See license.txt for the full text of the license.
 */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/GML/v3.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Format.MASASFeed
 * Read/write MASAS Atom feeds. Create a new instance with the
 *     <OpenLayers.Format.MASASFeed> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.MASASFeed = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.  Properties
     *     of this object should not be set individually.  Read-only.  All
     *     XML subclasses should have their own namespaces object.  Use
     *     <setNamespace> to add or set a namespace alias after construction.
     */
    namespaces: {
        atom: "http://www.w3.org/2005/Atom",
        georss: "http://www.georss.org/georss",
        age: "http://purl.org/atompub/age/1.0"
    },
    
    /**
     * APIProperty: feedTitle
     * {String} Atom feed elements require a title.  Default is "untitled".
     */
    feedTitle: "untitled",

    /**
     * APIProperty: defaultEntryTitle
     * {String} Atom entry elements require a title.  In cases where one is
     *     not provided in the feature attributes, this will be used.  Default
     *     is "untitled".
     */
    defaultEntryTitle: "untitled",

    /**
     * Property: gmlParse
     * {Object} GML Format object for parsing features
     * Non-API and only created if necessary
     */
    gmlParser: null,
    
    /**
     * APIProperty: xy
     * {Boolean} Order of the GML coordinate: true:(x,y) or false:(y,x)
     * For GeoRSS the default is (y,x), therefore: false
     */
    xy: false,
    
    /**
     * APIProperty: circleNSides
     * {Integer} Number of sides for circle geometry regular polygon 
     */
    circleNSides: 40,
    
    /**
     * Constructor: OpenLayers.Format.AtomEntry
     * Create a new parser for Atom.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * APIMethod: read
     * Return a list of features from an Atom feed or entry document.
     
     * Parameters:
     * doc - {Element} or {String}
     *
     * Returns:
     * An Array of <OpenLayers.Feature.Vector>s
     */
    read: function(doc) {
        if (typeof doc == "string") {
            doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
        }
        
        try {
            // catching and ignoring errors because mv is not used by posting tool
            mv.map.baseLayer.events.register("moveend", this, this.checkGeometry);
        } catch (e) {} 
        return this.parseFeatures(doc);
    },

    /**
     * Method: getFirstChildValue
     *
     * Parameters:
     * node - {DOMElement}
     * nsuri - {String} Child node namespace uri ("*" for any).
     * name - {String} Child node name.
     * def - {String} Optional string default to return if no child found.
     *
     * Returns:
     * {String} The value of the first child with the given tag name.  Returns
     *     default value or empty string if none found.
     */
    getFirstChildValue: function(node, nsuri, name, def) {
        var value;
        var nodes = this.getElementsByTagNameNS(node, nsuri, name);
        if (nodes && nodes.length > 0) {
            value = this.getChildValue(nodes[0], def);
        } else {
            value = def;
        }
        return value;
    },

    /**
     * Method: parseFeature
     * Parse feature from an Atom entry node..
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * An <OpenLayers.Feature.Vector>.
     */
    parseFeature: function(node) {
        // some defaults
        var featureAttrib = {links: '', CAP: 'N', status: 'Actual',
            icon: OpenLayers.Format.MASASFeed.IconURL + 'other/small.png',
            category: null, severity: '', certainty: ''};
        var atomns = this.namespaces.atom;
        var agens = this.namespaces.age;
        var georssns = this.namespaces.georss;
        // variables used by this method
        var authors = null;
        var categories = null;
        var c_scheme = null;
        var links = null;
        var content_links = {};
        var l_rel = null;
        var l_type = null;
        var contents = null;
        var c_type = null;
        
        // atom Id
        featureAttrib.id = this.getFirstChildValue(node, atomns, "id", null);
        // atom Title
        featureAttrib.title = this.getFirstChildValue(node, atomns, "title", null);
        // atom Published
        featureAttrib.published = this.getFirstChildValue(node, atomns, "published", null);
        // atom Updated
        featureAttrib.updated = this.getFirstChildValue(node, atomns, "updated", null);
        // age Expires
        featureAttrib.expires = this.getFirstChildValue(node, agens, "expires", null);
        // georss:point Text version
        featureAttrib.point = this.getFirstChildValue(node, georssns, "point", null);
        
        // atom Author
        authors = this.getElementsByTagNameNS(node, atomns, "author");
        if (authors.length > 0) {
            //TODO: need for multiple authors?
            featureAttrib.author_name = this.getFirstChildValue(authors[0],
                atomns, "name", null);
            featureAttrib.author_uri = this.getFirstChildValue(authors[0],
                atomns, "uri", null);
        }
        
        // atom Category
        categories = this.getElementsByTagNameNS(node, atomns, "category");
        for (var i = 0; i < categories.length; i++) {
            try {
                c_scheme = categories[i].getAttribute('scheme');
                if (c_scheme == 'masas:category:icon') {
                    featureAttrib.icon = OpenLayers.Format.MASASFeed.IconURL
                        + categories[i].getAttribute('term') + '/small.png';
                } else if (c_scheme == 'masas:category:status') {
                    featureAttrib.status = categories[i].getAttribute('term');
                } else if (c_scheme == 'masas:category:severity') {
                    featureAttrib.severity = categories[i].getAttribute('term');
                } else if (c_scheme == 'masas:category:certainty') {
                    featureAttrib.certainty = categories[i].getAttribute('term');
                } else if (c_scheme == 'masas:category:category') {
                    if (featureAttrib.category == null) {
                        featureAttrib.category = categories[i].getAttribute('term');
                    } else {
                        featureAttrib.category += ',' + categories[i].getAttribute('term');
                    }
                }
            } catch (e) {}
        }
        
        // atom Links, string of space separated urls
        //TODO: perhaps change to array of links with content-types instead...
        links = this.getElementsByTagNameNS(node, atomns, "link");
        featureAttrib.links={};
        for (var i = 0,linksObj=featureAttrib.links; i < links.length; i++) {
            try {
                var link = links[i];
				var linkObj = {
					href:link.getAttribute('href'),
					rel:link.getAttribute('rel'),
					type:link.getAttribute('type')||"application/atom+xml",
					hrefLang:link.getAttribute('hreflang'),
					length:link.getAttribute('length')
				};
				switch (linkObj.rel) {
					case 'edit':
						linksObj.ATOM = linkObj
						break;
					case 'enclosure':
						//quick short circuit for CAP 
						if (linkObj.type == 'application/common-alerting-protocol+xml') {
							linksObj.CAP = linkObj;
							featureAttrib.CAP='Y';
							//featureAttrib.enclosures.push({type:'cap',url:linkObj.href,mime:linkObj.type});
						}else{
						    //look for known enclosure types
						    linksObj.attachments || (linksObj.attachments=[]);
							var known=false;
							var title=links[i].getAttribute('title')||OpenLayers.Util.createUrlObject(linkObj.href).pathname.split('/').pop();
						    var obj = {
										url: linkObj.href,
										mime: linkObj.type,
										'title': title,
										length:linkObj.length,
										hrefLang:linkObj.hrefLang
									};
							for(var type in OpenLayers.Format.MASASFeed.EnclosureRegEx){
						        if(linkObj.type.search(OpenLayers.Format.MASASFeed.EnclosureRegEx[type])>=0){
						            known = true;
									obj.type = type;
									linksObj.attachments.push(obj);
						            break;
						        }
						    }
						    if(!known){
						        obj.type="unknown";
								linksObj.attachments.push(obj);
						    }
						}
						break;
					case 'related':
						linksObj.xlink = linkObj;
						break;
					case 'history':
						linksObj.revisions = linkObj;
						break;
					//use the rel attribute value as the links object key if
					//not a well known value & previously handled above
					default:
						linksObj[linkObj.rel] = linkObj;
				}
            } catch (e) {}
        }
        
        // atom Content
        contents = this.getElementsByTagNameNS(node, atomns, "content");
        if (contents.length > 0) {
            //TODO: is testing for "src" contents necessary?
            c_type = contents[0].getAttribute("type");
            if (c_type == "text" || c_type == null) {
                featureAttrib.content = this.getFirstChildValue(node, atomns,
                    "content", null);
            } else if (c_type == "xhtml") {
                featureAttrib.content = this.getChildEl(contents[0]);
            }
        }
       
        // atom Rights ?
        /* value = this.getFirstChildValue(node, atomns, "rights", null);
        if (value) {
            atomAttrib.rights = value;
        } */        
        // atom Summary ?
        /* value = this.getFirstChildValue(node, atomns, "summary", null);
        if (value) {
            atomAttrib.summary = value;
        } */
        
        var geometry = this.parseLocations(node)[0];
        var originalGeom = geometry;
        if (geometry && geometry.CLASS_NAME != 'OpenLayers.Geometry.Point') {
          var centroid = geometry.getCentroid();
          geometry = centroid;
          //featureAttrib.point = centroid.toShortString();
        }
        
        var feature = new OpenLayers.Feature.Vector(geometry, featureAttrib);
        feature.fid = featureAttrib.id;
        feature.originalGeom = originalGeom;
        try {
            // catching and ignoring errors because mv is not used by posting tool
            feature.layer = mv.mapLayers.MASASLayer;
        } catch(e) {}
        feature.title = featureAttrib.title;  //or how to get attributes.title in a template?
        //console.log(feature);
        return feature;
    },
    
    /**
     * Method: checkGeometry
     * Resets the centroid geometry for non-point geometries
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * An Array of <OpenLayers.Feature.Vector>s.
     */
    checkGeometry: function(ev){
        if (!mv.adjustIcons && !ev.onLoad) {
            return;
        }
        
        var features = mv.mapLayers.MASASLayer.features;
        var mapExtent = mv.map.getExtent();
        var offset = mv.map.getResolution() * 100;
        var xfactor = (mv.showDetailedPopups) ? 5 : 4;
        var yfactor = (mv.showDetailedPopups) ? 3 : 2;
        if (features) {
            for (var i = 0; i < features.length; ++i) {
                if (features[i].cluster) {
                    for (var j = 0, len = features[i].cluster.length; j < len; ++j) {
                        var geometry = features[i].cluster[j].originalGeom;
                        var centroid = geometry.getCentroid();
                        if (geometry && geometry.CLASS_NAME != 'OpenLayers.Geometry.Point') {
                            var fBounds = geometry.getBounds();
                            
                            //case where the feature geometry completely overlaps the viewport 
                            if (fBounds.containsBounds(mapExtent)) {
                                var newGeom = new OpenLayers.Geometry.Point(mapExtent.right - xfactor * offset, mapExtent.top - yfactor * offset);
                                if (ev.zoomChanged) {
                                    features[i].cluster[j].geometry = newGeom;
                                    features[i].cluster[j].adjustedCentroid = true;
                                }
                                else {
                                    features[i].move(new OpenLayers.LonLat(newGeom.x, newGeom.y));
                                    features[i].adjustedCentroid = true;
                                    if (len == 1) {
                                      features[i].cluster[j].geometry = newGeom;
                                      features[i].cluster[j].adjustedCentroid = true;
                                    }
                                }
                                
                            //case where feature geometry just intersects the viewport
                            }
                            else if ((!mapExtent.contains(centroid.x, centroid.y)) && (mapExtent.intersectsBounds(fBounds))) {
                                var vertices = geometry.getVertices();
                                var dist = Number.MAX_VALUE;
                                var closest = null;
                                var mapCenter = mapExtent.toGeometry().getCentroid();
                                for (var v = 0; v < vertices.length; ++v) {
                                    var testDist = vertices[v].distanceTo(mapCenter);
                                    if (testDist < dist) {
                                        dist = testDist;
                                        closest = v;
                                    }
                                }
                                var newGeom = vertices[closest].clone();
                                if (ev.zoomChanged) {
                                    features[i].cluster[j].geometry = newGeom;
                                    features[i].cluster[j].adjustedCentroid = true;
                                }
                                else {
                                    features[i].move(new OpenLayers.LonLat(newGeom.x, newGeom.y));
                                    features[i].adjustedCentroid = true;
                                    if (len == 1) {
                                      features[i].cluster[j].geometry = newGeom;
                                      features[i].cluster[j].adjustedCentroid = true;
                                    }
                                }
                            }
                            else {
                                var centroid = geometry.getCentroid();
                                if (features[i].cluster[j].adjustedCentroid) {
                                    //reset the geometry to default centroid 
                                    features[i].cluster[j].geometry = centroid;
                                    features[i].cluster[j].adjustedCentroid = false;
                                }
                                if (features[i].adjustedCentroid) {
                                    //reset the geometry to default centroid 
                                    features[i].move(new OpenLayers.LonLat(centroid.x, centroid.y));
                                    features[i].adjustedCentroid = false;
                                }
                            }
                        }
                    }//j loop
                } 
            }//i loop
        }
    },
    
    /**
     * Method: parseFeatures
     * Return features from an Atom entry or feed.
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * An Array of <OpenLayers.Feature.Vector>s.
     */
    parseFeatures: function(node) {
        var features = [];
        var entries = this.getElementsByTagNameNS(
            node, this.namespaces.atom, "entry"
        );
        /* If there are no entries, don't parse the feed element itself
        if (entries.length == 0) {
            entries = [node];
        }
        */
        for (var i=0, ii=entries.length; i<ii; i++) {
            features.push(this.parseFeature(entries[i]));
        }
        return features;
    },
    
    /**
     * Method: parseLocations
     * Parse the locations from an Atom entry or feed.
     *
     * Parameters:
     * node - {DOMElement} An Atom entry or feed node.
     *
     * Returns:
     * An Array of <OpenLayers.Geometry>s.
     */
    parseLocations: function(node) {
        var georssns = this.namespaces.georss;

        var locations = {components: []};
        var where = this.getElementsByTagNameNS(node, georssns, "where");
        if (where && where.length > 0) {
            if (!this.gmlParser) {
                this.initGmlParser();
            }
            for (var i=0, ii=where.length; i<ii; i++) {
                this.gmlParser.readChildNodes(where[i], locations);
            }
        }
        
        var components = locations.components;
        var point = this.getElementsByTagNameNS(node, georssns, "point");
        if (point && point.length > 0) {
            for (var i=0, ii=point.length; i<ii; i++) {
                var xy = OpenLayers.String.trim(
                            point[i].firstChild.nodeValue
                            ).split(/\s+/);
                if (xy.length !=2) {
                    xy = OpenLayers.String.trim(
                                point[i].firstChild.nodeValue
                                ).split(/\s*,\s*/);
                }
                components.push(
                    new OpenLayers.Geometry.Point(
                        parseFloat(xy[1]),
                        parseFloat(xy[0])
                    )
                );
            }
        }

        var line = this.getElementsByTagNameNS(node, georssns, "line");
        if (line && line.length > 0) {
            var coords;
            var p;
            var points;
            for (var i=0, ii=line.length; i<ii; i++) {
                coords = OpenLayers.String.trim(
                                line[i].firstChild.nodeValue
                                ).split(/\s+/);
                points = [];
                for (var j=0, jj=coords.length; j<jj; j+=2) {
                    p = new OpenLayers.Geometry.Point(
                        parseFloat(coords[j+1]),
                        parseFloat(coords[j])
                    );
                    points.push(p);
                }
                components.push(
                    new OpenLayers.Geometry.LineString(points)
                );
            }
        }        

        var polygon = this.getElementsByTagNameNS(node, georssns, "polygon");
        if (polygon && polygon.length > 0) {
            var coords;
            var p;
            var points;
            for (var i=0, ii=polygon.length; i<ii; i++) {
                coords = OpenLayers.String.trim(
                            polygon[i].firstChild.nodeValue
                            ).split(/\s+/);
                points = [];
                for (var j=0, jj=coords.length; j<jj; j+=2) {
                    p = new OpenLayers.Geometry.Point(
                        parseFloat(coords[j+1]),
                        parseFloat(coords[j])
                    );
                    points.push(p);
                }
                components.push(
                    new OpenLayers.Geometry.Polygon(
                        [new OpenLayers.Geometry.LinearRing(points)]
                    )
                );
            }
        }
        
        var box = this.getElementsByTagNameNS(node, georssns, "box");
        if (box && box.length > 0) {
            var coords;
            var p;
            var points;
            for (var i=0, ii=box.length; i<ii; i++) {
                coords = OpenLayers.String.trim(
                            box[i].firstChild.nodeValue
                            ).split(/\s+/);
                points = [];
                points.push(new OpenLayers.Geometry.Point(  //lower-left
                        parseFloat(coords[1]),
                        parseFloat(coords[0])
                ));
                points.push(new OpenLayers.Geometry.Point(  //upper-left
                        parseFloat(coords[1]),
                        parseFloat(coords[2])
                ));
                points.push(new OpenLayers.Geometry.Point(  //upper-right
                        parseFloat(coords[3]),
                        parseFloat(coords[2])
                ));
                points.push(new OpenLayers.Geometry.Point(  //lower-right
                        parseFloat(coords[3]),
                        parseFloat(coords[0])
                ));
                points.push(new OpenLayers.Geometry.Point(  //repeat first point
                        parseFloat(coords[1]),
                        parseFloat(coords[0])
                ));
                components.push(
                    new OpenLayers.Geometry.Polygon(
                        [new OpenLayers.Geometry.LinearRing(points)]
                    )
                );
            }
        }
        
        if (this.internalProjection && this.externalProjection) {
            for (var i=0, ii=components.length; i<ii; i++) {
                if (components[i]) {
                    components[i].transform(
                        this.externalProjection,
                        this.internalProjection
                    );
                }
            }
        }
        
        //do circle after transform so that it is drawn in the map projection #4249
        var circle = this.getElementsByTagNameNS(node, georssns, "circle");
        if (circle && circle.length > 0) {
            var values;
            var p;
            var points;
            for (var i=0, ii=circle.length; i<ii; i++) {
                values = OpenLayers.String.trim(
                            circle[i].firstChild.nodeValue
                            ).split(/\s+/);
                var origin = new OpenLayers.Geometry.Point(
                        values[1],values[0]
                        ).transform(
                            this.externalProjection,
                            this.internalProjection
                        );
                var radius = values[2];  //georss circle radius is in meters
		/* TODO: this .getUnits function only works if proj4js is loaded.
                         A more reliable method will be to check the map object itself
                         when this is added to the parsing options.
                var mapUnits = this.internalProjection.getUnits();
                if (mapUnits != 'm') {   //convert meters to map units
                  radius = radius / (OpenLayers.INCHES_PER_UNIT[mapUnits] * OpenLayers.METERS_PER_INCH);
                }
		*/
                var circGeom = OpenLayers.Geometry.Polygon.createRegularPolygon(
                  origin, radius, this.circleNSides, 0
                );
                components.push(circGeom);
            }
        }
        
        return components;
    },
    
    CLASS_NAME: 'OpenLayers.Format.MASASFeed'
});

// trailing slash required
OpenLayers.Format.MASASFeed.IconURL = 'http://icon.masas-sics.ca/';

OpenLayers.Format.MASASFeed.EnclosureRegEx = {
    image: /jpeg|gif|png|tiff|image/,
    video: /video/,
    text: /text\\plain|text\\rich/,
    spreadsheet: /text\\csv|text\\comma|text\\tab|excel/,
    word: /word|rtf/,
    pdf: /pdf/
};
