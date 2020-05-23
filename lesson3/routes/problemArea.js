const express = require('express');
const router = express.Router();
const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const authUtil = require('../module/authUtil');
const Board = require('../model/problemAreaModel');


router.post('/', async(req, res) => { /*문제 구역 작성 하기 */
    const {subwayCode, stationName, transfer, nextStation, endExitNo, problemNo, problem} = req.body;
    if(!subwayCode || !stationName ||(transfer!= 0 && transfer!=1) || !endExitNo || !problemNo || !problem){
        const missParameters = Object.entries({subwayCode, stationName, transfer, nextStation, endExitNo, problemNo, problem})
        .filter(it => it[1] == undefined).map(it => it[0]).join(',');
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST,`${missParameters} ${responseMessage.NULL_VALUE}`));
        return;
    }
    Board.create({subwayCode, stationName, transfer, nextStation, endExitNo, problemNo, problem})
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        console.log(err);
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    });
});

module.exports = router;