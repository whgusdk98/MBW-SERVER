var express = require('express');
var router = express.Router();
const authUtil = require('../module/authUtil');
const responseMessage = require('../module/responseMessage');
const statusCode = require('../module/statusCode');
const searchPath = require('../model/searchPathModel');


router.get('/', async (req, res) => {
    const {SX, SY, EX, EY, SearchPathType} = req.query;
    //console.log(req.query);
    const missParameters = Object.entries({SX, SY, EX, EY})
    .filter(it => it[1] == undefined).map(it => it[0]).join(',');
    // 파라미터 값 체크
    if(!SX || !SY || !EX || !EY) {
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST,`${missParameters} ${responseMessage.NULL_VALUE}`));
        return;
    }

    searchPath.searchPath(SX, SY, EX, EY, SearchPathType)//, busFilter
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        console.log('길찾기 오류!!');
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    });
});

module.exports = router;