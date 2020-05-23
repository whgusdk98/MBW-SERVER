var express = require('express');
var router = express.Router();//{mergeParams: true}
const authUtil = require('../module/authUtil');
const responseMessage = require('../module/responseMessage');
const statusCode = require('../module/statusCode');
const myPath = require('../model/addMyPathModel');
const openAPI = require('../module/openAPI');
const calcDistance = require('../model/calcDistance');
const authMiddleware = require('../module/authMiddleware');
const transCode = require('../model/getSubwayCode');


router.post('/', authMiddleware.validToken, async(req, res) => {
    
    let body = req.body;
    let path = body.path;
    console.log("바디");
    console.log(body);
    if(path == undefined){
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST, "request body형식이 옳지 않습니다."));
    }
    let subPath = path.subPath;
    if(subPath == undefined){
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST, "request body형식이 옳지 않습니다."));
    }
    console.log("바디.path");
    console.log(path);
    // Token 통해서 userIdx 취득
    const userIdx = req.decoded.userIdx;//클라는 로그인 시 받은 token값을 넘겨줄 것임

    if(!userIdx)
    {
        res.status(statusCode.BAD_REQUEST).send(authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.EMPTY_TOKEN));
        return;
    }

    let startLongi = Math.floor(body.startLongi*10000000)/10000000;
    let startLati = Math.floor(body.startLati*10000000)/10000000;
    let endLongi = Math.floor(body.endLongi*10000000)/10000000;
    let endLati = Math.floor(body.endLati*10000000)/10000000;

    try {
        let addMyPathResult = await myPath.addMyPath(body.startAddress, startLongi, startLati, body.endAddress, endLongi, endLati, userIdx);
        const myPathIdx = addMyPathResult.insertId;
        let addPathsResult = await myPath.addPaths(path.pathType, myPathIdx);//totaltime은 출력할 때 계산해서 넣어주기

        let count = -1;
        let startStName;
        let endStName;
        let startX = [];
        let startY = [];
        let endX = [];
        let endY = [];
        for (var i = 0; i < subPath.length; i++) {

            if (subPath[i].trafficType === 1) { //지하철
                count ++;
                let startSt = await transCode.transOdSayCode(subPath[i].startID);//db에서 subwayCode 찾기
                console.log(startSt);
                if (startSt.length == 0) {
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "db에서 해당 startID 지하철역을 찾을 수 없습니다.") 
                    });
                }
                let endSt = await transCode.transOdSayCode(subPath[i].endID);//db에서 subwayCode 찾기
                if (endSt.length == 0) {
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "db에서 해당 endID 지하철역을 찾을 수 없습니다.") 
                    });
                }

                let result = await openAPI.searchPubTransPath(startSt[0].x, startSt[0].y, endSt[0].x, endSt[0].y, 1);
                if (result == undefined) {
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "지하철 GPS값이 올바르지 않습니다.") 
                    });
                }
                let subway = result.path;
                if (subway == undefined) {
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "지하철 GPS값이 올바르지 않습니다.") 
                    });
                }
                for (var k = 0;k<subway.length;k++){
                    if(subway[k].info.subwayTransitCount != 1) continue;
                    if ((subway[k].subPath[1].startID == startSt[0].stationID) && (subway[k].subPath[1].endID == endSt[0].stationID)) {
                        var subwayJson = subway[k].subPath[1];
                        break;
                    }
                }
                if(k == subway.length){
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "ID와 일치하는 지하철이 없습니다.") 
                    });
                }
                let stopArray = subwayJson.passStopList.stations;
                if(subwayJson.startExitNo == undefined){var startExitNo = null;}//지하철에 출구 값들 없으면 null넣어줌
                else{startExitNo = subwayJson.startExitNo;}
                if(subwayJson.endExitNo == undefined){var endExitNo = null;}
                else{endExitNo = subwayJson.startExitNo;}

                //도보 계산할 때 필요
                startX.push(subwayJson.startX);
                startY.push(subwayJson.startY);
                endX.push(subwayJson.endX);
                endY.push(subwayJson.endY);

                let addSubwayResult = await myPath.addSubway(1, subwayJson.distance, subwayJson.sectionTime, subwayJson.stationCount, subwayJson.lane[0].subwayCode, subwayJson.startName, 
                    subwayJson.startX, subwayJson.startY, subwayJson.endName, subwayJson.endX, subwayJson.endY, subwayJson.wayCode, subwayJson.door, subwayJson.startID, startExitNo, endExitNo, stopArray, addPathsResult.insertId);
                if (addSubwayResult === false) throw ({ code: addSubwayResult.code, json: addSubwayResult.json });

                if(count == 1){
                    if(subPath.length == 3){
                        endStName = stopArray[stopArray.length-1].stationName;
                    }
                    startStName = stopArray[0].stationName;
                }
                else if(count == subPath.length-2){
                    endStName = stopArray[stopArray.length-1].stationName;
                }
            }
            

            else if (subPath[i].trafficType === 2) {//버스
                count ++;
                let stopArray = subPath[i].stations;
                let result = await openAPI.searchPubTransPath(subPath[i].startX, subPath[i].startY, subPath[i].endX, subPath[i].endY, 2);
                if (result == undefined) {
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "버스 정류장 GPS값이 올바르지 않습니다.") 
                    });
                }
                
                let bus = result.path;
                if (bus == undefined) {
                    throw ({ 
                        code: statusCode.BAD_REQUEST, 
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, "버스 정류장 GPS값이 올바르지 않습니다.") 
                    });
                }
                for (var k = 0;k<bus.length;k++){
                    if(bus[k].info.firstStartStation != subPath[i].startName) continue;
                    if(bus[k].info.lastEndStation != subPath[i].endName) continue;
                    if(bus[k].info.busTransitCount != 1) continue;
                    var j;
                    for(j = 0; j < bus[k].subPath[1].lane.length; j++){
                        if(bus[k].subPath[1].lane[j].busNo == subPath[i].busNo){
                            break;
                        }
                    }
                    if(j == bus[k].subPath[1].lane.length) continue;

                    var distance = bus[k].subPath[1].distance;
                    var sectionTime = bus[k].subPath[1].sectionTime;
                    var type = bus[k].subPath[1].lane[j].type;
                    var endID = bus[k].subPath[1].endID;
                    break;

                }
                
                let addBusResult = await myPath.addBus(2, distance, sectionTime, subPath[i].stationCount, subPath[i].startName, subPath[i].startX, subPath[i].startY, 
                    subPath[i].endName, subPath[i].endX, subPath[i].endY, subPath[i].startID, endID, subPath[i].busNo, type, stopArray, addPathsResult.insertId);
                if (addBusResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });

                //도보 계산할 때 필요
                startX.push(subPath[i].startX);
                startY.push(subPath[i].startY);
                endX.push(subPath[i].endX);
                endY.push(subPath[i].endY);


                if(count == 1){
                    if(subPath.length == 3){
                        endStName = subPath[i].endName;
                    }
                    startStName = subPath[i].startName;
                }
                else if(count == subPath.length-2){
                    endStName = subPath[i].endName;
                }
            }
            else {//도보 따로 계산
                count++;
            }
        }
        let walkTime;
        let walkDistance;
        
        for(var t= 0 ;t < startX.length;t++){
            console.log(startX[t]);
            console.log(startY[t]);
            console.log(endX[t]);
            console.log(endY[t]);
        }
        for(var c = 0;c < startX.length+1;c++){
            if(c == 0){//처음 도보
                walkDistance = await calcDistance.calcDistance(startLati,startLongi,startY[c],startX[c]); 
                walkTime = walkDistance / 70; //속력을 4.2km/h로 생각
            }
            else if(c == startX.length){//마지막 도보
                walkDistance = await calcDistance.calcDistance(endY[c-1],endX[c-1],endLati,endLongi); 
                walkTime = walkDistance / 70;
            }
            else {
                walkDistance = await calcDistance.calcDistance(endY[c-1],endX[c-1],startY[c],startX[c]); 
                walkTime = walkDistance / 70;
            }
            let addWalkResult = await myPath.addWalk(3, walkDistance, walkTime, addPathsResult.insertId);
            if (addWalkResult == false) throw ({ code: addWalkResult.code, json: addWalkResult.json });
            console.log('걷기 추가');
        }


        await myPath.addStMyPath('"'+startStName+'"', '"'+endStName+'"', myPathIdx);
        res.status(statusCode.OK).send(authUtil.successTrue(statusCode.OK, responseMessage.ADD_MY_PATH_SUCCESS, addMyPathResult.insertId));
    } 
    catch (exception) {
        console.log(exception);
        res.status(exception.code).send(exception.json);
    }
});

module.exports = router;