const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([37.41, 8.82]),
        zoom: 4
    })
});

const csw_url = 'http://192.168.178.27:8080/geonetwork/srv/en/csw'
const number_of_results = 10
const startposition = 1


csw_request = '<csw:GetRecords maxRecords="' + number_of_results + '" startPosition="' + startposition + '" outputFormat="application/xml" outputSchema="http://www.isotc211.org/2005/gmd" resultType="results" service="CSW" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:ogc="http://www.opengis.net/ogc" xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><csw:Query typeNames="csw:Record"><csw:ElementSetName>full</csw:ElementSetName>';
csw_request += '</csw:Query></csw:GetRecords>';

$.ajax({
    type: "post",
    url: csw_url,
    contentType: "text/xml",
    data: csw_request,
    dataType: "xml",
    success: function(xml) {

        console.log(xml);
        // derive results for paging
        var matched = $(xml).find('csw\\:SearchResults').attr('numberOfRecordsMatched');
        var returned = $(xml).find('csw\\:SearchResults').attr('numberOfRecordsReturned');
        var nextrecord = $(xml).find('csw\\:SearchResults').attr('nextRecord');

        console.log(matched, returned, nextrecord)

        $(xml).find('gmd\\:MD_Metadata').each(function(record) {

            var id = $(xml).find('gmd\\:fileIdentifier').children().text();
            var title = $(xml).find('gmd\\:identificationInfo').find('gmd\\:citation').find('gmd\\:title').children().text();
            var abstract = $(xml).find('gmd\\:identificationInfo').find('gmd\\:abstract').children().text();
            
            var BBOX = []
            var westBoundLongitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:westBoundLongitude').children().text();
            var eastBoundLongitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:eastBoundLongitude').children().text();
            var southBoundLatitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:southBoundLatitude').children().text();
            var northBoundLatitude = $(xml).find('gmd\\:identificationInfo').find('gmd\\:EX_GeographicBoundingBox').find('gmd\\:northBoundLatitude').children().text();
            BBOX.push(westBoundLongitude)
            BBOX.push(eastBoundLongitude)
            BBOX.push(southBoundLatitude)
            BBOX.push(northBoundLatitude)

            console.log(id, title, abstract, BBOX)

            $("#table-csw-results").append("<tr><th data-id='" + id + "'>Test</th></tr>");

        })
    }
});