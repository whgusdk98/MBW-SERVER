const authUtil = require('../module/authUtil');
const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage')
const pool = require('../module/poolAsync');


module.exports = {
    addLocation: async (category, address, GPSX, GPSY, userIdx) => { //집이나 직장 주소 추가
        const table = 'myLocation';
        const fields = 'category, address, GPSX, GPSY, userIdx';
        const questions = `?,?,?,?,?`;
        const query = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [category, address, GPSX, GPSY, userIdx];
        return await pool.queryParam_Arr(query, values)
            .then(result => {
                if (result.length != 0){ 
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, responseMessage.ADD_MY_LOCATION_SUCCESS)
                    };
                }
            })
            .catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.ADD_MY_LOCATION_FAIL)
                })
            })
    },

    updateLocation: async(category, address, GPSX, GPSY, userIdx) => {
        const table = 'myLocation';
        const query = `UPDATE ${table} 
                    SET address='${address}', GPSX=${GPSX}, GPSY=${GPSY}
                    WHERE category = ${category} AND userIdx = ${userIdx}`
        return await pool.queryParam_None(query)
            .then(result => {
                if (result.length != 0){ 
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, responseMessage.ADD_MY_LOCATION_SUCCESS)
                    };
                }
            })
            .catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.ADD_MY_LOCATION_FAIL)
                })
            })
    },

    getLocation: async (category, userIdx) => {
        const table = 'myLocation';
        const query = `SELECT * FROM ${table} WHERE category = ${category} AND userIdx = ${userIdx}`;
        return await pool.queryParam_None(query)
            .then(result => {
                console.log(result);
                if (result.length != 0){ //존재하면 result 반환
                    console.log("1");
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, responseMessage.GET_MY_LOCATION_SUCCESS, result)
                    };
                }
                //존재하지 않으면 아무것도 반환x
            })
            .catch((err) => {
                console.log("3");
                return ({
                    code: statusCode.NOT_FOUND,
                    json: authUtil.successFalse(statusCode.NOT_FOUND, responseMessage.GET_MY_LOCATION_FAIL)
                })
            })
    },






    addFavoritePath: async (startAddress, startLongi, startLati, endAddress, endLongi, endLati, userIdx) => { //집이나 직장 주소 추가
        const table = 'favoritePath';
        const fields = 'startAddress, startLongi, startLati, endAddress, endLongi, endLati, userIdx';
        const questions = `?,?,?,?,?,?,?`;
        const query = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [startAddress, startLongi, startLati, endAddress, endLongi, endLati, userIdx];
        return await pool.queryParam_Arr(query, values)
            .then(result => {
                if (result.length != 0){ 
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, responseMessage.ADD_FAVORITE_PATH_SUCCESS)
                    };
                }
            })
            .catch((err) => {
                return ({
                    code: statusCode.BAD_REQUEST,
                    json: authUtil.successFalse(statusCode.BAD_REQUEST, responseMessage.ADD_FAVORITE_PATH_FAIL)
                })
            })
    },

    getFavoritePath: async (startAddress, endAddress, userIdx) => {
        const table = 'favoritePath';

        if(startAddress != null){
            var query = `SELECT * FROM ${table} WHERE startAddress = '${startAddress}' AND endAddress = '${endAddress}' AND userIdx = ${userIdx}`;
        }
        else{
            var query = `SELECT * FROM ${table} WHERE userIdx = ${userIdx}`;
        }
        return await pool.queryParam_None(query)
            .then(result => {
                console.log(result);
                if (result.length != 0){ //존재하면 result 반환
                    console.log("1");
                    return {
                        code: statusCode.OK,
                        json: authUtil.successTrue(statusCode.OK, responseMessage.GET_FAVORITE_PATH_SUCCESS, result)
                    };
                }
                //존재하지 않으면 아무것도 반환x
            })
            .catch((err) => {
                console.log("3");
                return ({
                    code: statusCode.NOT_FOUND,
                    json: authUtil.successFalse(statusCode.NOT_FOUND, responseMessage.GET_FAVORITE_PATH_FAIL)
                })
            })
    }

}
