const authUtil = require('../module/authUtil');
const statusCode = require('../module/statusCode');
const pool = require('../module/poolAsync');


module.exports = {
    addMyPath: async (startAddress, startLongi, startLati,endAddress, endLongi, endLati,userIdx) => {
        const table = 'myPath';
        const fields = 'startAddress, startLongi, startLati, endAddress, endLongi, endLati, userIdx';
        const questions = `?,?,?,?,?,?,?`;
        const addMyPathQuery = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [startAddress, startLongi, startLati, endAddress, endLongi, endLati, userIdx];
        return await pool.queryParam_Arr(addMyPathQuery, values)
            .catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, "addMyPath 실패")
                })
            })
    },
    addStMyPath: async (startStName, endStName, myPathIdx) => { //대중교통 시작과 끝 저장
        console.log(startStName);
        const addMyPathQuery = `UPDATE myPath SET startStName=${startStName}, endStName=${endStName} WHERE myPathIdx =${myPathIdx}`;
        return await pool.queryParam_None(addMyPathQuery)
            .catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, "addPaths 실패")
                })
            })
    },
    addPaths: async (pathType, myPathIdx) => {//클라이언트에서 줄 수 있는 정보 물어보고 없으면 빼기totalTime, totalPay, transitCount, totalWalkTime,
        
        const table = 'paths';
        const fields = 'pathType, myPathIdx';
        const questions = `?,?`;
        const addPathsQuery = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [pathType, myPathIdx];
        return await pool.queryParam_Arr(addPathsQuery, values)
            .catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, "addPaths 실패")
                })

            })
    },
    addSubway: async (trafficType, distance, sectionTime, stationCount, subwayCode, startName, startX, startY, endName, endX, endY, wayCode, door, startID, startExitNo, endExitNo, stopArray, pathIdx) => {

        /***********여기서부터 다시하기2/17일 끝 어떤 정보 넣어줄 수 있는지 물어보기...*/

        const table1 = 'subPaths';
        const fields1 = 'trafficType, distance, sectionTime, stationCount, subwayCode, startName, startX, startY, endName, endX, endY, wayCode, door, startID, startExitNo, endExitNo, pathIdx';
        const questions1 = `?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?`;
        const addSubwayQuery = `INSERT INTO ${table1}(${fields1}) VALUES(${questions1})`;
        const addSubwayValues = [trafficType, distance, sectionTime, stationCount, subwayCode, startName, startX, startY, endName, endX, endY, wayCode, door, startID, startExitNo, endExitNo, pathIdx];

        const table2 = 'stations';
        const fields2 = 'stationID, stationName, subPathIdx';
        const questions2 = `?,?,?`;
        const addSubwayStationQuery = `INSERT INTO ${table2}(${fields2}) VALUES(${questions2})`;

        return await pool.Transaction(async (conn) => {
            let addSubwayResult = await conn.query(addSubwayQuery, addSubwayValues);
            for (var i = 0; i < stopArray.length; i++) {
                await conn.query(addSubwayStationQuery, [stopArray[i].stationID, stopArray[i].stationName, addSubwayResult.insertId]);
            }
        }).catch((err) => {
            return ({
                code: statusCode.BAD_REQUEST,
                json: authUtil.successFalse(statusCode.BAD_REQUEST, "addSubway 실패")
            })
        })
    },
    addWalk: async (trafficType, distance, sectionTime, pathIdx) => {

        const table = 'subPaths';
        const fields = 'trafficType, distance, sectionTime, pathIdx';
        const questions = `?,?,?,?`;
        const addWalkQuery = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [trafficType, distance, sectionTime, pathIdx];

        return await pool.queryParam_Arr(addWalkQuery, values)
        .catch((err) => {
            return ({
                code: statusCode.BAD_REQUEST,
                json: authUtil.successFalse(statusCode.BAD_REQUEST, "addWalk 실패")
            })
        })
    },

    addBus: async (trafficType, distance, sectionTime, stationCount, startName, startX, startY, endName, endX, endY, startID, busNo, type, stopArray, pathIdx) => {
        
        const table1 = 'subPaths';
        const fields1 = 'trafficType, distance, sectionTime, stationCount, startName, startX, startY, endName, endX, endY, startID, busNo, type, pathIdx';
        const questions1 = `?,?,?,?,?,?,?,?,?,?,?,?,?,?`;
        const addBusQuery = `INSERT INTO ${table1}(${fields1}) VALUES(${questions1})`;
        const addBusValues = [trafficType, distance, sectionTime, stationCount, startName, startX, startY, endName, endX, endY, startID, busNo, type, pathIdx];

        const table2 = 'stations';
        const fields2 = 'stationID, stationName, subPathIdx';
        const questions2 = `?,?,?`;
        const addBusStationQuery = `INSERT INTO ${table2}(${fields2}) VALUES(${questions2})`;
        
        
        return await pool.Transaction(async (conn) => {
            let addBusResult = await conn.query(addBusQuery, addBusValues);
            for (var j = 0; j < stopArray.length; j++) {
                await conn.query(addBusStationQuery, [startID, stopArray[j], addBusResult.insertId]);
            }
        }).catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, "addBus 실패")
                })
            })
    }
}