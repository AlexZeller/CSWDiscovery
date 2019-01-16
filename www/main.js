//define Leaflet map, set view on lat/lon coordinates of Trier
var map = L.map('map').setView([49.76, 6.648387], 5);
//use openstreetmap as basemap
basemap = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
})
//add basemap to map
map.addLayer(basemap);

//define BBOX layer
let BBOX_Layer
//list of current records
let records = []

//function to create Leaflet polygon from bounding box
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

//function to get the info of the record of the CSW response 
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

    records.push({id: this.id, BBOX: this.BBOX});
}

//function to style the information of the record to append to the html
function styleEntry(rec){
   let snippet
   snippet +=  "<tr><td data-id='" + rec.id + "'>"
   link = 'http://136.199.176.14:8080/geonetwork/srv/ger/catalog.search#/metadata/' + rec.id
   snippet += "<strong>" + rec.title + "</strong>"
   snippet += "<div id='Zoom'><img src='img/search.png' onclick='ZoomToBBOX()'></div></br>"
   snippet += "<small><i><a href='" + link + "' target='_blank'>" + rec.id + "</a></i></small></br>"
   snippet += "<a><small>" + rec.abstract + "</small></a></br>"
   snippet += "<a><small>" + rec.location + "</small></a>"
   snippet +="</td></tr>"

   return snippet
}

//url of CSW
const csw_url = 'http://136.199.176.14:8080/geonetwork/srv/en/csw'

//Parameters for CSW GetRecords
const number_of_results = 10

let matched; 
let nextrecord;
let start;

//function to send the POST request to the CSW 
function getRecords(startPosition){
    
    //empty list to fill with current records
    records = []

    //if no start position is set set to 1
    if (!startPosition) {
        startPosition = 1;
    }

    start = startPosition

    var freetext = $('#input-anytext').val().trim();
    var bbox_enabled = $('#input-spatialFilter').is(':checked');

    csw_request = '<csw:GetRecords maxRecords="' + number_of_results + '" startPosition="' + startPosition + '" outputFormat="application/xml" outputSchema="http://www.isotc211.org/2005/gmd" resultType="results" service="CSW" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:ogc="http://www.opengis.net/ogc" xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><csw:Query typeNames="csw:Record"><csw:ElementSetName>full</csw:ElementSetName>';

    if (bbox_enabled != false) {
        bounds = map.getBounds();
        //qbbox = '<ogc:BBOX><ogc:PropertyName>ows:BoundingBox</ogc:PropertyName><gml:Envelope xmlns:gml="http://www.opengis.net/gml"><gml:lowerCorner>' + bounds.getSouth() + ' ' + bounds.getWest() + '</gml:lowerCorner><gml:upperCorner>' + bounds.getNorth() + ' ' + bounds.getEast() + '</gml:upperCorner></gml:Envelope></ogc:BBOX>';
        qbbox = '<ogc:BBOX><ogc:PropertyName>ows:BoundingBox</ogc:PropertyName><gml:Envelope xmlns:gml="http://www.opengis.net/gml"><gml:lowerCorner>' + bounds.getWest() + ' ' + bounds.getSouth() + '</gml:lowerCorner><gml:upperCorner>' + bounds.getEast() + ' ' + bounds.getNorth() + '</gml:upperCorner></gml:Envelope></ogc:BBOX>';
    }

    if (freetext != '') {
        csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:PropertyIsLike escapeChar="\\" singleChar="_" wildCard="%"><ogc:PropertyName>csw:AnyText</ogc:PropertyName><ogc:Literal>%' + freetext + '%</ogc:Literal></ogc:PropertyIsLike></ogc:Filter></csw:Constraint>';


        if (bbox_enabled != false) {
            csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:And><ogc:PropertyIsLike escapeChar="\\" singleChar="_" wildCard="%"><ogc:PropertyName>csw:AnyText</ogc:PropertyName><ogc:Literal>%' + freetext + '%</ogc:Literal></ogc:PropertyIsLike>' + qbbox + '</ogc:And></ogc:Filter></csw:Constraint>';
        }
        else {
            csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter><ogc:PropertyIsLike escapeChar="\\" singleChar="_" wildCard="%"><ogc:PropertyName>csw:AnyText</ogc:PropertyName><ogc:Literal>%' + freetext + '%</ogc:Literal></ogc:PropertyIsLike></ogc:Filter></csw:Constraint>';
        }

    } else if (bbox_enabled != false) {
        csw_request += '<csw:Constraint version="1.1.0"><ogc:Filter>' + qbbox + '</ogc:Filter></csw:Constraint>';
    }

    csw_request += '</csw:Query></csw:GetRecords>';

    $.ajax({
        type: "post",
        url: csw_url,
        contentType: "text/xml",
        data: csw_request,
        dataType: "xml",
        success: function(xml) {

            $('#table-csw-results').empty();
            //console.log(xml);
            // derive results for paging
            matched = $(xml).find('csw\\:SearchResults').attr('numberOfRecordsMatched');
            nextrecord = $(xml).find('csw\\:SearchResults').attr('nextRecord');

            if (matched == 0) {
                $('#table-csw-results').html('<tr><td>No results</td></tr>');
                $('#recordsNumber').html('');
                return;
            }
            
            if (nextrecord == 0 || nextrecord >= matched) { 
                $('#li-next').addClass('disabled');
                nextrecord = matched;
            }
            else {
                $('#li-next').removeClass('disabled');
            }

            if (startPosition == 1) {
                $('#li-previous').addClass('disabled');
            }
            else {
                $('#li-previous').removeClass('disabled');;
            }

            $("#recordsNumber").text(startPosition + " - " + nextrecord + " of " + matched + " Record(s)");

            $(xml).find('gmd\\:MD_Metadata').each(function(record) {

                let rec = new CswRecord($(this));
                $("#table-csw-results").append(styleEntry(rec));
            })
        }
    });

}



$(document).ready(function(){

    getRecords();

    $("table").on("mouseenter", "td", function(event) {
        let id = $(this).data("id")
        //console.log(id)
        let entry = records.find(e => e.id === id);
        //console.log(entry.BBOX)
        if (map.hasLayer(BBOX_Layer)) {
            map.removeLayer(BBOX_Layer);
        }

        BBOX_Layer = BBOX2polygon(entry.BBOX)
        map.addLayer(BBOX_Layer)
    });

    $('#a-previous').click(function(event){
        event.preventDefault(); 
        startposition2 = start-number_of_results;
        if (startposition2 < 1) {
            return;
        }
        getRecords(startposition2);
    }); 
    $('#a-next').click(function(event){
        event.preventDefault(); 
        if (nextrecord == 0 || nextrecord>=matched) {
            return;
        }
        getRecords(nextrecord);
    }); 

    $("#input-anytext").keypress(function (e) {
        if (e.keyCode == 13) { // Enter key pressed, but not submitting the form to a page refresh
            getRecords();
            return false;
        }
    });

    $('#datepicker').daterangepicker({
        "showDropdowns": true,
        "autoUpdateInput": false,
        "locale": {
            "format": "DD.MM.YYYY",
            "separator": " - ",
            "applyLabel": "Apply",
            "cancelLabel": 'Clear',
            "fromLabel": "From",
            "toLabel": "To",
            "customRangeLabel": "Custom",
            "weekLabel": "W",
            "daysOfWeek": [
                "Su",
                "Mo",
                "Tu",
                "We",
                "Th",
                "Fr",
                "Sa"
            ],
            "monthNames": [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ],
            "firstDay": 1
        },
        "minDate": "1/1/1950",
        "maxDate": "1/1/2050"
    }, function(start, end, label) {
      console.log('New date range selected: ' + start.format('DD.MM.YYYY') + ' to ' + end.format('DD.MM.YYYY'));
    });

    $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('DD.MM.YYYY') + ' - ' + picker.endDate.format('DD.MM.YYYY'));
    });

    $('input[name="daterange"]').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });

    
    map.on('move', function() {
        var bbox_enabled = $('#input-spatialFilter').is(':checked');
        if (bbox_enabled != false) {
            getRecords();
            console.log('move');
        }
    });



    
    

});

function ZoomToBBOX(){

    map.fitBounds(BBOX_Layer.getBounds())

}