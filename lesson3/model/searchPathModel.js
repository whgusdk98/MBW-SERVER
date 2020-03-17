const openAPI = require('../module/openAPI');
const authUtil = require('../module/authUtil');
const responseMessage = require('../module/responseMessage');
const statusCode = require('../module/statusCode');
const elevator = require('./elevatorModel');
const publicSubwayCode = require('./getSubwayCode');
const myPath = require('./getMyPathModel');
const problemArea = require('./problemAreaModel');

exports.setPathType = function(pathType, result){//path 지울 때 pathType 개수 재설정
    if(pathType == 1){//지하철만
        result.subwayCount --;
    }
    else if(pathType == 2){//버스만
        result.busCount --;
    }
    else if(pathType == 3){//지하철+버스 둘다 포함하는 경로 
        result.subWayBusCount --;
    }
}

exports.copyObj = function(obj) { //js에서 객체 복사함수
    var copy = {};
    if (Array.isArray(obj)) {
        copy = obj.slice().map((v) => {
        return this.copyObj(v);
        });
    } else if (typeof obj === 'object' && obj !== null) {
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
            copy[attr] = this.copyObj(obj[attr]);
            }
        }
    } else {
        copy = obj;
    }
    return copy;
}

module.exports = {
    searchPath: async (SX, SY, EX, EY, SearchPathType) => {        //, busFilter

        let result = await openAPI.searchPubTransPath(SX, SY, EX, EY, SearchPathType);
        if (result == undefined) {
            return({
                code: statusCode.BAD_REQUEST,
                json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.FIND_PATH_FAILED)
            });
        }

        let path = result.path;
        if(path == undefined) {
            return({
                code: statusCode.BAD_REQUEST,
                json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.FIND_PATH_FAILED)
            });
        }
        

        let n = 0;
        //시작과 끝이 300m내에 myPath db에 존재하는 것이 있을 경우// 일단 하나만 보여주도록
        let myPathResult = await myPath.getMyPath(SX, SY, EX, EY, null, null, 1)
        if(myPathResult !=undefined){
            //console.log(myPathResult); console.log(myPathResult.pathType);
            if(SearchPathType == 0){
                if(myPathResult.pathType == 3){
                    result.subwayBusCount++;
                }
                else if(myPathResult.pathType == 1){
                    result.subwayCount++;
                }
                else { result.busCount++; }
                myPathResult.group = 3;//나만의 경로: 아예 시작과 끝 반경 내 존재
                path.unshift(myPathResult);
            }
            else if(SearchPathType == 1 && myPathResult.pathType == 1){
                result.subwayCount++;
                myPathResult.group = 3;//나만의 경로: 아예 시작과 끝 반경 내 존재
                path.unshift(myPathResult);
            }
            else if(SearchPathType == 2 && myPathResult.pathType == 2){
                result.busCount++;
                myPathResult.group = 3;//나만의 경로: 아예 시작과 끝 반경 내 존재
                path.unshift(myPathResult);
            }
            n = 1;
        }
        //console.log(path);
        //console.log(path[0].subPath);
        //console.log(path[0]);



        let categoryBool = 1;
        let test = 0;
        let test2 = 0;
        for (var i = 0; i < path.length; i++) {
            let totalWalkTime = 0;
            let count = 0;
            let pathDelete = 0;
            test2++;
            if(test2 == 25){
                console.log("path호출횟수 초과");
                return({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, "호출횟수 비정상적")
                });
                //break;
            }
            if(path[i].group == undefined){ path[i].group = 1;}//odsay에서 가져온 일반 경로일때


            //환승이 3번 이상이면 경로에서 빼기
            if(path[i].subPath.length >= 9){
                this.setPathType(path[i].pathType, result);
                path.splice(i,1);
                pathDelete = 1;
                i--;
                continue;
            }



            //대중교통 시작 끝 같을때
            if(n == 1){n = 0;}
            else if(n != 1){
                let myPathTransResult = await myPath.getMyPath(null, null, null, null, '"'+path[i].info.firstStartStation+'"', '"'+path[i].info.lastEndStation+'"', 2);
                if(myPathTransResult != undefined){
                    if(SearchPathType == 0){
                        if(myPathTransResult.pathType == 3){
                            result.subwayBusCount++;
                        }
                        else if(myPathTransResult.pathType == 1){
                            result.subwayCount++;
                        }
                        else { result.busCount++; }
                        myPathTransResult.group = 2;//
                        path.splice(i,0,myPathTransResult);
                    }
                    else if(SearchPathType == 1 && myPathTransResult.pathType == 1){
                        result.subwayCount++;
                        myPathTransResult.group = 2;//
                        path.splice(i,0,myPathTransResult);
                    }
                    else if(SearchPathType == 2 && myPathTransResult.pathType == 2){
                        result.busCount++;
                        myPathTransResult.group = 2;//
                        path.splice(i,0,myPathTransResult);
                    }
                    n = 1; //추천 경로 추가 후 원래 경로가 반복되는 일 막기 위해...
                    test++;
                    if(test == 15){
                        console.log("위험");
                        console.log(test);
                        return({
                            code: statusCode.BAD_REQUEST,
                            json: authUtil.successFalse(statusCode.BAD_REQUEST, "호출횟수 비정상적")
                        });                        
                    }
                }
            }
            /********* */

            
            
            let sumSectionTime = 0;
            let busTransitCount = 0;
            let subwayTransitCount = 0;
            for (var j = 0; j < path[i].subPath.length; j++) {
                sumSectionTime += path[i].subPath[j].sectionTime;
                if (path[i].subPath[j].trafficType == 3) {//하나의 경로의 총 도보시간
                    totalWalkTime += path[i].subPath[j].sectionTime;
                    continue;
                }
                else {
                    count += 1;
                }


                if(path[i].subPath[j].trafficType === 1) {//지하철일 경우 엘리베이터 정보 추가
                    subwayTransitCount++;

                    let code = (await publicSubwayCode.find(path[i].subPath[j].lane[0].subwayCode)).json;  
                    path[i].subPath[j].lane[0].publicCode = code[0].potalCode;

                    if(path[i].subPath[j].startExitX != undefined && path[i].subPath[j].startExitNo ==undefined){//을지로입구역의 경우 출구좌표는 있는데 번호가 없어서 밑 if문에서 걸러지지 않음,,
                        path[i].subPath[j].startExitNo = "0";
                    }
                    if(path[i].subPath[j].endExitX != undefined && path[i].subPath[j].endExitNo ==undefined){//을지로입구역의 경우 출구좌표는 있는데 번호가 없어서 밑 if문에서 걸러지지 않음,, 임의로 넣어주자
                        path[i].subPath[j].endExitNo = "0";
                    }


                    /******** 환승없는 경우 *******/
                    if(path[i].subPath[j].startExitNo != undefined && path[i].subPath[j].endExitNo != undefined && path[i].subPath[j].startExitNo != null && path[i].subPath[j].endExitNo != null){//환승없이 한 노선만 사용
                        //시작역의 입구와 마지막 역의 출구 엘베정보
                        categoryBool = 1;
                        path[i].subPath[j].startElevatorInfo = [];
                        path[i].subPath[j].endElevatorInfo = [];

                        /////////////findProblemArea//////////
                        let problemResult = await problemArea.read(path[i].subPath[j].lane[0].subwayCode, path[i].subPath[j].startName,0);
                        if(problemResult.length != 0){//지하철 처음 역이 문제지역일 경우
                            path[i].group = 5;
                            if(problemResult[0].problemNo != 4){//역 자체 문제-> 경로 제거하지 말고 group = 5 :위혐경로
                                let problemInfo = `${problemResult[0].problem} \n우회경로가 없으므로 다른 경로를 이용해 주세요!`;
                                path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                                /*this.setPathType(path[i].pathType, result);
                                path.splice(i,1);
                                i--;
                                pathDelete = 1;
                                break;*/
                            }
                            else{//한 출구만 문제
                                let problemInfo = `${problemResult[0].endExitNo}번 출구 근처 승강기에 문제가 있어요.\n다른 출구 승강기를 이용해 주세요.`;
                                path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                            }
                        }
                        ///////////////startElevatorInfo///////////////
                        let req = {
                            categoryBool: categoryBool,
                            subwayCode: path[i].subPath[j].lane[0].subwayCode,
                            startName: path[i].subPath[j].startName
                        }
                        let elev = (await elevator.find(req)).json;                        
                        let elevModify = [];
                        for (var k = 0; k < elev.length; k++) {
                            if((elev[k].nextStation).indexOf(path[i].subPath[j].passStopList.stations[1].stationName) != -1){
                                elevModify.push(elev[k]);
                            }
                        }
                        if(elevModify.length == 0){
                            elevModify = elev;
                        }
                        Array.prototype.push.apply(path[i].subPath[j].startElevatorInfo,elevModify);


                        let c =0;
                        /////////////findProblemArea//////////
                        problemResult = await problemArea.read(path[i].subPath[j].lane[0].subwayCode, +path[i].subPath[j].endName, 0);
                        if(problemResult.length != 0 && path[i].group == 1){
                            path[i].group = 5;
                            if((problemResult[0].problemNo) != 4 && (i == 0 || path[i-1].group != 4)){//지하철 한정거장 가는데 그 도착역이 문제지역일 경우 경로에서 제외
                                if(path[i].subPath[j].stationCount == 2){
                                    let problemInfo = `${problemResult[0].problem}\n우회경로가 없으므로 다른 경로를 이용해 주세요!`;
                                    path[i].subPath[j].endElevatorInfo.push({problem: problemInfo});
                                    /*this.setPathType(path[i].pathType, result);
                                    path.splice(i,1);
                                    i--;
                                    pathDelete = 1;
                                    break;*/
                                }
                                else{//도착역이 문제일 때 -> 우회경로
                                    let newEndStation = path[i].subPath[j].passStopList.stations[path[i].subPath[j].stationCount-1];
                                    let newResult = await openAPI.searchPubTransPath(newEndStation.x, newEndStation.y, EX, EY, 2);
                                    if (newResult == undefined) {
                                        let pathProblem = "위험 구간이지만 우회경로가 없습니다.\n다른 경로를 이용하세요";
                                        console.log("우회경로 만들 수 없음");
                                    }
                                    let newPath = this.copyObj(path[i]);
                                    newPath.subPath[j].sectionTime -= 2;
                                    newPath.subPath[j].stationCount --;
                                    newPath.subPath[j].endX = newEndStation.x;
                                    newPath.subPath[j].endY = newEndStation.y;
                                    newPath.subPath[j].endName = newEndStation.stationName;
                                    newPath.subPath[j].way = newEndStation.stationName;
                                    newPath.subPath[j].endID = newEndStation.stationID;
                                    newPath.subPath[j].passStopList.stations.splice(newPath.subPath[j].stationCount + 1,1);        
                                    newPath.subPath.splice(j+1); //뒤에 다 없앰
                                

                                    newPath.pathType = 3;
                                    newPath.info.totalTime = sumSectionTime - 2 + newResult.path[0].info.totalTime;
                                    newPath.info.lastEndStation = newResult.path[0].info.lastEndStation;
                                    newPath.info.busTransitCount = busTransitCount + newResult.path[0].info.busTransitCount;
                                    newPath.info.subwayTransitCount = subwayTransitCount + newResult.path[0].info.subwayTransitCount;
                                    newPath.info.transitCount = newPath.info.busTransitCount + newPath.info.subwayTransitCount - 1;
                                    newPath.group = 4;
                                    Array.prototype.push.apply(newPath.subPath, newResult.path[0].subPath);//subpath배열 합치기 
                                    path.splice(i,0,newPath);
                                    result.subwayBusCount++;  
                                    j = j - 1;
                                    c = 1;  
                                }
                            }
                            else{//한 출구만 문제
                                let problemInfo = `${problemResult[0].endExitNo}번 출구 근처 승강기에 문제가 있어요.\n다른 출구 승강기를 이용해 주세요.`;
                                path[i].subPath[j].endElevatorInfo.push({problem: problemInfo});
                            }
                        }

                        
                        ///////////////endElevatorInfo/////////////
                        if(c == 0){//우회경로 안만들었을 때는 그대로
                        req = {
                            categoryBool: categoryBool,
                            subwayCode: path[i].subPath[j].lane[0].subwayCode,
                            startName: path[i].subPath[j].endName
                        }
                        elevModify = (await elevator.find(req)).json;
                        elev = [];
                        for (var k = 0; k < elevModify.length; k++) {
                            let leng = path[i].subPath[j].passStopList.stations.length;
                            if((elevModify[k].nextStation).indexOf(path[i].subPath[j].passStopList.stations[leng-2].stationName) === -1){
                                elev.push(elevModify[k]);
                            }
                        }
                        if(elev.length == 0){//위에서는 포함하지 않는 객체를 넣었기 때문에 다른 방면인데 같이 nextStation으로 되어있는 경우 넣어준다.
                            elev=elevModify;
                        }
                        
                        for(var k=0;k<elev.length;k++){//역 나가는 거니까 content 반대로 바꿔줌.
                            let reverse = elev[k].content.split('\n');
                            elev[k].content ='';
                            for(var p=reverse.length-1;p>=0;p--){
                                elev[k].content +="\n";
                                elev[k].content += reverse[p];
                            }
                        }
                        Array.prototype.push.apply(path[i].subPath[j].endElevatorInfo, elev);
                    }
                    }
                    /****************** */

                    /************환승이 있는 경우************/
                    else if(path[i].subPath[j].startExitNo != undefined && path[i].subPath[j].startExitNo != null){//첫 번째 호선 ex 4호선 숙대입구~4호선 서울역
                        categoryBool = 1;
                        path[i].subPath[j].startElevatorInfo = [];
                        
                        /////////////findProblemArea//////////
                        let problemResult = await problemArea.read(path[i].subPath[j].lane[0].subwayCode, path[i].subPath[j].startName, 0);
                        console.log("문제지역 출력");
                        console.log(problemResult);
                        if(problemResult.length != 0){//출발역 문제인 경우
                            path[i].group = 5;
                            if(problemResult[0].problemNo != 4){//역 자체 문제-> 경로 제거 없이 오류만 출력
                                let problemInfo = `${problemResult[0].problem}\n우회경로가 없으므로 다른 경로를 이용해 주세요!`;
                                path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                                /*this.setPathType(path[i].pathType, result);
                                path.splice(i,1);
                                i--;
                                pathDelete = 1;
                                break;*/
                            }
                            else{//한 출구만 문제
                                let problemInfo = `${problemResult[0].endExitNo}번 출구 근처 승강기에 문제가 있어요.\n다른 출구 승강기를 이용해 주세요.`;
                                    path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                            }
                        }
                        

                        let req = {
                            categoryBool: categoryBool,
                            subwayCode: path[i].subPath[j].lane[0].subwayCode,
                            startName: path[i].subPath[j].startName
                        }
                        let elev = (await elevator.find(req)).json;                        
                        let elevModify = [];
                        for (var k = 0; k < elev.length; k++) {
                            if((elev[k].nextStation).indexOf(path[i].subPath[j].passStopList.stations[1].stationName) != -1){
                                elevModify.push(elev[k]);
                            }
                        }
                        if(elevModify.length == 0){
                            elevModify = elev;
                        }
                        Array.prototype.push.apply(path[i].subPath[j].startElevatorInfo, elevModify);
                    }

                    else if(path[i].subPath[j].endExitNo != undefined && path[i].subPath[j].endExitNo != null){//마지막 호선 ex 시청~2호선 충정로
                        categoryBool = 2;
                        path[i].subPath[j].startElevatorInfo = [];
                        path[i].subPath[j].endElevatorInfo = [];

                        /////////////findProblemArea//////////
                        let division = 0;
                        let problemResult = await problemArea.read(path[i].subPath[j-2].lane[0].subwayCode, path[i].subPath[j-2].endName , 1);
                        if((problemResult.length != 0) && (problemResult[0].nextStation == path[i].subPath[j].passStopList.stations[1].stationName)&&(i == 0 || path[i-1].group != 4)&& (path[i].group == 1)){//환승역 문제인 경우-> 우회 경로 group: 4
                            let newEndStation = path[i].subPath[j-2].passStopList.stations[path[i].subPath[j-2].stationCount-1];
                            console.log("1111");
                            path[i].group = 5;
                            if(path[i].subPath[j-2].stationCount-1 == 0){   //전역이 한 개일 경우,,,환승 3번이상인거 없음
                                if(j-2 == 1) { //처음 대중교통이면 제거
                                    let problemInfo = `${problemResult[0].problem}\n우회경로가 없으므로 다른 경로를 이용해 주세요!`;
                                    path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                                    division = 1;
                                    /*this.setPathType(path[i].pathType, result);
                                    path.splice(i,1);
                                    i--;
                                    pathDelete = 1;
                                    break;*/
                                }
                                else if(path[i].subPath[j-4].trafficType == 2){ //처음 대중교통이 버스면 제거
                                    let problemInfo = `${problemResult[0].problem}\n우회경로가 없으므로 다른 경로를 이용해 주세요!`;
                                    path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                                    division = 1;
                                    /*this.setPathType(path[i].pathType, result);
                                    path.splice(i,1);
                                    i--;
                                    pathDelete = 1;
                                    break;*/
                                }
                                else{ //처음 대중교통이 지하철이면 연결
                                    newEndStation = path[i].subPath[j-4].passStopList.stations[path[i].subPath[j-4].stationCount-1];
                                    j = j - 2;
                                }
                            }
                            if(division == 0){
                            let newResult = await openAPI.searchPubTransPath(newEndStation.x, newEndStation.y, EX, EY, 2);
                                if (newResult == undefined) {
                                    let pathProblem = "위험 구간이지만 우회경로가 없습니다.\n다른 경로를 이용하세요";
                                    console.log("우회경로 만들 수 없음");
                                }
                                
                                let newPath = this.copyObj(path[i]);
                                newPath.subPath[j-2].sectionTime -= 2;
                                newPath.subPath[j-2].stationCount --;
                                newPath.subPath[j-2].endX = newEndStation.x;
                                newPath.subPath[j-2].endY = newEndStation.y;
                                newPath.subPath[j-2].endName = newEndStation.stationName;
                                newPath.subPath[j-2].way = newEndStation.stationName;
                                newPath.subPath[j-2].endID = newEndStation.stationID;
                                newPath.subPath[j-2].passStopList.stations.splice(newPath.subPath[j-2].stationCount + 1,1);
                                newPath.subPath[j-2].endExitNo = "0";            
                                newPath.subPath.splice(j-1);//여긴 도보도 없앰
                                

                                /*console.log(sumSectionTime);
                                console.log(path[i].subPath[j].sectionTime);
                                console.log(path[i].subPath[j-2].sectionTime);
                                console.log(newResult.path[0].info.totalTime);*/
                                newPath.pathType = 3;

                                newPath.info.totalTime = sumSectionTime - path[i].subPath[j].sectionTime - path[i].subPath[j-1].sectionTime - 2 + newResult.path[0].info.totalTime; //sumSectionTime는 지난 subpath의 시간까지의 sum
                                newPath.info.lastEndStation = newResult.path[0].info.lastEndStation;
                                newPath.info.busTransitCount = busTransitCount + newResult.path[0].info.busTransitCount;
                                newPath.info.subwayTransitCount = subwayTransitCount -1 + newResult.path[0].info.subwayTransitCount;
                                newPath.info.transitCount = newPath.info.busTransitCount + newPath.info.subwayTransitCount - 1;
                                newPath.group = 4;
                                Array.prototype.push.apply(newPath.subPath, newResult.path[0].subPath);//subpath배열 합치기 
                                //console.log(newPath.info.totalTime);
                                path.splice(i,0,newPath);   //우회 경로 추가!!
                                console.log("우회 경로추가");
                                result.subwayBusCount++;      
                                j = j - 3;
                            }
                        }
                        else{
                        //////////////////startElevatorInfo////////////////
                        let req = {
                            categoryBool: categoryBool,
                            subwayCode: path[i].subPath[j-2].lane[0].subwayCode,//환승역 전 노선정보
                            startName: path[i].subPath[j].startName
                        }
                        let elev = (await elevator.find(req)).json;
                        let elevModify = [];
                        for (var k = 0; k < elev.length; k++) {
                            let leng = path[i].subPath[j-2].passStopList.stations.length;
                            if((elev[k].entrance).indexOf(path[i].subPath[j-2].passStopList.stations[leng-2].stationName) == -1){
                                elevModify.push(elev[k]);
                            }
                        }
                        if(elevModify.length == 0){
                            elevModify=elev;
                        }
                        elev = [];
                        for (var k = 0; k < elevModify.length; k++) {
                            if((elevModify[k].nextStation).indexOf(path[i].subPath[j].passStopList.stations[1].stationName) != -1){
                                elev.push(elevModify[k]);
                            }
                        }
                        if(elev.length == 0){ //아예없는 경우 반대 방면이라도
                            elev = elevModify;
                        }
                        if(problemResult.length != 0 && i != 0 && path[i].group == 5){ //일반 경로에 환승 문제점 출력하기
                            let problemInfo = `환승경로 ${problemResult[0].problem}\n우회 경로를 이용해 보세요!`;
                            path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                        }
                        Array.prototype.push.apply(path[i].subPath[j].startElevatorInfo, elev);

                        let c = 0;
                        /////////////findProblemArea//////////
                        problemResult = await problemArea.read(path[i].subPath[j].lane[0].subwayCode, path[i].subPath[j].endName, 0);
                        if(problemResult.length != 0 && path[i].group == 1){//도착역 문제인 경우
                            path[i].group = 5;
                            if((problemResult[0].problemNo != 4) && (i == 0 || path[i-1].group != 4)){//역 자체 문제-> 우회 경로 group: 4
                            console.log("왜들어가..2");
                                let newEndStation = path[i].subPath[j].passStopList.stations[path[i].subPath[j].stationCount-1];
                                let newResult = await openAPI.searchPubTransPath(newEndStation.x, newEndStation.y, EX, EY, 2);
                                if (newResult == undefined) {
                                    let pathProblem = "위험 구간이지만 우회경로가 없습니다.\n다른 경로를 이용하세요";
                                    console.log("우회경로 만들 수 없음");
                                }
                                let newPath = this.copyObj(path[i]);
                                newPath.subPath[j].sectionTime -= 2;
                                newPath.subPath[j].stationCount --;
                                newPath.subPath[j].endX = newEndStation.x;
                                newPath.subPath[j].endY = newEndStation.y;
                                newPath.subPath[j].endName = newEndStation.stationName;
                                newPath.subPath[j].way = newEndStation.stationName;
                                newPath.subPath[j].endID = newEndStation.stationID;
                                newPath.subPath[j].passStopList.stations.splice(newPath.subPath[j].stationCount + 1,1);        
                                newPath.subPath.splice(j+1); //뒤에 다 없앰
                                

                                newPath.pathType = 3;
                                newPath.info.totalTime = sumSectionTime - 2 + newResult.path[0].info.totalTime;
                                newPath.info.lastEndStation = newResult.path[0].info.lastEndStation;
                                newPath.info.busTransitCount = busTransitCount + newResult.path[0].info.busTransitCount;
                                newPath.info.subwayTransitCount = subwayTransitCount + newResult.path[0].info.subwayTransitCount;
                                newPath.info.transitCount = newPath.info.busTransitCount + newPath.info.subwayTransitCount - 1;
                                newPath.group = 4;
                                Array.prototype.push.apply(newPath.subPath, newResult.path[0].subPath);//subpath배열 합치기 
                                path.splice(i,0,newPath);
                                result.subwayBusCount++;  
                                j = j - 1;
                                c = 1;                 
                            }
                            else{//한 출구만 문제
                                let problemInfo = `${problemResult[0].endExitNo}번 출구 근처 승강기에 문제가 있어요.\n다른 출구 승강기를 이용해 주세요.`;
                                path[i].subPath[j].endElevatorInfo.push({problem: problemInfo});
                            }
                        }


                        if(c == 0){//우회경로 안만들었을 때는 그대로
                        ////////////endElevatorInfo////////////
                        categoryBool = 1;
                        req = {
                            categoryBool: categoryBool,
                            subwayCode: path[i].subPath[j].lane[0].subwayCode,
                            startName: path[i].subPath[j].endName
                        }
                        elevModify = (await elevator.find(req)).json;
                        elev = [];
                        for (var k = 0; k < elevModify.length; k++) {
                            let leng = path[i].subPath[j].passStopList.stations.length;
                            if((elevModify[k].nextStation).indexOf(path[i].subPath[j].passStopList.stations[leng-2].stationName) === -1){
                                elev.push(elevModify[k]);
                            }
                        }
                        if(elev.length == 0){//위에서는 포함하지 않는 객체를 넣었기 때문에 다른 방면인데 같이 nextStation으로 되어있는 경우 넣어준다.
                            elev=elevModify;
                        }
                        for(var k=0;k<elev.length;k++){//역 나가는 거니까 content 반대로 바꿔줌.
                            let reverse = elev[k].content.split('\n');
                            elev[k].content ='';
                            for(var p=reverse.length-1;p>=0;p--){
                                elev[k].content +="\n";
                                elev[k].content += reverse[p];
                            }
                        }
                        Array.prototype.push.apply(path[i].subPath[j].endElevatorInfo, elev);
                    }
                    }
                    }

                
                    else { //중간환승호선 ex 4호선 -> 1호선 서울역~ 1호선 시청
                        categoryBool = 2;
                        path[i].subPath[j].startElevatorInfo = [];

                        /////////////findProblemArea//////////
                        let problemResult = await problemArea.read(path[i].subPath[j-2].lane[0].subwayCode, path[i].subPath[j-2].endName , 1);
                        //console.log(problemResult);
                        if((problemResult.length != 0) && (problemResult[0].nextStation == path[i].subPath[j].passStopList.stations[1].stationName)&&(i == 0 || path[i-1].group != 4) && (path[i].group == 1)){//환승역 문제인 경우-> 우회 경로 group: 4
                            let newEndStation = path[i].subPath[j-2].passStopList.stations[path[i].subPath[j-2].stationCount-1]; //path[i].subPath[j-2].stationCount-1 이값이 0이면 안됨,,거기부터 좌표로
                            path[i].group = 5;
                            let division = 0;
                            if(path[i].subPath[j-2].stationCount == 1){   //전역이 한 개일 경우,,,환승 3번이상인거 없음
                                if(j-2 == 1) { //처음 대중교통이면 제거
                                    let problemInfo = `${problemResult[0].problem}\n우회경로가 없으므로 다른 경로를 이용해 주세요!`;
                                    path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                                    division = 1;
                                    /*this.setPathType(path[i].pathType, result);
                                    path.splice(i,1);
                                    i--;
                                    pathDelete = 1;
                                    break;*/
                                }
                            }
                            if(division == 0){
                            let newResult = await openAPI.searchPubTransPath(newEndStation.x, newEndStation.y, EX, EY, 2);
                                if (newResult == undefined) {
                                    let pathProblem = "위험 구간이지만 우회경로가 없습니다.\n다른 경로를 이용하세요";
                                    console.log("우회경로 만들 수 없음");
                                }
                                let newPath = this.copyObj(path[i]);

                                newPath.subPath[j-2].sectionTime -= 2;
                                newPath.subPath[j-2].stationCount --;
                                newPath.subPath[j-2].endX = Number(newEndStation.x);
                                newPath.subPath[j-2].endY = Number(newEndStation.y);
                                newPath.subPath[j-2].endName = newEndStation.stationName;
                                newPath.subPath[j-2].way = newEndStation.stationName;
                                newPath.subPath[j-2].endID = newEndStation.stationID;
                                newPath.subPath[j-2].passStopList.stations.splice(newPath.subPath[j-2].stationCount + 1,1);    
                                newPath.subPath[j-2].endExitNo = "0";    
                                newPath.subPath.splice(j-1);//여긴 도보도 없앰

                                //console.log(newResult.path[0].subPath);
                                //console.log(newPath.subPath);

                                newPath.pathType = 3;
                                newPath.info.totalTime =  sumSectionTime - path[i].subPath[j].sectionTime - path[i].subPath[j-1].sectionTime - 2 + newResult.path[0].info.totalTime;
                                newPath.info.lastEndStation = newResult.path[0].info.lastEndStation;
                                newPath.info.busTransitCount = busTransitCount + newResult.path[0].info.busTransitCount;
                                newPath.info.subwayTransitCount = subwayTransitCount -1 + newResult.path[0].info.subwayTransitCount;
                                newPath.info.transitCount = newPath.info.busTransitCount + newPath.info.subwayTransitCount - 1;
                                newPath.group = 4;
                                Array.prototype.push.apply(newPath.subPath, newResult.path[0].subPath);//subpath배열 합치기 
                                path.splice(i,0,newPath);   //우회 경로 추가!!
                                result.subwayBusCount++;      
                                j = j - 3; 
                            }
                        }
                        
                        else{
                        let req = {
                            categoryBool: categoryBool,
                            subwayCode: path[i].subPath[j-2].lane[0].subwayCode,//환승역 전 노선정보
                            startName: path[i].subPath[j].startName
                            //방향추가 해야함.. 환승이 방향경우의 수가 엄청많기 때문, 일단 다 가져와서 처리해야 할 것 같은데...
                            //,entrance: ,4호선 신용산 방면..
                            //nextStation: path[i].subPath[j-2].lane[0].name.split() 1호선 시청 방면 인거 찾아야함....
                        }
                        let elev = (await elevator.find(req)).json;
                        let elevModify = [];
                        for (var k = 0; k < elev.length; k++) {
                            let leng = path[i].subPath[j-2].passStopList.stations.length;
                            if((elev[k].entrance).indexOf(path[i].subPath[j-2].passStopList.stations[leng-2].stationName) === -1){
                                elevModify.push(elev[k]);
                            }
                        }
                        if(elevModify.length == 0){
                            elevModify=elev;
                        }
                        elev = [];
                        for (var k = 0; k < elevModify.length; k++) {
                            if((elevModify[k].nextStation).indexOf(path[i].subPath[j].passStopList.stations[1].stationName) != -1){
                                elev.push(elevModify[k]);
                            }
                        }
                        if(elev.length == 0){//아예없는 경우 반대 방면이라도 
                            elev = elevModify;
                        }
                        if(problemResult.length != 0 && i != 0 && path[i].group == 5){ //일반 경로에 환승 문제점 출력하기
                            let problemInfo = `환승경로 ${problemResult[0].problem}\n우회 경로를 이용해 보세요!`;
                            path[i].subPath[j].startElevatorInfo.push({problem: problemInfo});
                        }
                        Array.prototype.push.apply(path[i].subPath[j].startElevatorInfo, elev);
                    }
                    }
                }
                    
                /*************************** */

                
                else if(path[i].subPath[j].trafficType === 2) {//버스
                    busTransitCount++;
                    //버스 arsID정보 가져오기
                    let busResult = await openAPI.getBusArsID(path[i].subPath[j].startX,path[i].subPath[j].startY);
                    //console.log(busResult);
                    if (busResult == undefined) {
                        return({
                            code: statusCode.BAD_REQUEST,
                            json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.FIND_PATH_FAILED)
                        })
                    }
                    let itemList = busResult.itemList;
                        if (itemList == undefined) {
                            console.log("arsId를 찾을 수 없습니다.");
                            return({
                                code: statusCode.BAD_REQUEST,
                                json: authUtil.successFalse(statusCode.BAD_REQUEST, "arsId를 찾을 수 없습니다.")
                            })
                        }
    
                        if(itemList.length == undefined){//itemList가 하나일 때
                            itemList = [''];
                            itemList[0] = busResult.itemList;
                        }
    
                        let k;
                        let arsID
                        for(k = 0; k < itemList.length; k++){
                            var str = itemList[k].stationNm._text;
                            if(str == path[i].subPath[j].startName){
                                arsID = itemList[k].arsId._text;
                                path[i].subPath[j].busArsID = arsID; 
                                break;
                            }
                        }
                        if(k == itemList.length){
                            arsID = itemList[0].arsId._text;
                            path[i].subPath[j].busArsID = arsID; 
                        }



                    /* 일반버스or 저상버스 실시간 정보 가져오기
                    let busResult = await openAPI.getBusStationInfo(path[i].subPath[j].startID);
                    if (busResult === undefined) {
                        return({
                            code: statusCode.BAD_REQUEST,
                            json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.FIND_PATH_FAILED)
                        })
                    }
                    
                    let arsID = busResult.arsID.split('-')[0] + busResult.arsID.split('-')[1];
                    path[i].subPath[j].busArsID = arsID; 


                    
                    let busArriveResult;
                    if(busFilter == 1){
                        busArriveResult = await openAPI.getLowBusArriveTime(arsID);
                    }
                    else{
                        busArriveResult = await openAPI.getBusArriveTime(arsID);
                    }


                    if (busArriveResult === undefined) {
                        return({
                            code: statusCode.BAD_REQUEST,
                            json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.FIND_PATH_FAILED)
                        })
                    }

                    for(var p=0;p<path[i].subPath[j].lane.length;p++){
                    
                    let itemList = busArriveResult.itemList;
                    if (itemList === undefined) {
                        path[i].subPath[j].lane[p].arriveTime = {//버스 도착정보 추가
                            arrmsg1: "현재 버스 정보가 없습니다.",
                            busType1: null,
                            arrmsg2: null,
                            busType2: null
                        }
                        break;
                    }

                    if(itemList.length === undefined){//itemList가 하나일 때
                        itemList = [''];
                        itemList[0] = busArriveResult.itemList;
                    }

                    let k;
                    for(k = 0; k < itemList.length; k++){
                        var str = itemList[k].rtNm._text;
                        if(str.indexOf(path[i].subPath[j].lane[p].busNo)!=-1){//공공데이터 : 남양주65-1 /odsay : 65-1
                            path[i].subPath[j].lane[p].arriveTime = {//버스 도착정보 추가
                                //첫 번째 도착 예정 버스
                                arrmsg1: itemList[k].arrmsg1._text,
                                busType1: itemList[k].busType1._text,
                                //두 번째 도착 예정 버스
                                arrmsg2: itemList[k].arrmsg2._text,
                                busType2: itemList[k].busType2._text
                            }
                            break;
                        }
                    }

                    if(k == itemList.length){//실시간 도착리스트에서 해당되는 버스를 못 찾았다면
                        var msg = (busFilter == 1? "현재 저상버스 정보가 없습니다.": "현재 버스 정보가 없습니다.")
                        path[i].subPath[j].lane[p].arriveTime = {
                            arrmsg1: msg,
                            busType1: null,
                            arrmsg2: null,
                            busType2: null
                        }
                    }
                }*/
            }
        }

        //환승이 3번 이상이면 경로에서 빼기
        if(path[i].subPath.length >= 9){
            this.setPathType(path[i].pathType, result);
            path.splice(i,1);
            pathDelete = 1;
            i--;
            continue;
        }

        //console.log(pathDelete);

        
        if(pathDelete == 0){
            if(path[i].myPathIdx == undefined){
                path[i].myPathIdx = -1;
            }
            if(path[i].likeNum == undefined){
                path[i].likeNum = -1;
            }
            path[i] = {//odsay 가져온 정보에서 출력할 값들만 대입해서 path배열에 넣음 
                myPathIdx: path[i].myPathIdx,
                likeNum: path[i].likeNum,
                pathType: path[i].pathType,
                totalTime: path[i].info.totalTime,
                totalPay: path[i].info.payment,
                transitCount: count-1,
                firstStartStation: path[i].info.firstStartStation,
                lastEndStation: path[i].info.lastEndStation,
                busTransitCount: path[i].info.busTransitCount,
                subwayTransitCount: path[i].info.subwayTransitCount,
                totalWalkTime: totalWalkTime,
                group: path[i].group, //1:일반 경로 2:사용자추가 경로 3:사용자 추가 경로 4:우회경로
                subPath: path[i].subPath,//subPath 그대로 대입
            } 
            console.log(i);           
        }
        //console.log(path);
        }


        result = {//필요한 정보들만 정리하여 result 재정의
            busCount: result.busCount,
            subwayCount: result.subwayCount,
            subwayBusCount: result.subwayBusCount,
            path: path
        }
        //console.log(result);


        return({
            code: statusCode.OK,
            json: authUtil.successTrue(statusCode.OK, responseMessage.FIND_PATH_COMPLETE, result)
        });
    }    
}


/*해야할거 
getStationByUidItem: 모든 종류의 버스 도착정보를 조회
getLowStationByUidList :고유번호arsid에 해당하는 정류소의 *저상버스 도착정보를 조회한다.

0. busFilter 파라미터 값에 추가. 필터 on이면 1:저상버스, off면 0:일반이나 굴절버스,
버스 실시간 도착 연동! lane의 (정류소id, 노선id, 정류소 순번)을 파라미터로 넘겨줌

1. busFilter=1일때, subPath에서 trafficType=2일 경우 버스 실시간 데이터 연동한 출력값의 버스유형이 1인것만 보여주기 

2. 지하철 들어가는역, 환승역이나, 나가는역이 있을 경우 그 역의 엘리베이터 위치 정보 받아와서 
한 역의 엘리베이터 여러개 있을 경우는? "1,3,5번 출구에 승강기가 있습니다." + 엘리베이터 좌표정보 객체 배열 보내줘야함.
출력 하지만 경로 알려줄 땐 가장 가까운 위치의 "엘리베이터 1번출구를 이용하세요." 엘리베이터 좌표정보 배열[0]에 정렬하자 
subPath[].trafficType == 1일 경우 호선과 역위치를 파라미터로 밑의 값들을 엘리베이터 좌표정보 배열로 다시 정의해서 보내줘야함.                        
                        "startExitNo": "2",
                        "startExitX": 127.083885072609,
                        "startExitY": 37.62035555361119,
                        "endExitNo": "2",
                        "endExitX": 127.00200807237235,
                        "endExitY": 37.54059005352947,
                        
3. 환승 위치 안내할 때 엘리베이터 가까운 승강장으로 하차하도록 door
*/