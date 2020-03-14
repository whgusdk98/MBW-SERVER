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

/*
router.get('/', async(req, res) => {  //문제구역 전체 보기 
    Board.readAll()
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    });
});

router.get('/:boardIdx', async(req, res) => { //문제구역 개별 보기 
    const boardIdx = req.params.boardIdx;
    if(!boardIdx){
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
        return;
    }
    Board.read({boardIdx})
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    });
});
*/

/*
router.put('/', (req, res) => { //문제구역 수정 하기 
    const {boardIdx, title, content} = req.body;
    if(!boardIdx || !title || !content){
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(responseMessage.NULL_VALUE));
        return;
    }
    Board.update({boardIdx, title, content})
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(responseMessage.INTERNAL_SERVER_ERROR));
    });
});

router.delete('/', (req, res) => { //문제구역 삭제 하기
    const {boardIdx} = req.body;
    if(!boardIdx){
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(responseMessage.NULL_VALUE));
        return;
    }
    Board.delete({boardIdx})
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(responseMessage.INTERNAL_SERVER_ERROR));
    });
});
*/
module.exports = router;