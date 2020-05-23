const statusCode = require('../module/statusCode');
const authUtil = require('../module/authUtil');
const pool = require('../module/poolAsync');


module.exports = {
    getMyPath: async (SX, SY, EX, EY ,startStName, endStName, filter) => {
        //const table = 'myPath';
        //const query = `SELECT * FROM ${table} WHERE startLongi = ? AND `;
        let startLongi = Math.floor(SX*10000000)/10000000;
        let startLati = Math.floor(SY*10000000)/10000000;
        let endLongi = Math.floor(EX*10000000)/10000000;
        let endLati = Math.floor(EY*10000000)/10000000;

        
        if(filter == 1){
            var getMyPathQuery = `SELECT *, 
        (6371*acos(cos(radians(${startLati}))*cos(radians(startLati))*cos(radians(startLongi)-radians(${startLongi}))+sin(radians(${startLati}))*sin(radians(startLati)))) AS distance1,
        (6371*acos(cos(radians(${endLati}))*cos(radians(endLati))*cos(radians(endLongi)-radians(${endLongi}))+sin(radians(${endLati}))*sin(radians(endLati)))) AS distance2
        FROM myPath 
        HAVING distance1 <= 0.3 AND distance2 <= 0.3
        ORDER BY distance1 LIMIT 0,300`;
        }
        else{
            var getMyPathQuery = `SELECT * FROM myPath WHERE startStName=${startStName} AND endStName=${endStName}`;
        }

        const getPathQuery = `SELECT * FROM paths WHERE myPathIdx = ?`;
        const getSubPathQuery = `SELECT * FROM subPaths WHERE pathIdx = ?`;
        const getStationQuery = `SELECT stationID,stationName FROM stations WHERE subPathIdx = ?`;

        
        const getMyPathResult = await pool.queryParam_None(getMyPathQuery);

        if(getMyPathResult == undefined || getMyPathResult.length == 0) {
            return ;
            //({code : statusCode.BAD_REQUEST, json : authUtil.successFalse(statusCode.BAD_REQUEST, resMsg.NULL_VALUE)})
        }

        //let newPathResult={};
        //일단 하나만 보여주도록

        if(filter == 2){
            //정렬을 다르게, station이름이 같은게 첫번째오도록
            for(var k = 0;k<getMyPathResult.length;k++){
                if(getMyPathResult[k].startStName == startStName){
                    let ob = getMyPathResult[k];
                    getMyPathResult.unshift(k,1);
                    getMyPathResult.unshift(0,0,ob);//0번째로 이동
                }
            }
        }
        //console.log(getMyPathResult);
        const getPathResult = await pool.queryParam_Arr(getPathQuery, [getMyPathResult[0].myPathIdx]);
        getPathResult[0].myPathIdx = getMyPathResult[0].myPathIdx;
        getPathResult[0].likeNum = getMyPathResult[0].likeNum;
        getPathResult[0].info = {};
        getPathResult[0].info.firstStartStation = getMyPathResult[0].startStName;
        getPathResult[0].info.lastEndStation = getMyPathResult[0].endStName;
        getPathResult[0].info.payment = getPathResult[0].totalPay;
        let newPathResult = getPathResult[0];

        const getSubPathResult = await pool.queryParam_Arr(getSubPathQuery, [getPathResult[0].pathIdx]);
        newPathResult.subPath = [];
        let sumTotalTime = 0;
        let busTransitCount = 0;
        let subwayTransitCount = 0;
        for (var i = 0; i < getSubPathResult.length; i++) {
            sumTotalTime += getSubPathResult[i].sectionTime;
            if(getSubPathResult[i].trafficType === 1){//지하철이면
                getSubPathResult[i].lane = [];
                getSubPathResult[i].lane.push({"subwayCode": getSubPathResult[i].subwayCode});
                subwayTransitCount++;
            }
            else if(getSubPathResult[i].trafficType === 2){//버스이면
                getSubPathResult[i].lane = [];
                getSubPathResult[i].lane.push({"busNo": getSubPathResult[i].busNo});
                getSubPathResult[i].lane[0].type = getSubPathResult[i].type;
                busTransitCount++;
            }

            if(i < Math.floor(getSubPathResult.length/2)){ //지하철이나 버스를 도보 사이사이에
                newPathResult.subPath[2*i+1] = getSubPathResult[i];
            }
            else{
                newPathResult.subPath[(i- Math.floor(getSubPathResult.length/2))*2] = getSubPathResult[i];
            }


            if (getSubPathResult[i].trafficType !== 3) {//버스나 지하철이면.
                let getStationResult = await pool.queryParam_Arr(getStationQuery, [getSubPathResult[i].subPathIdx]);
                newPathResult.subPath[2*i+1].passStopList = {};
                newPathResult.subPath[2*i+1].passStopList.stations = [];
                //console.log(getStationResult);
                for (var j = 0; j < getStationResult.length; j++) {
                    newPathResult.subPath[2*i+1].passStopList.stations.push(getStationResult[j]);
                }
                //console.log(newPathResult.subPath[i].passStopList.stations);
            }
        }
        newPathResult.info.totalTime = sumTotalTime;
        newPathResult.info.busTransitCount = busTransitCount;
        newPathResult.info.subwayTransitCount = subwayTransitCount;

        return newPathResult;
    }
}


