
//last time the page was reloaded
var lastReloadTime;
//whether the last data refresh was complete
var lastRefreshComplete = false;

//whether the new route data is ready
var newRouteReady = false;
//whether the page is done loading (should error message be displayed)
var doneLoading = false;
//number of times to check for page load completion
var maxLoadingChecks;
//the interval object to store the interval checker for page load completion
var loadingCheckerInterval;

//objects on the map
var mapObjects = [];
//vehicles on the map
var mapVehicleObjects = [];
//map object
var map;

//old xml for all predictions, to verify new xml has been retrieved
var oldAllPredXML;
//current xml for all predictions
var allPredXML;

//old xml for vehicle locations, to verify new data has been retrieved
var oldVechLocXML;
//current xml for vehicle locations
var vechLocXML;

//xml for information on all routes
var allRouteDataXML;

//current xml for route information
var routeDataXML;
//xml for route currently selected in selector
var newRouteDataXML;
//old xml for route information, to verify new xml has been retrieved
var oldRouteDataXML;

//url to retrieve predictions
var predURL;
//url to retrieve vehicle locations
var vechURL;
//url to retrieve stop data for a route
var stopURL;

//data for all routes
var allRouteData = [];
//data for coordinates of the route for display on map
var routeCords = [];
//data for vehicles on the route
var busData = [];
//data for branches of the route
var branchData = [];
//data for stops on the route being predicted
var stopData = [];
//data for stops for route in selector
var newStopData = [];
//prediction data
var predData = [];
//colour of route, from xml
var routeColour = "ff0000";
//opposite colour of route, from xml
var oppRouteColour = "ffffff";

//location of current stop (lat, long)
var stopLocation = [];
//route previously selected
var route = "";
//route newly selected
var newRoute = "17";
//route tag previously selected
var routeTag = "";
//route tag newly selected
var newRouteTag = "17_0_17A";
//stop id previously selected
var stopId = "";
//stop id newly selected
var newStopId = "0466";
//stop tag previously selected
var stopTag = "";
//stop tag newly selected
var newStopTag = "1638";

//when document is ready
$(document).ready(pageReady);

//page ready
function pageReady() {
    //button press
    $("button").click(buttonPress);
    
    //route select changed
    $("select").change(selectChange);
    
    //load all route data
    getData("route");
    
    //refresh page display
    setUpNewRoute();
} 

//button pressed
function buttonPress() {
    //id of button pressed
    var buttonID = this.id;
    
    if (buttonID == "refresh") {
        if (lastRefreshComplete) {
            refreshPredictions();
        }
        else {
            alert("The page is still being refreshed.");
        }
    }
    
    if (buttonID == "go") {
        goButtonClicked();
    }
    
    if (buttonID == "default") {
        newRoute = "17";
        newRouteTag = "17_0_17A";
        newStopId = "0466";
        setUpNewRoute();
    }
}

//selector changed
function selectChange() {
    console.log("selector change - " + this.id);
    var selectID = this.id;
    
    if (selectID == "routeSelect") {
        newRoute = $("#routeSelect").val();
        oldRouteDataXML = newRouteDataXML;
        getData("new");
        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkNewRouteLoadingStatus, 500);
        
        if (newRoute === "0") {
            newRouteTag = "0";
            displayStopData("clear");
        }
    }
    
    else if (selectID == "branchSelect") {
        newRouteTag = $("#branchSelect").val();
        getStopData("new");
        displayStopData();
    }
    
    else if (selectID == "stopSelect") {
        if ($("#branchSelect").val() != 0) {
            newStopTag = $("#stopSelect").val();
            newStopId = newStopData[newStopTag]["stopId"];
        }
    }
}

//refresh predictions & map
function refreshPredictions() {
    now = new Date().getTime();
    
    //prevent page from being reloaded too quickly (will cause page to crash)
    if (Math.abs(lastReloadTime-now) > 500 || isNaN(lastReloadTime-now)) {
        
        console.log("refresh predictions")
        
        //set last reload time
        lastReloadTime = now;
        
        //set reload complete flag to false
        lastRefreshComplete = false;

        //keep old predictions and vehicle locations data to verify new data has been retrived
        oldAllPredXML = allPredXML;
        oldVechLocXML = vechLocXML;
        
        //check for resource loading & timeout
        window.setTimeout(displayLoadingErrorMessage, 3000);
        
        getData("vech");
        
        //arrival stop, does not have stop id
        if (stopTag.indexOf("_ar") == -1) {
            console.log("refresh by stopId - ar");
            getData("predStopId");
        }
        else {
            console.log("refresh by stopTag - normal");
            getData("predStopTag");
        }

        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkUpdatePredictionsLoadingStatus, 500); 
    }
}

//new route chosen
function setUpNewRoute() {
    
    now = new Date().getTime();
    
    //prevent page from being reloaded too quickly (will cause page to crash)
    if (Math.abs(lastReloadTime-now) > 500 || isNaN(lastReloadTime-now)) {
        console.log("set up new route - by tag")
        $("#progress").show();
        $(".loader").show();
        $(".loader").attr("id", "loadSpinnerNormal");
    
        //set last reload time
        lastReloadTime = now;
        
        //set reload complete flag to false
        lastRefreshComplete = false;
        
        //loading message 
        $(".loadingMessage").text("Loading...").show();

        //check for resource loading & timeout
        window.setTimeout(displayLoadingErrorMessage, 3000);
        
        //update stop settings
        routeTag = newRouteTag;
        stopId = newStopId;
        stopTag = newStopTag;
        route = newRoute;

        getData("stop"); 
        getData("vech");
        
        if (stopTag.indexOf("_ar") == -1) {
            console.log("refresh by stopId - ar");
            getData("predStopId");
        }
        else {
            console.log("refresh by stopTag - normal");
            getData("predStopTag");
        }
        
        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkLoadingStatus, 500); 
    }
}

//new route chosen by ID
function setUpNewRouteById() {

    now = new Date().getTime();
    
    //prevent page from being reloaded too quickly (will cause page to crash)
    if (Math.abs(lastReloadTime-now) > 500 || isNaN(lastReloadTime-now)) {
        console.log("set up new route - by id")
        $("#progress").show();
        $(".loader").show();
        $(".loader").attr("id", "loadSpinnerNormal");
    
        //set last reload time
        lastReloadTime = now;
        
        //set reload complete flag to false
        lastRefreshComplete = false;
        
        //loading message 
        $(".loadingMessage").text("Loading...").show();

        //check for resource loading & timeout
        window.setTimeout(displayLoadingErrorMessage, 3000);
        
        //update by id
        stopId = newStopId;
        
        oldAllPredXML = allPredXML;
        getData("predStopId");
        
        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkUpdateByIdForPred, 500); 
    }
}

//create page
function createPage() {

    clearInterval(loadingCheckerInterval);
    
    getRouteCords();
    getBusCords();
    getStopData("start");
    getStopLocation();
    
    getAllRoutes();
    displayAllRoutes();

    getPredictions();
    displayPredictions();

    getBranchData();
    displayBranchData();
        
    displayStopData();

    $(".loadingMessage").hide();
    doneLoading = true;
    
    //set default values on selectors
    $("#routeSelect")[0].value = route;
    $("#branchSelect")[0].value = routeTag;
    $("#stopSelect")[0].value = newStopTag;
    
    //create map
    createMap();
    
    $(".loader").hide();
    $("#progress").hide();
}

//create map
function createMap() {
    //clear map
    $("#map").html("");
    clearMap();
    
    //properties
    var defaultZoom = 14;

    //map
    var mapCenter = new google.maps.LatLng(stopLocation[0], stopLocation[1]);
    var mapCanvas = document.getElementById("map");
    var mapProp = {
        center: mapCenter,
        zoom: defaultZoom,
        streetViewControl: false
    };
    map = new google.maps.Map(mapCanvas, mapProp);
    
    //stop marker
    var stopMarkerProp = {
        position: mapCenter,
        //icon: getResource("bus-station.svg")
        //animation: google.maps.Animation.BOUNCE
    };
    var stopMarker = new google.maps.Marker(stopMarkerProp);
    stopMarker.setMap(map);
    mapObjects.push(stopMarker);
    
    //route lines
    for (var i=0; i<routeCords.length; i++) {
        var routeLineProp = {
          strokeColor: "#"+routeColour,
          path: routeCords[i],
          strokeOpacity: 0.8,
          strokeWeight: 2
        };
        var routeLine = new google.maps.Polyline(routeLineProp);
        routeLine.setMap(map);
        mapObjects.push(routeLine);
    }
    
    //bus locations
    updateMapVehicleLocations();
    
    //click on marker to reset zoom
    google.maps.event.addListener(stopMarker, 'click', function() {
        map.setZoom(defaultZoom);
        map.setCenter(stopMarker.getPosition());
    });
    
    routeCords.length = 0;
    busData.length = 0; 
}

//update the vehicle locations on map
function updateMapVehicleLocations() {
    
    clearMapVehicles();

    for (var i=0; i<busData.length; i++) {
        var curBus = busData[i];
        var icon = getResource(getBusDirection(curBus["dirTag"]));
        
        var busMarkerProp = {
            position: busData[i]["coord"],
            //icon: getResource("bus-station.png"),
            icon: icon,
            title: busData[i]["id"]+" - "+busData[i]["dirTag"]
            //animation: google.maps.Animation.BOUNCE
        };
        
        var busMarker = new google.maps.Marker(busMarkerProp);
        busMarker.setMap(map);
        mapObjects.push(busMarker);
        mapVehicleObjects.push(busMarker);
    }
}

//get all routes
function getAllRoutes() {
    getDataList = ["tag", "title"];
    allRoutes = allRouteDataXML.getElementsByTagName("route");
    
    for (var i=0; i<allRoutes.length; i++) {
        curAllRouteData = [];
        
        for (var j=0; j<getDataList.length; j++) {
            curAllRouteData[getDataList[j]] = allRoutes[i].attributes.getNamedItem(getDataList[j]).nodeValue;
        }
            
        allRouteData.push(curAllRouteData);
    }
}

//display all routes
function displayAllRoutes() {
    
    $("#routeSelect").empty();
    
    $("#routeSelect").append($("<option>", {
        value: 0,
        text: "Select Route"
    }));

    for (var i = 0; i<allRouteData.length; i++) {
        curRouteData = allRouteData[i];
        $("#routeSelect").append($("<option>", {
            value: curRouteData["tag"],
            text: curRouteData["title"]
        }));
    }
}

//get a list of the predictions
function getPredictions() {
    predData.length = 0;
    
    var allPredictions = allPredXML.getElementsByTagName("predictions");
    
    for (var h=0; h<allPredictions.length; h++) {
        var getDataList = ["agencyTitle", "routeTitle", "routeTag", "stopTitle", "stopTag"];
        var predictions = allPredictions[h];
        var thisPredData = [];
        var thisPredictionDirectionData = [];
        
        for (var i = 0; i < getDataList.length; i++) {
            thisPredData[getDataList[i]] = predictions.attributes.getNamedItem(getDataList[i]).nodeValue;
        }
        
        var getDataList = ["isDeparture", "branch", "dirTag", "vehicle", "block", "tripTag"];
        var predDirectionData = [];
        allPredBranches = predictions.getElementsByTagName("direction");
        
        for (var i = 0; i < allPredBranches.length; i++) {
            curPredBranch = allPredBranches[i];
            curPredBranchData = [];
            curPredBranchData["title"] = curPredBranch.attributes.getNamedItem("title");
            
            curPredBranchPredictions = [];
            branchPreds = curPredBranch.children;
            
            for (var j = 0; j<branchPreds.length; j++) {
                curPredData = [];
                curPred = branchPreds[j];

                for (var k=0; k<getDataList.length; k++) {
                    curPredData[getDataList[k]] = curPred.attributes.getNamedItem(getDataList[k]).nodeValue;
                }
                
                curPredData["epochTime"] = Number(curPred.attributes.getNamedItem("epochTime").nodeValue);
                
                curPredData["minutes"] = zeroFill(Number(curPred.attributes.getNamedItem("minutes").nodeValue), 0);
                curPredData["seconds"] = zeroFill(Number(curPred.attributes.getNamedItem("seconds").nodeValue)%60, 2);
                curPredData["simDir"] = getSimDir(curPredData["dirTag"]);
                
                curPredData["timeStr"] = getTimeString(curPredData["epochTime"]);
                
                curPredBranchPredictions.push(curPredData);
            }
            curPredBranchData["predictions"] = curPredBranchPredictions;
            thisPredictionDirectionData.push(curPredBranchData);
            
        }
        thisPredData["data"] = thisPredictionDirectionData
        predData.push(thisPredData);
    }
}

//display list of predictions
function displayPredictions() {

    $("#predictions").empty();
    var allPredDirectionData = predData;
    
    var predStopTitle = allPredDirectionData[0]["stopTitle"];
    var predStopTag = allPredDirectionData[0]["stopTag"];
    
    $("<h2></h2>").html(predStopTitle).appendTo("#predictions");
    $("<strong></strong>").html("Stop ID: " + stopId).appendTo("#predictions");
    
    for (var h=0; h < allPredDirectionData.length; h++) {
 
        var thisPredData = allPredDirectionData[h];
        
        if ((!$("#displayOnlyThisRoute")[0].checked) || ($("#displayOnlyThisRoute")[0].checked 
                                    && thisPredData["routeTag"] === route)) {
            
            var predDirectionData = thisPredData["data"];
            
            for (var i=0; i<predDirectionData.length; i++) {
                
                curDisplayPredBranch = predDirectionData[i];
                
                curDisplayPredBranchTitle = predDirectionData[i]["title"].nodeValue;
                curDisplayPredBranchPredictions = predDirectionData[i]["predictions"];
                
                $("<h3></h3>").html(curDisplayPredBranchTitle).appendTo("#predictions");
               
                for (var j=0; j<curDisplayPredBranchPredictions.length; j++) {
                    curPredData = curDisplayPredBranchPredictions[j];
                    $("<li></li>").html(curPredData["branch"] + " - " + curPredData["vehicle"] + " - in " + 
                        curPredData["minutes"] + " min " + curPredData["seconds"] + " sec - " + 
                        curPredData["timeStr"]).appendTo("#predictions");
                }
            }
        }
    }
}    

//get locations of stops - FIX
function getStopLocation() {
    curStop = newStopData[stopTag];
    var lat = curStop["lat"];
    var lon = curStop["lon"];
    stopLocation[0] = Number(lat);
    stopLocation[1] = Number(lon);
}

//get list of stops
function getStopData(type) {
    if (type == "start") {
        stopData = [];
    }
    newStopData = [];

    if (type == "start") {
        routeColour = routeDataXML.getElementsByTagName("route")[0].attributes.getNamedItem("color").nodeValue;
        oppRouteColour = routeDataXML.getElementsByTagName("route")[0].attributes.getNamedItem("oppositeColor").nodeValue;
        var allStops = routeDataXML.getElementsByTagName("route")[0].children;
    }
    if (type == "new") {
        var allStops = newRouteDataXML.getElementsByTagName("route")[0].children;
    }
    
    var getDataList = ["tag", "title", "lat", "lon", "stopId"]
    
    for (var i=0; i<allStops.length; i++) {
        
        var curStop = allStops[i];
        var curStopData = [];

        for (var j=0; j<getDataList.length; j++) {
            item = curStop.attributes.getNamedItem(getDataList[j])
            if (item != undefined) {
                curStopData[getDataList[j]] = item.value;
            }
        }
        if (type == "start") {
            stopData[curStopData["tag"]] = curStopData;
        }
        newStopData[curStopData["tag"]] = curStopData;
    }
}

//display list of stops
function displayStopData(type) {

    $("#stopSelect").empty();
    
    $("#stopSelect").append($("<option>", {
        value: 0,
        text: "Select Stop"
    }));
    
    if (type != "clear") {
    
        var curBranch = branchData[newRouteTag];
        curBranchStopList = curBranch["stops"];
    
        for (var i = 0; i<curBranchStopList.length; i++) {
            curBranchStopTag = curBranchStopList[i]
            curBranchStop = newStopData[curBranchStopTag];
            $("#stopSelect").append($("<option>", {
                value: curBranchStop["tag"],
                text: curBranchStop["title"]
            }));
        }
    }
}

//get data for each direction of route & clear interval
function getBranchData() {

    clearInterval(loadingCheckerInterval);

    branchData = [];
    var getDataList = ["title", "name", "branch", "tag", "useForUI"];
    var allDirections = newRouteDataXML.getElementsByTagName("direction");
    
    for (var i=0; i<allDirections.length; i++) {
        //route data
        var curDir = allDirections[i];
        //var curDirTag = curDir.attributes.getNamedItem("tag").nodeValue;
        var curDirData = [];
        
        for (var j=0; j<getDataList.length; j++) {
            curDirData[getDataList[j]] = curDir.attributes.getNamedItem(getDataList[j]).nodeValue;
        }
        
        //route stop data
        var curDirStops = curDir.children;
        var curDirStopsList = [];
        
        for (var j=0; j<curDirStops.length; j++) {
            curDirStopsList.push(curDirStops[j].attributes.getNamedItem("tag").nodeValue);
        }
        curDirData["stops"] = curDirStopsList;
        //branchData[curDirTag] = curDirData;
        branchData[curDirData["tag"]] = curDirData;
    }
}

//display list for each direction of route
function displayBranchData() {
    $("#branchSelect").empty();
    
    $("#branchSelect").append($("<option>", {
        value: 0,
        text: "Select Branch"
    }));
    
    //for (var i = 0; i < branchData.length; i++) {
    
    //branchData.forEach(function(curBranch, index) {
    
    for (var curBranchName in branchData) {
        curBranch = branchData[curBranchName];
        $("#branchSelect").append($("<option>", {
            value: curBranch["tag"],
            text: curBranch["title"]
        }));
    }
}

//get coordinates for the route path
function getRouteCords() {
    var allPaths = routeDataXML.getElementsByTagName("path");
    
    for (var i=0; i<allPaths.length; i++) {
        var sectionCords = []
        var cordsInPath = allPaths[i].getElementsByTagName("point");
        
        for (var j=0; j<cordsInPath.length; j++) {
            var lat = Number(cordsInPath[j].attributes.getNamedItem("lat").nodeValue);
            var lon = Number(cordsInPath[j].attributes.getNamedItem("lon").nodeValue);
            sectionCords.push(new google.maps.LatLng(lat, lon));
        }
        routeCords.push(sectionCords)
    }
}

//get data for each bus
function getBusCords() {
    var allVech = vechLocXML.getElementsByTagName("vehicle");
    var getDataList = ["id", "dirTag", "lat", "lon", "heading", "secsSinceReport"];
    
    findAllVehicles:
    for (var i=0; i<allVech.length; i++) {
        var vech = allVech[i]
        if (vech.attributes.getNamedItem("predictable").nodeValue == "true" && vech.attributes.getNamedItem("heading").nodeValue >= 0) {
            curVechData = [];
        
            for (var j=0; j<getDataList.length; j++) {
                //console.log(getDataList[j]);
                if (getDataList[j] in vech.attributes) {
                    curVechData[getDataList[j]] = vech.attributes.getNamedItem(getDataList[j]).nodeValue;   
                }
                else {
                    continue findAllVehicles;
                }
            }
            
            curVechData["simDir"] = getSimDir["dirTag"];
            curVechData["coord"] = new google.maps.LatLng(curVechData["lat"], curVechData["lon"]);
            busData.push(curVechData);
        }
    }
}

//convert data in xml format
function parseXML(data, type) {
    console.log("PARSE DATA", data, type);
    switch (type) {
        case "stop":
            routeDataXML = data;
            newRouteDataXML = data;
            newRouteReady = true;
            break;
        case "vech":
            vechLocXML = data;
        	break;
        case "predStopId":
        case "predStopTag":
            allPredXML = data;
        	break;
        case "route":
            allRouteDataXML = data;
            break;
        case "new":
            newRouteDataXML = data;
            newRouteReady = true;
    }
}

//get data from NextBus servers
function getData(type){

    var url;
    
    switch (type) {
        case "stop":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r="+route+"&verbose";
            break;
        case "vech":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r="+route;
            break;
        case "predStopId":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId="+stopId;
            //url = "https://www.nextbus.com/api/pub/v1/agencies/ttc/routes/17/stops/1638/predictions?coincident=true&direction=17_0_17A&key=7141fa6118803c15751f29743cb974ab&timestamp=1489868202701";
            break;
        case "predStopTag":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&r="+route+"&s="+stopTag;
            break;
        case "route":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=ttc";
            break;
        case "new":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r="+newRoute;
            break;
    }
    
    /*
    var xhttp = new XMLHttpRequest();
    
    //xhttp.withCredentials = true;
    xhttp.open("GET", url, true);
    
    xhttp.onload = function() {
        if (this.readyState == 4 && this.status == 200) {
            parseXML(this.responseXML, type);
        }
    };
    
    xhttp.send();
    */
    
    $.ajax({
        type: "GET",
        url: url,
        xml: "xml",
        async: true,
        success: function(data) {
            parseXML(data, type)
        }
    })
}

//display loading error message
function displayLoadingErrorMessage() {
    clearInterval(loadingCheckerInterval);
    if (!doneLoading) {
        $(".loadingMessage").text("Error 1 - Data could not be retrieved.");
        $(".loadingMessage").addClass("errorMessage");
        $(".loader").attr("id", "loadSpinnerError");
    }
}

//get file from local resource directory
function getResource(name) {
    return "resources/"+name;
}

//get direction name for dir tag
function getSimDir(dirTag) {
    return dirTag.substring(dirTag.lastIndexOf("_")+1, dirTag.length);
}

//check if all xmls are loaded 
function checkLoadingStatus() {
    if (allPredXML === undefined || vechLocXML === undefined || routeDataXML === undefined) {
        maxLoadingChecks = maxLoadingChecks-1;
    }
    else {
        doneLoading = true;
        createPage();
        lastRefreshComplete = true;
    }
}

//check if new route xml is loaded
function checkNewRouteLoadingStatus() {
    if (newRouteDataXML != oldRouteDataXML) {
        getBranchData();
        displayBranchData();
    }
    else {
        maxLoadingChecks = maxLoadingChecks-1
    }
}

//check if new predictions and vehicle locations xml is loaded
function checkUpdatePredictionsLoadingStatus() {
    if (allPredXML != oldAllPredXML && vechLocXML != oldVechLocXML) {
        getPredictions();
        displayPredictions();
        getBusCords();
        updateMapVehicleLocations();
        lastRefreshComplete = true;
    }
    else {
        maxLoadingChecks = maxLoadingChecks-1
    }
}

//check if new predictions are loaded for route update by ID (part 1 - predictions)
function checkUpdateByIdForPred() {
    if (allPredXML != oldAllPredXML) {
        clearInterval(loadingCheckerInterval);
    
        newStopTag = allPredXML.getElementsByTagName("predictions")[0].attributes.getNamedItem("stopTag").value;
        newRoute = allPredXML.getElementsByTagName("predictions")[0].attributes.getNamedItem("routeTag").value;
        
        stopTag = newStopTag;
        route = newRoute;
        
        oldRouteDataXML = routeDataXML;
        getData("stop");
                
        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkUpdateByIdForStop, 500); 
    }
    else {
        maxLoadingChecks = maxLoadingChecks-1;
    }
}

//check if new predictions are loaded for route update by ID (part 2 - route info)
function checkUpdateByIdForStop() {
    if (routeDataXML != oldRouteDataXML) {
        
        getBranchData();
        
        searchForRouteTag:
        for (var branch in branchData) {
            var branchStopList = branchData[branch]["stops"]
            
            for (var i = 0; i < branchStopList.length; i++) {
                if (branchStopList[i] === stopTag ) {
                    routeTag = branchData[branch]["tag"]
                    break searchForRouteTag;
                }
            }
        }
        
        newRouteTag = routeTag;
        getData("stop"); 
        getData("vech");
        getData("predStopId");
        
        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkLoadingStatus, 500); 
    }
    else {
        maxLoadingChecks = maxLoadingChecks-1
    }
}

//go button clicked
function goButtonClicked() {
    if ($("#routeSelect").val() != 0 && $("#routeSelect").val() != 0 && $("#stopSelect").val() != 0) {
        if ($(".inputStopId").val() == "") {
            console.log("GO BUTTON - selector");
            setUpNewRoute();
        }
        else {
            console.log("GO BUTTON - more than one field selected");
            $(".inputMessage").text("Only one field may be selected.");
        }
    }
    else if ($(".inputStopId").val() != "") {
        console.log("GO BUTTON - stop id");
        newStopId = $(".inputStopId").val();
        setUpNewRouteById();
    }
    else {
        console.log("GO BUTTON - no info entered");
        $(".inputMessage").text("No fields were selected");
    }
}

//clear route lines from map
function clearMap() {
    for (var i = 0; i < mapObjects.length; i++) {
        mapObjects[i].setMap(null);
    }
    mapObjects.length = 0;
}

//clear vehicles from map
function clearMapVehicles() {
    for (var i = 0; i < mapVehicleObjects.length; i++) {
        mapVehicleObjects[i].setMap(null);
    }
    mapVehicleObjects.length = 0;
}

//left pad number with zeros
function zeroFill(num, width) {
    width -= num.toString().length;
    num = num + "";
    for (i=0; i<width; i++) {
        num = "0"+num;
    }
    return num;
}

//add time
function getTimeString(epochTime) {
    
    var newDate = new Date(epochTime);

    var hours = newDate.getHours();
    var minutes = newDate.getMinutes();
    
    var ampm = hours >= 12 ? "PM" : "AM";
    
    hours = hours % 12;
    hours = hours==0 ? 12 : hours; 
    minutes = zeroFill(minutes, 2);
    
    var strTime = hours+":"+minutes+" " + ampm;
    
    return strTime;
}

//get compass direction
function getDirection(degree) {
    if (degree > 315 || degree <= 45) {
        return "north";
    }
    else if (degree > 45 && degree <= 135) {
        return "east";
    }
    else if (degree > 135 && degree <= 225) {
        return "south";
    }
    else if (degree > 225 && degree <= 315) {
        return "west";
    }
    else {
        return "undefined";
    }
}

//get direction of bus
function getBusDirection(dirTag) {
    curDir = branchData[dirTag]["name"].toLowerCase();
    return curDir+".png"
}

