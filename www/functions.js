//function to create a Leaflet polygon from bounding box coordinates
function BBOX2polygon(BBOX) {
    if (BBOX == null) {
        return new L.Polygon();
    }
    var p1 = new L.LatLng(BBOX[2], BBOX[0]),
        p2 = new L.LatLng(BBOX[3], BBOX[0]),
        p3 = new L.LatLng(BBOX[3], BBOX[1]),
        p4 = new L.LatLng(BBOX[2], BBOX[1]),
        polygonPoints = [p1, p2, p3, p4];

    return new L.Polygon(polygonPoints);
}

//function to zoom to the current BBOX layer
function ZoomToBBOX() {
    map.fitBounds(BBOX_Layer.getBounds())
}

//function to get the info of a record of the CSW response 
function CswRecord(xml) {
    this.id = $(xml).find('gmd\\:fileIdentifier').children().text();
    this.title = $(xml).find('gmd\\:identificationInfo').find('gmd\\:citation').find('gmd\\:title').children().text();
    this.abstract = $(xml).find('gmd\\:identificationInfo').find('gmd\\:abstract').children().text();
    this.location = $(xml).find('gmd\\:distributionInfo').find('gmd\\:title').children().text();
    let BBOX = []
    this.westBoundLongitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:westBoundLongitude').children().text();
    this.eastBoundLongitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:eastBoundLongitude').children().text();
    this.southBoundLatitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:southBoundLatitude').children().text();
    this.northBoundLatitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:northBoundLatitude').children().text();
    BBOX.push(this.westBoundLongitude)
    BBOX.push(this.eastBoundLongitude)
    BBOX.push(this.southBoundLatitude)
    BBOX.push(this.northBoundLatitude)
    this.BBOX = BBOX

    records.push({
        id: this.id,
        BBOX: this.BBOX
    });
}

//function to style the information of the record to append to the html table
function styleEntry(rec) {
    let snippet
    snippet += "<tr><td data-id='" + rec.id + "'>"
    link = 'http://' + csw_ip + '/geonetwork/srv/ger/catalog.search#/metadata/' + rec.id
    snippet += "<strong>" + rec.title + "</strong>"
    snippet += "<div id='Zoom'><img src='img/search.png' onclick='ZoomToBBOX()'></div></br>"
    snippet += "<small><i><a href='" + link + "' target='_blank'>" + rec.id + "</a></i></small></br>"
    snippet += "<a><small>" + rec.abstract + "</small></a></br>"
    snippet += "<a><small>" + rec.location + "</small></a>"
    snippet += "</td></tr>"

    return snippet
}

//function to construct the POST request
function buildCSWRequest(startPosition, bbox_enabled, freetext, startDate, endDate) {

    //Start of the request
    csw_request = '<csw:GetRecords maxRecords="' + number_of_results + '" startPosition="' + startPosition + '" outputFormat="application/xml" outputSchema="http://www.isotc211.org/2005/gmd"'
                  + ' resultType="results" service="CSW" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd"'
                  + ' xmlns:ogc="http://www.opengis.net/ogc" xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
                  + '<csw:Query typeNames="csw:Record"><csw:ElementSetName>full</csw:ElementSetName>';

    // construct snippet for BBOX
    if (bbox_enabled == true) {
        bounds = map.getBounds();
        spatialFilter = '<ogc:BBOX><ogc:PropertyName>ows:BoundingBox</ogc:PropertyName><gml:Envelope xmlns:gml="http://www.opengis.net/gml"><gml:lowerCorner>' + bounds.getWest() +
            ' ' + bounds.getSouth() + '</gml:lowerCorner><gml:upperCorner>' + bounds.getEast() + ' ' + bounds.getNorth() + '</gml:upperCorner></gml:Envelope></ogc:BBOX>';
    } 

    // construct snippet for Date range
    if (startDate != null && endDate != null) {
        temporalFilter = '<ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>csw:TempExtent_begin</ogc:PropertyName><ogc:Literal>'
                         + startDate + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>csw:TempExtent_end</ogc:PropertyName><ogc:Literal>' 
                         + endDate + '</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo>';
    }       

    //construct snippet for freetext
    if (freetext != '') {
        freetextFilter = '<ogc:PropertyIsLike escapeChar="\\" singleChar="_" wildCard="%"><ogc:PropertyName>csw:AnyText</ogc:PropertyName>' +
            '<ogc:Literal>%' + freetext + '%</ogc:Literal></ogc:PropertyIsLike>'
    }

    if (freetext != '') {

        if (bbox_enabled == true) {

            if (startDate != null && endDate != null) {
                csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:And>' + freetextFilter + spatialFilter + temporalFilter + '</ogc:And></ogc:Filter></csw:Constraint>';    
            } else {
                csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:And>' + freetextFilter + spatialFilter + '</ogc:And></ogc:Filter></csw:Constraint>';
            }
        } else if (startDate != null && endDate != null) {

            csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:And>' + freetextFilter + temporalFilter + '</ogc:And></ogc:Filter></csw:Constraint>';    

        } else {

            csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter>'+ freetextFilter +'</ogc:Filter></csw:Constraint>';
    
        }

    } else if (bbox_enabled == true) {

        if (startDate != null && endDate != null) {
            csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:And>' + spatialFilter + temporalFilter + '</ogc:And></ogc:Filter></csw:Constraint>';
        } else {
            csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter>' + spatialFilter + '</ogc:Filter></csw:Constraint>';
        }

    } else if (startDate != null && endDate != null) {

        csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:And>' + temporalFilter + '</ogc:And></ogc:Filter></csw:Constraint>';

    } 

    //End of the request
    csw_request += '</csw:Query></csw:GetRecords>';

    return csw_request;

}

