const request = require('request');
const apiKey = require('../config/apiKey');
//var parseString = require('xml2js').parseString;
var convert = require('xml-js');

module.exports = {
    
    searchPubTransPath: (SX, SY, EX, EY, SearchPathType) => {
        return new Promise((resolve, reject) => {
            const options = {
                'uri': `https://api.odsay.com/v1/api/searchPubTransPathR?apiKey=${apiKey.odsay}&SX=${SX}&SY=${SY}&EX=${EX}&EY=${EY}&SearchPathType=${SearchPathType}`

            }
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    resolve(JSON.parse(result.body).result);
                }
            })
        })
    },


    //단순히 정류장이름으로 arsID 찾을 경우 같은 정류장이름 여러개 arsID 나올 수 있음 따라서 밑의 api로
    getBusStationInfo: (stationID) => {
        return new Promise((resolve, reject) => {
            const options = {
                'uri': `https://api.odsay.com/v1/api/busStationInfo?apiKey=${apiKey.odsay}&stationID=${stationID}`

            }
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    resolve(JSON.parse(result.body).result);
                }
            })
        })
    },

    getSubwayGPS: (stationID) => {//지하철 id로 역의 좌표 구하기
        return new Promise((resolve, reject) => {
            const options = {
                'uri': `https://api.odsay.com/v1/api/subwayStationInfo?apiKey=${apiKey.odsay}&lang=0&stationID=${stationID}`
            }
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    resolve(JSON.parse(result.body).result);
                }
            })
        })
    },

    getBusArsID : (x,y) => {
        return new Promise((resolve, reject)=> {
            const options = {
                'uri' : `http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos?ServiceKey=${apiKey.getStationByUid}&tmX=${x}&tmY=${y}&radius=100`
            }
            
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    var xml = result.body;
                    var result1 = convert.xml2json(xml, {compact: true, spaces: 0});
                    resolve(JSON.parse(result1).ServiceResult.msgBody);
                }
            })
        })
    },


    getBusArriveTime : (arsID) => {
        return new Promise((resolve, reject)=> {
            const options = {
                'uri' : `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?ServiceKey=${apiKey.getStationByUid}&arsId=${arsID}`
            }
            
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    var xml = result.body;
                    var result1 = convert.xml2json(xml, {compact: true, spaces: 0});
                    resolve(JSON.parse(result1).ServiceResult.msgBody);
                }
            })
        })
    },

    getLowBusArriveTime : (arsID) => {
        return new Promise((resolve, reject)=> {
            const options = {
                'uri' : `http://ws.bus.go.kr/api/rest/stationinfo/getLowStationByUid?ServiceKey=${apiKey.getStationByUid}&arsId=${arsID}`
            }
            
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    var xml = result.body;
                    var result1 = convert.xml2json(xml, {compact: true, spaces: 0});
                    resolve(JSON.parse(result1).ServiceResult.msgBody);
                }
            })
        })
    }
    
}

//버스 arsID는 버스정류장 세부 정보 조회api를 이용해야 올바른 정류장 하나만 나옴
//지하철은  stationID로 실시간 정보 받기. '지하철역 세부 정보 조회'