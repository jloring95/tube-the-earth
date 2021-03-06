$(document).ready(function() {

    /////////////////////////////////////////////////////BIG VARIABLES/////////////////////////////////////////////////////
    
        var userThumbnailArray = [];
        var userThumbnailPath;
        var popularThumbnailArray = [];
        var popularThumbnailPath;
        var userAddress = "";
        var urlGoogle = "https://maps.googleapis.com/maps/api/geocode/json";
        var apiKeyGoogle = "AIzaSyCXz3ctOfdCYgcEHTokEyM5Dso_kiMJDeY";
        var urlYoutube = "https://www.googleapis.com/youtube/v3/search";
        var apiKeyYoutube = "AIzaSyC3hyycsztOR8N1flGac1ocYQF1PGt6F6M";
        var popularSearchArray = [];
        var j = 0;
    
    /////////////////////////////////////////////////////FIREBASE/////////////////////////////////////////////////////
    
        var config = {
            apiKey: "AIzaSyB4FzGqNZs6sYG5wsokxnFHJJutJSdbLTY",
            authDomain: "tube-the-earth.firebaseapp.com",
            databaseURL: "https://tube-the-earth.firebaseio.com",
            projectId: "tube-the-earth",
            storageBucket: "",
            messagingSenderId: "686431765231"
        };
    
        firebase.initializeApp(config);
        var database = firebase.database();
    
    ///////////////////////////////////////////////GLOBAL FUNCTIONS/////////////////////////////////////////////////////
    
    function mapsAjax(address, urlGoogle) {
        return new Promise(function(resolve, reject) {
            if (geocoder) {
                geocoder.geocode({ 'address': address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var lat = results[0].geometry.location.lat();
                        var lng = results[0].geometry.location.lng();
                        resolve({
                            lat: lat,
                            lng: lng
                        });
                    }
                    else {
                        reject("Geocoding failed: " + status);
                    }
                });
            } else {
                reject('no geocoder');
            }
        });
    }
    
    function youtubeAjax(urlYoutube) {
        return $.ajax({
            url: urlYoutube,
            method: "GET"
        })
    }
    
    ////////////////ANYTIME A NEW ITEM IS ADDED TO THE DATABASE, AND ON LOAD////////////////
    
    database.ref().on("child_added", function(snapshot) {
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        function loadFromDatabase(snapshot) {
            snapshot.forEach(function(childSnapshot) { //for each child in database...
                var popularSearchItem = childSnapshot.val(); //grab value
                popularSearchArray.push(popularSearchItem)
                $("#history1").html(popularSearchArray[0])
                $("#history2").html(popularSearchArray[1])
                $("#history3").html(popularSearchArray[2])
                $("#history4").html(popularSearchArray[3])
                var newMapsURL = urlGoogle;
                newMapsURL += "?" + $.param({ //convert each location in database to lat/long; modify URL lookup for each item in database
                    'address': popularSearchItem,
                    'key': apiKeyGoogle
                });

                mapsAjax(popularSearchItem, newMapsURL) //call to google maps API to grab data for each item in database
                .then (function(results) {
                    var lat = results.lat;
                    var long = results.lng;
                    
                    var newYoutubeURL = urlYoutube;
                    newYoutubeURL += "?" + $.param({ //modify youtube API url for each location item in database
                        'type': 'video',
                        'maxResults': 1,
                        'part': 'snippet',
                        'videoEmbeddable': true,
                        'location': lat + "," + long,
                        'locationRadius': '10mi',
                        'key': apiKeyYoutube,
                        'chart': 'mostPopular'
                    })
                    youtubeAjax(newYoutubeURL) //call to youtube api to grab data for each item in database
                    .then (function(response) {
                        console.log(response)
                        popularThumbnailPath = response.items[0].snippet.thumbnails.default.url;
                        console.log(popularThumbnailPath)
                        var popularThumbnail = $("<img class='popular-thumbnail'>");
                        popularThumbnail.attr("src", popularThumbnailPath); //assign src for thumbnail img
                        console.log(popularThumbnail)
                        popularThumbnailArray.push(popularThumbnail); //push thumbnail to array
                        if (popularThumbnailArray.length >= 6) {
                            //popularThumbnailArray.shift(); ///////////////////////////////////////////////////////
                            $("#historyDiv").html(popularThumbnailArray)
                        }
                        else {
                            $("#historyDiv").html(popularThumbnailArray); //push updated contents of thumbnail array to page
                        }
                    })
                })
            })
        }
    
        loadFromDatabase(snapshot);        

    });

    
    
    ////////////////ON SEARCH BUTTON CLICK...////////////////

    
    $("#submit").on("click", function() {
        userThumbnailArray = [];
        userAddress = $("#address").val().trim();
        event.preventDefault();
        $("#history1").html(popularSearchArray[j + 4])
        $("#history2").html(popularSearchArray[j + 3])
        $("#history3").html(popularSearchArray[j + 2])
        $("#history4").html(popularSearchArray[j + 1])
        popularSearchArray.shift();
        popularSearchArray.splice(0, 1);
        j++
        function saveSearch() {
            database.ref().push({
                userAddress: userAddress, //save each new location entered by user to database
            });
    
            urlGoogle += "?" + $.param({  //modify URL grab data for that location
                'address': userAddress,
                'key': apiKeyGoogle
            });
    
            mapsAjax(userAddress, urlGoogle) //convert location to lat/long

            .then (function(results) {
                var lat = results.lat;
                var long = results.lng;
                urlYoutube += "?" + $.param({ 
                    'type': 'video',
                    'maxResults': 5,
                    'part': 'snippet',
                    'videoEmbeddable': true,
                    'location': lat + "," + long,
                    'locationRadius': '10mi',
                    'key': apiKeyYoutube, //grab youtube thumbnail based on lat/long
                    'chart': 'mostPopular'
                });

                youtubeAjax(urlYoutube)
                .then (function(response) {
                    $("#user-results").empty();

                    for (var i=0; i<5; i++) { //push 5 video thumbnails pertaining to user's searched location to page
                        var userThumbnailPath = response.items[i].snippet.thumbnails.default.url;
                        var userThumbnail = $("<img class='user-thumbnail'>");
                        userThumbnail.attr("src", userThumbnailPath);
                        userThumbnailArray.push(userThumbnail);
                        console.log(response.items[i])                        
                        }
                    $("#user-results").append(userThumbnailArray);
                });
            });
        }
        saveSearch();
    }); 
    })