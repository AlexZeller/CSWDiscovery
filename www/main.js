//url of Geonetwork CSW
const csw_ip = '192.168.178.27:8080'
const csw_url = 'http://' + csw_ip + '/geonetwork/srv/en/csw'

//define Leaflet map, set view on lat/lon coordinates of Trier
const map = L.map('map').setView([49.76, 6.648387], 5);
//use openstreetmap as basemap
const basemap = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
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

//global Temportal filter values
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

    //start position to calculate previous record
    start = startPosition

    //get input of freetext and if the spatial filter is enabled
    let freetext = $('#input-anytext').val().trim();
    let bbox_enabled = $('#input-spatialFilter').is(':checked');

    //build csw request to post
    csw_request = buildCSWRequest(startPosition, bbox_enabled, freetext, startDate, endDate)

    $.ajax({
        type: "post",
        url: csw_url,
        contentType: "text/xml",
        data: csw_request,
        dataType: "xml",
        success: function (xml) {

            $('#table-csw-results').empty();
            // derive results for paging
            matched = $(xml).find('csw\\:SearchResults').attr('numberOfRecordsMatched');
            nextrecord = $(xml).find('csw\\:SearchResults').attr('nextRecord');

            //if no records are found display "No results"
            if (matched == 0) {
                $('#table-csw-results').html('<tr><td>No results</td></tr>');
                $('#recordsNumber').html('');
                return;
            }

            //Dis/Enable previous/next button based on position
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

            //display number of records information
            $("#recordsNumber").text(startPosition + " - " + nextrecord + " of " + matched + " Record(s)");

            //Iterate through the records, style the information and append to table
            $(xml).find('gmd\\:MD_Metadata').each(function (record) {
                let rec = new CswRecord($(this));
                $("#table-csw-results").append(styleEntry(rec));
            })
        }
    });
}

$(document).ready(function () {

    //get no constraint records at first load of the page
    getRecords();

    //on mouseenter display the corresponding bounding box in the map
    $("table").on("mouseenter", "td", function (event) {
        let id = $(this).data("id")
        let entry = records.find(e => e.id === id);
        if (map.hasLayer(BBOX_Layer)) {
            map.removeLayer(BBOX_Layer);
        }
        BBOX_Layer = BBOX2polygon(entry.BBOX)
        map.addLayer(BBOX_Layer)
    });

    //previous button
    $('#a-previous').click(function (event) {
        event.preventDefault();
        startposition2 = start - number_of_results;
        if (startposition2 < 1) {
            return;
        }
        getRecords(startposition2);
    });
    //next button
    $('#a-next').click(function (event) {
        event.preventDefault();
        if (nextrecord == 0 || nextrecord >= matched) {
            return;
        }
        getRecords(nextrecord);
    });
    //getRecords on Enter for text input
    $("#input-anytext").keypress(function (e) {
        if (e.keyCode == 13) { // Enter key pressed, but not submitting the form to a page refresh
            getRecords();
            return false;
        }
    });

    //define the datepicker
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

    //on apply set the values for the date range
    $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('DD.MM.YYYY') + ' - ' + picker.endDate.format('DD.MM.YYYY'));
        startDate = picker.startDate.format('YYYY-MM-DD')
        endDate = picker.endDate.format('YYYY-MM-DD')
    });
    //on cancel delete date range values
    $('input[name="daterange"]').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startDate = null
        endDate = null
        console.log(startDate, endDate)
    });
    //refresh records on mouse move while spatial filter is enabled
    map.on('move', function () {
        var bbox_enabled = $('#input-spatialFilter').is(':checked');
        if (bbox_enabled != false) {
            getRecords();
            console.log('move');
        }
    });

});