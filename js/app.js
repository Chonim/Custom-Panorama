var common = {
    map: null,
    center: {lat: 35.218471, lng: 126.844939},
    panorama: null,
    marker: null,
    markerArray: [],
    infoWindow: null,
    markerInfoWindow: null,
    admRegionLayer: new google.maps.Data(),
    useAreaLayer: new google.maps.Data(),
    kindLayer: new google.maps.Data(),
    initialize: function() {
        common.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: common.center
        });

        common.admRegionLayer.loadGeoJson('http://192.168.0.168:8887/js/gwangju.geojson');
        common.useAreaLayer.loadGeoJson('http://192.168.0.168:8887/js/NT_NT.geojson');
        common.kindLayer.loadGeoJson('http://192.168.0.168:8887/js/NT_NT.geojson');

        common.admRegionLayer.setStyle({ visible: false });
        common.useAreaLayer.setStyle({ visible: false });
        common.kindLayer.setStyle({ visible: false });

        common.admRegionLayer.setMap(common.map);
        common.useAreaLayer.setMap(common.map);
        common.kindLayer.setMap(common.map);

        var input = document.getElementById('pac-input');
        var autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', common.map);

        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                // User entered the name of a Place that was not suggested and
                // pressed the Enter key, or the Place Details request failed.
                // console.log("No details available for input: '" + place.name + "'");
                alert("목록에서 위치를 선택해 주세요");
                return;
            }

            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
                common.map.fitBounds(place.geometry.viewport);
            } else {
                common.map.setCenter(place.geometry.location);
                common.map.setZoom(17);  // Why 17? Because it looks good.
            }

            var address = '';
            if (place.address_components) {
                address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');
            }

        });

        for (var i in positions.row) {
            var row = positions.row[i];
            // console.log(row.lpi);

            var pinColor = lineObj.returnColor(row.lpi).replace("#","");
            console.log(pinColor);

            var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34));

            var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
            new google.maps.Size(40, 37),
            new google.maps.Point(0, 0),
            new google.maps.Point(12, 35));

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(row.coords[0], row.coords[1]),
                map: common.map,
                index: row.id,
                date: "2017년 7월 6일",
                lpi: row.lpi,
                icon: pinImage,
                shadow: pinShadow,
                title: row.title
            });
            common.markerArray.push(marker);

            common.markerInfoWindow = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(0,-20)
            });

            // Get a label of the clicked marker.
            marker.addListener('click', function(arg) {
                common.closeAllInfowindow();

                var content = "주소: " + this.title + "<br />" +
                "촬영일시: " + this.date + "<br />" +
                "휘도: " + this.lpi + "<br />" +
                "<img src='http://104.199.133.107/samples/panorama_new/images/streetview.png' onclick='common.openPano(" + this.index +
                ")' style='width: 30px; height: 30px; margin-left: 120px;'>";
                common.markerInfoWindow.setContent(content);
                common.markerInfoWindow.setPosition(arg.latLng);
                common.markerInfoWindow.open(common.map);
            });
        }
        common.map.addListener('zoom_changed', lineObj.controlLineVisibility);
    },
    openPano: function(index) {
        common.hideMapOptions();
        common.initPano(index);
        common.panorama.setVisible(true);
    },
    showMapOptions: function() {
        document.getElementById('toc').style.visibility = "visible";
        document.getElementById('legend').style.visibility = "visible";
        common.panorama = null;
    },
    hideMapOptions: function() {
        document.getElementById('toc').style.visibility = "hidden";
        document.getElementById('legend').style.visibility = "hidden";
    },
    showMarkers: function() {
        for (var i in common.markerArray) {
            common.markerArray[i].setVisible(true);
        }
    },
    hideMarkers: function() {
        for (var i in common.markerArray) {
            common.markerArray[i].setVisible(false);
        }
    },
    markerToggle: function() {
        if (document.getElementById('markerLayer').checked) {
            common.showMarkers();
        } else {
            common.hideMarkers();
            common.markerInfoWindow.close();
        }
    },
    closeAllInfowindow: function() {
        if (common.markerInfoWindow !== null) {
            common.markerInfoWindow.close();
        }
        if (lineObj.lineinfoWindow !== null) {
            lineObj.lineinfoWindow.close();
        }
        if (lineObj.useAreaInfowindow !== null) {
            lineObj.useAreaInfowindow.close();
        }
        if (lineObj.kindInfowindow !== null) {
            lineObj.kindInfowindow.close();
        }
    },
    initPano: function(pano) {
        // Set up Street View and initially set it visible. Register the
        // custom panorama provider function. Set the StreetView to display
        if (common.panorama !== null) {
            common.panorama = null;
        }
        common.panorama = new google.maps.StreetViewPanorama(
            document.getElementById('map'), {
                pano: pano.toString(),
                visible: false,
                // addressDateControl: true,
                panControl: true,
                enableCloseButton: true,
                panoProvider: common.getCustomPanorama
                // enableCloseButton: true
            }
        );

        google.maps.event.addListener(common.panorama, "links_changed", common.createCustomLink);
        google.maps.event.addListener(common.panorama, "pov_changed", common.getPov);
        google.maps.event.addListener(common.panorama, "closeclick", common.showMapOptions);

        common.repositionDot();
    },
    // Return a pano image given the panoID.
    getCustomPanoramaTileUrl: function(pano) {
        return positions.row[pano].url;
    },
    // Construct the appropriate StreetViewPanoramaData given
    // the passed pano IDs.
    getCustomPanorama: function(pano) {
        return {
            location: {
                pano: pano,
                description:
                "주소: " + positions.row[pano].title

            },
            links: [],
            // The definition of the tiles for this panorama.
            tiles: {
                // tileSize: new google.maps.Size(1024, 512),
                // worldSize: new google.maps.Size(1024, 512),
                tileSize: new google.maps.Size(1024, 512),
                worldSize: new google.maps.Size(2048, 1024),
                // The heading in degrees at the origin of the panorama tile set.
                centerHeading: 180,
                getTileUrl: common.getCustomPanoramaTileUrl
            }
        };
    },
    createCustomLink: function() {
        var links = common.panorama.getLinks();
        var panoID = common.panorama.getPano();

        var row = positions.row[panoID];
        var newPosition = new google.maps.LatLng(row.coords[0], row.coords[1]);
        var linkElements = row.links;

        for (var i in linkElements) {
            links.push({
                description : linkElements[i].description,
                pano : linkElements[i].pano,
                heading :linkElements[i].heading
            });
        }

        common.map.setCenter(newPosition);
    }
};

google.maps.event.addDomListener(window, 'load', common.initialize);
