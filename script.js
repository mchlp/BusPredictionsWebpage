
var lastReloadTime;
var lastRefreshComplete = false;

var newRouteReady = false;
var doneLoading = false;
var maxLoadingChecks;
var loadingCheckerInterval;

var mapObjects = [];

var allPredXML;
var vechLocXML;
var routeDataXML;
var allRouteDataXML;
var newRouteDataXML;
var oldRouteDataXML;

var predURL;
var vechURL;
var stopURL;

var allRouteData = [];
var routeCords = [];
var busData = [];
var branchData = [];
var stopData = [];
var newStopData = [];
var predData = [];
var routeColour = "ff0000";
var oppRouteColour = "ffffff";

var stopLocation = [];
var route = "";
var newRoute = "17";
var routeTag = "";
var newRouteTag = "17_0_17A";
var stopTag = "";
var newStopTag = "1638"

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
    var buttonID = this.id;
    if (buttonID == "refresh") {
        if (lastRefreshComplete) {
            setUpNewRoute();
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
        newStopTag = "1638";
        setUpNewRoute();
    }
}

//route select changed
function selectChange() {
    console.log(this.id);
    var selectID = this.id;
    
    if (selectID == "routeSelect") {
        newRoute = $("#routeSelect").val();
        oldRouteDataXML = newRouteDataXML;
        
        getData("new");
        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkNewRouteLoadingStatus, 500);
    }
    
    if (selectID == "branchSelect") {
        newRouteTag = $("#branchSelect").val();
        getStopData("new");
        displayStopData();
    }
    
    if (selectID == "stopSelect") {
        newStopTag = $("#stopSelect").val();
    }
}

//new route chosen
function setUpNewRoute() {
    
    now = new Date().getTime();
    
    //prevent page from being reloaded too quickly (will cause page to crash)
    if (Math.abs(lastReloadTime-now) > 500 || isNaN(lastReloadTime-now)) {
        $("#progress").show();
    
        //set last reload time
        lastReloadTime = now;
        
        //set reload complete flag to false
        lastRefreshComplete = false;
        
        //loading message 
        $("message").text("Loading...").show();

        //check for resource loading & timeout
        window.setTimeout(displayLoadingMessage, 3000);
        
        //set route settings
        routeTag = newRouteTag;
        stopTag = newStopTag;
        route = newRoute;

        getData("stop"); 
        getData("vech");
        getData("pred");

        maxLoadingChecks = 5;
        loadingCheckerInterval = setInterval(checkLoadingStatus, 500); 
    }
};

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

    $("#message").hide();
    doneLoading = true;
    
    $("#routeSelect")[0].value = route;
    $("#branchSelect")[0].value = routeTag;
    $("#stopSelect")[0].value = newStopTag;
    
    createMap();
    
    $("#progress").hide();
    lastRefreshComplete = true;
}

//create map
function createMap() {
    //clear map
    $("#map").html("");
    clearMap();
    
    //properties
    var defaultZoom = 14;

    //map
    var mapCenter = new google.maps.LatLng(stopLocation[0], stopLocation[1])
    var mapCanvas = document.getElementById("map");
    var mapProp = {
        center: mapCenter,
        zoom: defaultZoom,
        streetViewControl: false
    };
    var map = new google.maps.Map(mapCanvas, mapProp);
    
    //stop marker
    var stopMarkerProp = {
        position: mapCenter,
        //icon: getResource("bus-station.svg")
        //animation: google.maps.Animation.BOUNCE
    }
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
        }
        var routeLine = new google.maps.Polyline(routeLineProp);
        routeLine.setMap(map);
        mapObjects.push(routeLine);
    }
    
    //bus locations
    for (var i=0; i<busData.length; i++) {
    
        var curBus = busData[i];
        var icon = getResource(getBusDirection(curBus["dirTag"]));
        
        var busMarkerProp = {
            position: busData[i]["coord"],
            //icon: getResource("bus-station.png"),
            icon: icon,
            title: busData[i]["id"]
            //animation: google.maps.Animation.BOUNCE
        }
        var busMarker = new google.maps.Marker(busMarkerProp);
        busMarker.setMap(map);
        mapObjects.push(busMarker);
    }
    
    //click on marker to reset zoom
    google.maps.event.addListener(stopMarker, 'click', function() {
        map.setZoom(defaultZoom);
        map.setCenter(stopMarker.getPosition());
    });
    
    routeCords.length = 0;
    busData.length = 0; 
}

//get all routes
function getAllRoutes() {
    getDataList = ["tag", "title"]
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
        curRouteData = allRouteData[i]
        $("#routeSelect").append($("<option>", {
            value: curRouteData["tag"],
            text: curRouteData["title"]
        }));
    }
}

//get a list of the predictions
function getPredictions() {
    predData.length = 0;
    
    var getDataList = ["isDeparture", "branch", "dirTag", "vehicle", "block", "tripTag"];
    
    allPredBranches = allPredXML.getElementsByTagName("direction")
    
    for (var i = 0; i < allPredBranches.length; i++) {
        curPredBranch = allPredBranches[i];
        curPredBranchData = [];
        curPredBranchData["title"] = curPredBranch.attributes.getNamedItem("title");
        
        curPredBranchPredictions = []
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
        predData.push(curPredBranchData);
    }
    
    
    
}

//display list of predictions
function displayPredictions() {
    $("#predictions").empty();

    for (var i=0; i<predData.length; i++) {
    
        curDisplayPredBranch = predData[i];
        
        curDisplayPredBranchTitle = predData[i]["title"].nodeValue;
        curDisplayPredBranchPredictions = predData[i]["predictions"];
        
        $("<h3></h3>").html(curDisplayPredBranchTitle).appendTo("#predictions");
       
        for (var j=0; j<curDisplayPredBranchPredictions.length; j++) {
            curPredData = curDisplayPredBranchPredictions[j]
            $("<li></li>").html(curPredData["branch"] + " - " + curPredData["vehicle"] + " - in " + 
                curPredData["minutes"] + " min " + curPredData["seconds"] + " sec - " + 
                curPredData["timeStr"]).appendTo("#predictions");
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
    newStopData = []

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
function displayStopData() {
    
    var curBranch = branchData[newRouteTag];
    curBranchStopList = curBranch["stops"];

    $("#stopSelect").empty();
    
    $("#stopSelect").append($("<option>", {
        value: 0,
        text: "Select Stop"
    }));
    
    for (var i = 0; i<curBranchStopList.length; i++) {
        curBranchStopTag = curBranchStopList[i]
        curBranchStop = newStopData[curBranchStopTag];
        $("#stopSelect").append($("<option>", {
            value: curBranchStop["tag"],
            text: curBranchStop["title"]
        }));
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
    
    for (var i=0; i<allVech.length; i++) {
        var vech = allVech[i]
        if (vech.attributes.getNamedItem("predictable").nodeValue == "true") {
            curVechData = [];
        
            for (var j=0; j<getDataList.length; j++) {
                //console.log(getDataList[j]);
                curVechData[getDataList[j]] = vech.attributes.getNamedItem(getDataList[j]).nodeValue;   
            }
            
            curVechData["simDir"] = getSimDir["dirTag"];
            curVechData["coord"] = new google.maps.LatLng(curVechData["lat"], curVechData["lon"]);
            busData.push(curVechData);
        }
    }
}

//convert data in xml format
function parseXML(data, type) {
    console.log(data, type);
    switch (type) {
        case "stop":
            routeDataXML = data;
            newRouteDataXML = data;
            newRouteReady = true;
            break;
        case "vech":
            vechLocXML = data;
        	break;
        case "pred":
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

//old function
function readXML(data){
    var xmlDoc = data.responseXML;
    $("#refresh").click(function(){
        //alert(xmlDoc);
        allPreds = xmlDoc.getElementsByTagName("prediction");
        $("#stops").empty();
        for (var i=0; i<allPreds.length; i++) {
            min = allPreds[i].attributes.getNamedItem("minutes").nodeValue;
            sec = allPreds[i].attributes.getNamedItem("seconds").nodeValue;
            sec = sec%60;
            busName = allPreds[i].attributes.getNamedItem("dirTag").nodeValue;
            busName = busName.substring(busName.lastIndexOf("_")+1, busName.length);
            busNum = allPreds[i].attributes.getNamedItem("vehicle").nodeValue;
            $("<li></li>").html(busName + " - " + busNum + " - " + min + ":" + sec).appendTo("#stops");
        }
    });
    getData();
}

//get data from NextBus servers
function getData(type, id){

    var url;
    
    switch (type) {
        case "stop":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r="+route+"&verbose";
            break;
        case "vech":
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r="+route;
            break;
        case "pred":
            //url = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId="+stopID;
            url = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&r="+route+"&s="+stopTag;
            //url = "https://www.nextbus.com/api/pub/v1/agencies/ttc/routes/17/stops/1638/predictions?coincident=true&direction=17_0_17A&key=7141fa6118803c15751f29743cb974ab&timestamp=1489868202701";
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
function displayLoadingMessage() {
    if (!doneLoading) {
        $("#message").text("Data could not be retrieved.");
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

//go button clicked
function goButtonClicked() {
    if ($("#routeSelect").val() != 0 && $("#routeSelect").val() != 0 && $("#stopSelect").val() != 0) {
        setUpNewRoute();
    }
}

//clear route lines from map
function clearMap() {
    for (var i = 0; i < mapObjects.length; i++) {
        mapObjects[i].setMap(null);
    }
    mapObjects.length = 0;
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
    console.log(dirTag);    console.log(branchData);
    curDir = branchData[dirTag]["name"].toLowerCase();
    return curDir+".png"
}

