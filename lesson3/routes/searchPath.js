var express = require('express');
var router = express.Router();
const authUtil = require('../module/authUtil');
const responseMessage = require('../module/responseMessage');
const statusCode = require('../module/statusCode');
const searchPath = require('../model/searchPathModel');


router.get('/', async (req, res) => {
    if (!req.query.SX || !req.query.EX || !req.query.SY || !req.query.EY) {
        res.status(statusCode.BAD_REQUEST).send(authUtil.successFalse(statusCode.BAD_REQUEST,responseMessage.NULL_VALUE));
    }

    try {
        let result = await searchPath.searchPath(req.query.SX, req.query.SY, req.query.EX, req.query.EY, req.query.SearchPathType)//, req.query.busFilter
        res.status(result.code).send(result.json);
    }
    catch (err) {
        console.log('길찾기 오류!!');
        console.log(err);
    }
});

module.exports = router;