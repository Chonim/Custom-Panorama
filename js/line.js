var lineObj = {
    isLineOn: false,
    minZoom: 14,
    lineCoordinatesArray : [],
    lineColorArray: [],
    infoWindow: null,
    lineArray: [],
    avgArray: [],
    maxArray: [],
    useAreaOpacity: 0.5,
    lineinfoWindow: null,
    useAreaInfowindow: null,
    kindInfowindow: null,
    colorArray: [
        '#00e600',
        '#99ff66',
        '#ffff66',
        '#ff9966',
        '#ff0066',
    ],
    chooseColor: function(cd) {
        if (cd === 'UQA111' || cd === 'UQA119' || cd === 'UQA121' || cd === 'UQA129' || cd === 'UQA190') {
            return 'rgb(255,255,102)';
        } else if (cd === 'UQA112' || cd === 'UQA122' || cd === 'UQA130') {
            return 'rgb(255,255,0)';
        } else if (cd === 'UQ123') {
            return 'rgb(255,204,0)';
        } else if (cd === 'UQA210' || cd === 'UQA220' || cd === 'UQA230' || cd === 'UQA240' || cd === 'UQA290') {
            return 'rgb(255,102,204)';
        } else if (cd === 'UQA310' || cd === 'UQA320' || cd === 'UQA330' || cd === 'UQA390') {
            return 'rgb(204,102,255)';
        } else if (cd === 'UQA410' || cd === 'UQA420' || cd === 'UQA430' || cd === 'UQA490') {
            return 'rgb(204,255,102)';
        } else if (cd === 'UQA500' || cd === 'UQA999' || cd === 'UQA000' || cd === 'UQA001') {
            return 'rgb(253,71,88)';
        } else {
            return 'blue';
        }
    },
    chooseKindColor: function(kind) {
        if (kind === '1') {
            return 'blue';
        } else if (kind === '2') {
            return 'green';
        } else if (kind === '3') {
            return 'yellow';
        } else if (kind === '4') {
            return 'red';
        } else {
            return 'white';
        }
    },
    calcAvg: function(index) {
        var prevLpi = lineObj.lineColorArray[index-1];
        var currentLpi = lineObj.lineColorArray[index];
        var avgLpi = (prevLpi + currentLpi)/2;
        if (typeof avgLpi !== "undefined") {
            lineObj.avgArray.push(avgLpi);
            lineObj.maxArray.push(Math.max(prevLpi, currentLpi));
            return lineObj.returnColor(avgLpi);
        }
    },
    returnColor: function(index) {
        if (index <= 20) {
            return lineObj.colorArray[0];
        } else if (index <= 40) {
            return lineObj.colorArray[1];
        } else if (index <= 60) {
            return lineObj.colorArray[2];
        } else if (index <= 80) {
            return lineObj.colorArray[3];
        } else {
            return lineObj.colorArray[4];
        }
    },
    showLines: function() {
        if (lineObj.lineArray.length === 0) {
            for (var i in positions.row) {
                var row = positions.row[i];
                lineObj.lineCoordinatesArray.push({lat: row.coords[0], lng: row.coords[1]});
                if (i < positions.row.length) {
                    lineObj.lineColorArray.push(row.lpi);
                }
            }

            var len = lineObj.lineCoordinatesArray.length;
            var count = 1;
            for (var j = 0; j<len-1; j+=1) {
                var currentCoords = lineObj.lineCoordinatesArray[j];
                var waypoints = positions.row[j].waypoints;
                var nextCoords = lineObj.lineCoordinatesArray[count];

                var totalPath = [];
                totalPath.push(currentCoords);
                if (waypoints.length !== 0) {
                    for (var k in waypoints) {
                        totalPath.push(waypoints[k]);
                    }
                }
                totalPath.push(nextCoords);

                var linePath = new google.maps.Polyline({
                    path: totalPath,
                    geodesic: true,
                    strokeColor: lineObj.calcAvg(count),
                    strokeOpacity: 1.0,
                    strokeWeight: 6,
                    visible: false,
                    zIndex: 1
                });

                // Set infoWindow
                var roadName = positions.row[count].roadName;
                linePath.roadName = roadName;
                linePath.num = count-1;
                linePath.setMap(common.map);
                lineObj.lineArray.push(linePath);

                lineObj.lineinfoWindow = new google.maps.InfoWindow({
                    content: ""
                });

                linePath.addListener('click', function(arg) {
                    common.closeAllInfowindow();

                    var content = "도로명: " + this.roadName + "<br />" +
                    "최고휘도: " + lineObj.maxArray[this.num] + "<br />" +
                    "평균휘도: " + lineObj.avgArray[this.num];
                    lineObj.lineinfoWindow.setContent(content);
                    lineObj.lineinfoWindow.setPosition(arg.latLng);
                    lineObj.lineinfoWindow.open(common.map);

                });

                count++;
            }

            lineObj.isLineOn = true;

            if (common.map.getZoom() >= lineObj.minZoom) {
                for (var l in lineObj.lineArray) {
                    lineObj.lineArray[l].setVisible(true);
                }
            }
        } else {
            if (common.map.getZoom() >= lineObj.minZoom) {
                for (var i in lineObj.lineArray) {
                    lineObj.lineArray[i].setVisible(true);
                }
            }
        }
    },
    hideLines: function() {
        for (var i in lineObj.lineArray) {
            lineObj.lineArray[i].setVisible(false);
        }
        lineObj.lineinfoWindow.close();
    },
    lineToggle: function() {
        if (document.getElementById('lineLayer').checked) {
            lineObj.showLines();
            lineObj.isLineOn = true;
        } else {
            lineObj.hideLines();
            lineObj.isLineOn = false;
        }
    },
    controlLineVisibility: function() {
        if (lineObj.lineArray.length > 0 && lineObj.isLineOn === true) {
            if (common.map.getZoom() >= lineObj.minZoom) {
                lineObj.showLines();
            } else {
                lineObj.hideLines();
            }
        }
    },
    polygonToggle: function() {
        if (document.getElementById('polygonLayer').checked) {
            common.admRegionLayer.setStyle({
                visible: true,
                strokeColor: 'red',
                strokeWeight: 2,
                fillOpacity: 0,
                zIndex: 1,
                cursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur) 8 8, default'
            });

        } else {
            common.admRegionLayer.setStyle({visible: false});
        }
    },
    useAreaToggle: function() {
        if (document.getElementById('useAreaLayer').checked) {
            common.useAreaLayer.setStyle(function(feature) {
                var useCd = feature.getProperty('USE_CD');
                return ({
                    visible: true,
                    strokeColor: 'white',
                    strokeWeight: 0,
                    fillColor: lineObj.chooseColor(useCd),
                    fillOpacity: lineObj.useAreaOpacity,
                    zIndex: 0,
                    cursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur) 8 8, default'
                });
            });

            lineObj.useAreaInfowindow = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(0,-20)
            });

            common.useAreaLayer.addListener('click', function(event) {
                common.closeAllInfowindow();

                var content = "용도지구: " + event.feature.getProperty('USE_CD');
                lineObj.useAreaInfowindow.setContent(content);
                lineObj.useAreaInfowindow.setPosition(event.latLng);
                lineObj.useAreaInfowindow.open(common.map);
            });
        } else {
            common.useAreaLayer.setStyle({visible: false});
            lineObj.useAreaInfowindow.close();
            lineObj.useAreaInfowindow = null;
        }
    },
    changeUseAreaOpacity: function(index) {
        if (common.useAreaLayer.getStyle().visible !== false) {
            lineObj.useAreaOpacity = index;
            common.useAreaLayer.setStyle(function(feature) {
                var useCd = feature.getProperty('USE_CD');
                return ({
                    visible: true,
                    strokeColor: 'white',
                    strokeWeight: 0,
                    fillColor: lineObj.chooseColor(useCd),
                    fillOpacity: lineObj.useAreaOpacity,
                    zIndex: 0,
                    cursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur) 8 8, default'
                });
            });
        }
    },
    kindToggle: function() {
        if (document.getElementById('kindLayer').checked) {
            common.kindLayer.setStyle(function(feature) {
                var kind = feature.getProperty('KIND');
                return ({
                    visible: true,
                    strokeColor: 'white',
                    strokeWeight: 0,
                    fillColor: lineObj.chooseKindColor(kind),
                    fillOpacity: 0.5,
                    zIndex: 0,
                    cursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur) 8 8, default'
                });
            });

            lineObj.kindInfowindow = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(0,-20)
            });

            common.kindLayer.addListener('click', function(event) {
                common.closeAllInfowindow();

                var content = "조명환경관리구역: " + event.feature.getProperty('KIND');
                lineObj.kindInfowindow.setContent(content);
                lineObj.kindInfowindow.setPosition(event.latLng);
                lineObj.kindInfowindow.open(common.map);
            });
        } else {
            common.kindLayer.setStyle({visible: false});
            lineObj.kindInfowindow.close();
            lineObj.kindInfowindow = null;
        }
    },
    showKindLayer: function() {

    }
};
