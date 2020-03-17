var express = require('express');
var router = express.Router();
const authUtil = require('../module/authUtil');
const responseMessage = require('../module/responseMessage');
const statusCode = require('../module/statusCode');
const searchPath = require('../model/searchPathModel');

const like = require('../model/setLikeNumModel');
const authMiddleware = require('../module/authMiddleware');


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


router.post('/setLikeNum', authMiddleware.validToken, async(req, res) => { //추천 경로 좋아요 추가
    const {myPathIdx, likeNum} = req.body;
    // 파라미터 오류
    if(!myPathIdx || !likeNum) {
        const missParameters = Object.entries({myPathIdx, likeNum})
        .filter(it => it[1] == undefined).map(it => it[0]).join(',');
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST,`${missParameters} ${responseMessage.NULL_VALUE}`));
        return;
    }

    
    // Token 통해서 userIdx 취득
    const userIdx = req.decoded.userIdx;//클라는 로그인 시 받은 token값을 넘겨줄 것임
    if(!userIdx)
    {
        res.status(statusCode.BAD_REQUEST)
        .send(authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.EMPTY_TOKEN));
        return;
    }

    //좋아요 이미 했는지 조회
    let getFavorite = await like.getLikeNum(myPathIdx, userIdx);
    if(getFavorite == undefined){
        console.log("처음 좋아요");
        if(likeNum != 1){
            res.status(statusCode.BAD_REQUEST)
            .send(authUtil.successFalse(statusCode.BAD_REQUEST, "좋아요 파라미터 값 이상"));
        }
        else{
            like.addLikeNum(myPathIdx, likeNum, userIdx)
            .then(({code, json}) => {
                res.status(code).send(json);
            }).catch(err => {
                console.log("좋아요 등록 실패");
                res.status(statusCode.INTERNAL_SERVER_ERROR)
                .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
            });
        }
    }
    else{
        res.status(statusCode.USER_ALREADY)
        .send(authUtil.successFalse(statusCode.USER_ALREADY, "이미 좋아요를 한 경로입니다."));
        console.log("이미 좋아요함");
        /*
        if(likeNum == -1){//좋아요 취소
            like.deleteLikeNum(myPathIdx, userIdx)
            .then(({code, json}) => {
                res.status(code).send(json);
            }).catch(err => {
                console.log("좋아요 취소 실패");
                res.status(statusCode.INTERNAL_SERVER_ERROR)
                .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
            });
        }*/
    }

    //myPath의 likeNum값 setting
    like.setMyPathLikeNum(myPathIdx)
    .then(({code, json}) => {
        res.status(code).send(json);
    }).catch(err => {
        console.log("좋아요 총합 계산 실패");
        res.status(statusCode.INTERNAL_SERVER_ERROR)
        .send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    });
});



module.exports = router;