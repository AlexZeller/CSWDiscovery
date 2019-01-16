//url of CSW
const csw_url = 'http://192.168.178.27:8080/geonetwork/srv/en/csw'

//define Leaflet map, set view on lat/lon coordinates of Trier
var map = L.map('map').setView([49.76, 6.648387], 5);
//use openstreetmap as basemap
basemap = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
})
//add basemap to map
map.addLayer(basemap);


//list of current records; used to find the matching BBOX when hovered over entry
let records = []

//define BBOX layer
let BBOX_Layer

//Parameters for CSW GetRecords
//number of records returned
const number_of_results = 10
//Values to get to previous/next records 
let matched;
let nextrecord;
let start;

//Temportal filter values
let startDate
let endDate

//function to send the POST request to the CSW; parameter startPosition to traverse through the records
function getRecords(startPosition) {

    //empty list to fill with current records
    records = []

    //if no start position is set set to 1
    if (!startPosition) {
        startPosition = 1;
    }

    start = startPosition

    var freetext = $('#input-anytext').val().trim();
    var bbox_enabled = $('#input-spatialFilter').is(':checked');

    csw_request = buildCSWRequest(startPosition, bbox_enabled, freetext, startDate, endDate)

    $.ajax({
        type: "post",
        url: csw_url,
        contentType: "text/xml",
        data: csw_request,
        dataType: "xml",
        success: function (xml) {

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
            } else {
                $('#li-next').removeClass('disabled');
            }

            if (startPosition == 1) {
                $('#li-previous').addClass('disabled');
            } else {
                $('#li-previous').removeClass('disabled');;
            }

            $("#recordsNumber").text(startPosition + " - " + nextrecord + " of " + matched + " Record(s)");

            $(xml).find('gmd\\:MD_Metadata').each(function (record) {

                let rec = new CswRecord($(this));
                $("#table-csw-results").append(styleEntry(rec));
            })
        }
    });

}



$(document).ready(function () {

    getRecords();

    $("table").on("mouseenter", "td", function (event) {
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

    $('#a-previous').click(function (event) {
        event.preventDefault();
        startposition2 = start - number_of_results;
        if (startposition2 < 1) {
            return;
        }
        getRecords(startposition2);
    });
    $('#a-next').click(function (event) {
        event.preventDefault();
        if (nextrecord == 0 || nextrecord >= matched) {
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
    });

    $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('DD.MM.YYYY') + ' - ' + picker.endDate.format('DD.MM.YYYY'));
        startDate = picker.startDate.format('YYYY-MM-DD')
        endDate = picker.endDate.format('YYYY-MM-DD')
        console.log(startDate, endDate)

    });

    $('input[name="daterange"]').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startDate = null
        endDate = null
        console.log(startDate, endDate)
    });


    map.on('move', function () {
        var bbox_enabled = $('#input-spatialFilter').is(':checked');
        if (bbox_enabled != false) {
            getRecords();
            console.log('move');
        }
    });

});