## CSWDiscovery

CSWDiscovery is a basic webinterface to interact with a CSW-Server and query records with text, spatial and temporal filters. It is using [Leaflet](https://leafletjs.com/) as a library for the map and some basic javascript.

![Alt text](/www/img/CSWDiscovery.PNG?raw=true "Optional Title")

### Getting started 

CSWDiscovery uses a simple Node.js Server so you need to have Node.js installed

1. Clone the repository
```
git clone https://github.com/AlexZeller/TwitterMap.git
```

2. Change into the directory
```
cd CSWDiscovery
```

3. Install the packages
```
npm install
```
4. Run the server
```
node server.js
```

5. Show the map on
http://localhost:9000

### Information

This webinterface is created to work with a Geonetwork CSW-Server and the ISO19115-3 metadata format. The URL of the Geonetwork-Server is set in the `main.js` and the query to send to the server is built in `functions.js`. 

With different impementations of CSW-Servers and/or different output schemas (currently outputSchema="http://www.isotc211.org/2005/gmd") the Application might not work as expected.
