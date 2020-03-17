const authUtil = require('../module/authUtil');
const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage')
const pool = require('../module/poolAsync');


module.exports = {
    addLikeNum: async (myPathIdx, likeNum, userIdx) => { //좋아요 등록
        const table = 'myPathLike';
        const fields = 'myPathIdx, likeNum, userIdx';
        const questions = `?,?,?`;
        const query = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [myPathIdx, likeNum, userIdx];
        return await pool.queryParam_Arr(query, values)
            .then(result => {
                if (result.length != 0){ 
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, "좋아요 등록 성공", null)
                    };
                }
            })
            .catch((err) => {
                return {
                    code: statusCode.DB_ERROR,
                    json: authUtil.successFalse(statusCode.DB_ERROR, "좋아요 등록 실패")
                };
            })
    },

    deleteLikeNum: async(myPathIdx, userIdx) => {
        const table = 'myPathLike';
        const query = `delete from ${table} WHERE myPathIdx = ${myPathIdx} AND userIdx = ${userIdx}`
        return await pool.queryParam_None(query)
            .then(result => {
                if (result.length != 0){ 
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, "좋아요 취소 성공", null)
                    };
                }
            })
            .catch((err) => {
                return {
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, "좋아요 취소 실패")
                };
            })
    },

    getLikeNum: async (myPathIdx, userIdx) => {
        const table = 'myPathLike';
        const query = `SELECT * FROM ${table} WHERE myPathIdx = ${myPathIdx} AND userIdx = ${userIdx}`;
        return await pool.queryParam_None(query)
            .then(result => {
                if (result.length != 0){ //존재하면 result 반환
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, "좋아요 조회 성공", result)
                    };
                }
                //존재하지 않으면 아무것도 반환x
            })
            .catch((err) => {
                return {
                    code: statusCode.NOT_FOUND,
                    json: authUtil.successFalse(statusCode.NOT_FOUND, "좋아요 조회 실패")
                };
            })
    },

    setMyPathLikeNum: async (myPathIdx) => {
        const table = 'myPathLike';
        const query = `SELECT * FROM ${table} WHERE myPathIdx = ${myPathIdx}`;
        
        return await pool.Transaction(async (conn) => {
            let likeResult = await conn.query(query);
            let sumLike = likeResult.length;
            const myPathQuery = `UPDATE myPath SET likeNum = ${sumLike} WHERE myPathIdx = ${myPathIdx}`
            await conn.query(myPathQuery);
        }).catch((err) => {
            return {
                code: statusCode.BAD_REQUEST,
                json: authUtil.successFalse(statusCode.BAD_REQUEST, "sumLike 실패")
            };
        })
    }
}