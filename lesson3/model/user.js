const authUtil = require('../module/authUtil');
const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const pool = require('../module/poolAsync');
const encrypt = require('../module/encryption');
const jwt = require('../module/jwt');

module.exports = {
    signin: async({
        email,
        password
    }) => {
        const table = 'user';
        const query = `SELECT * FROM ${table} WHERE email = '${email}'`;
        return pool.queryParam_None(query)
            .then(async (userResult) => {
                console.log(userResult);
                if (userResult.length == 0) {
                    return {
                        code: statusCode.NOT_FOUND,
                        json: authUtil.successFalse(statusCode.NOT_FOUND, responseMessage.NO_USER)
                    };
                }
                const user = userResult[0];
                // 비밀번호 체크
                const {
                    hashed
                } = await encrypt.encryptWithSalt(password, user.salt);
                if (user.password != hashed) {
                    return {
                        code: statusCode.UNAUTHORIZED,
                        json: authUtil.successFalse(statusCode.UNAUTHORIZED, responseMessage.MISS_MATCH_PW)
                    };
                }

                // 로그인 성공
                const result = jwt.sign(user);
                const token = result.token;
                const userIdx = userResult[0].userIdx;
                const name  = userResult[0].name;
                console.log(token);
                if(!token){ //토큰 생성 못함
                    return {
                        code: statusCode.INTERNAL_SERVER_ERROR,
                        json: authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.EMPTY_TOKEN)
                    }
                } else{   //토큰 생성
                    const finalResult = {token, userIdx, name};
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, responseMessage.SIGN_IN_SUCCESS, finalResult)
                    } 
                }   
                /*
                return {
                    code: statusCode.OK,
                    json: authUtil.successTrue(responseMessage.SIGN_IN_SUCCESS, {jwt: token, userIdx: jwt.verify(token).idx, name: userResult[0].name})
                }*/
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    },
    signup: async({
        password,
        salt,
        name,
        email
    }) => {
        const table = 'user';
        const fields = 'name, password, salt, email';
        const questions = `?, ?, ?, ?`;
        const values = [name, password, salt, email];
        return pool.queryParam_Parse(`INSERT INTO ${table}(${fields}) VALUES(${questions})`, values)
            .then(result => {
                if (result.code && result.json) return result;
                const userId = result.insertId;
                return {
                    code: statusCode.OK,
                    json: authUtil.successTrue(statusCode.OK, responseMessage.SIGN_UP_SUCCESS, userId)
                };
            })
            .catch(err => {
                // ER_DUP_ENTRY
                if(err.errno == 1062){
                    console.log(err.errno, err.code);
                    return {
                        code: statusCode.BAD_REQUEST,
                        json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.ALREADY_ID)
                    };
                }
                console.log(err);
                throw err;
            });
    },
    checkUser : async (email) => {
        const table = 'user';
        const query = `SELECT * FROM ${table} WHERE email = '${email}'`;
        return await pool.queryParam_None(query)
            .then(async (userResult) => {
                if (userResult.length == 0) return true;
                else return false;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }
};