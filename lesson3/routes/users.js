const express = require('express');
const router = express.Router();
const authUtil = require('../module/authUtil');
const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const User = require('../model/user');
const encrypt = require('../module/encryption');

/*
    [POST]localhost:3000/user/signup
    request body
    {
        "email":"email아이디",
        "password":"비밀번호",
        "name":"이름"
    }
    response
    1. 성공 V
    2. 파라미터 오류 V
    3. 아이디 중복
    4. 서버 오류 
*/
router.post('/signup', async(req, res) => {
    const {password, name, email} = req.body;
    // 파라미터 오류
    if(!password || !name || !email) {
        const missParameters = Object.entries({password, name, email})
        .filter(it => it[1] == undefined).map(it => it[0]).join(',');
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST,`${missParameters} ${responseMessage.NULL_VALUE}`));
        return;
    }

    check = await User.checkUser(email);//중복id확인
    if(check==false)
    {
        res
        .status(statusCode.USER_ALREADY)
        .send(authUtil.successFalse(statusCode.USER_ALREADY,responseMessage.ALREADY_ID));
        return;
    }

    encrypt.encrypt(password)
    .then(({hashed, salt}) => User.signup({name, email, salt, password: hashed}))
    .then(({code, json}) => res.status(code).send(json))
    .catch(err => {
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR,responseMessage.INTERNAL_SERVER_ERROR));
    });
});

/*
    [POST]localhost:3000/user/signin
    request body
    {
        "email":"email아이디",
        "password":"비밀번호",
    }
    response
    1. 성공
    2. 파라미터 오류
    3. 유저가 존재하지 않음
    4. 비밀번호가 틀린경우
    4. 서버 오류
*/
router.post('/signin', async(req, res) => {
    const {email, password} = req.body;
    const missParameters = Object.entries({password, email})
    .filter(it => it[1] == undefined).map(it => it[0]).join(',');
    // 파라미터 값 체크
    if(!email || !password) {
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST,`${missParameters} ${responseMessage.NULL_VALUE}`));
        return;
    }
    User.signin({email, password})
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    });
});

module.exports = router;