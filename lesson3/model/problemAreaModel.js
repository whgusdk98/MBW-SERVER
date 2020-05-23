const authUtil = require('../module/authUtil');
const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const pool = require('../module/poolAsync');

module.exports = {
    create: async({
        subwayCode,
        stationName,
        transfer, 
        nextStation,
        endExitNo,
        problemNo,
        problem
    }) => {
        const table = 'problemArea';
        const fields = 'subwayCode, stationName, transfer, nextStation, endExitNo, problemNo, problem';
        const questions = `?, ?, ?, ?, ?, ?, ?`;
        const query = `INSERT INTO ${table}(${fields}) VALUES(${questions})`;
        const values = [subwayCode, stationName, transfer, nextStation, endExitNo, problemNo, problem];
        return await pool.queryParam_Parse(query, values)
            .then(result => {
                //console.log(result);
                const problemAreaIdx = result.problemAreaIdx;
                return {
                    code: statusCode.OK,
                    json: authUtil.successTrue(statusCode.OK, responseMessage.BOARD_CREATE_SUCCESS, problemAreaIdx)
                };
            })
            .catch(err => {
                if (err.errno == 1452) {
                    console.log(err.errno, err.code);
                    return {
                        code: statusCode.BAD_REQUEST,
                        json: authUtil.successFalse([statusCode.BAD_REQUEST, responseMessage.BOARD_CREATE_FAIL].join(','))
                    };
                }
                console.log(err);
                throw err;
            });
    },

    read: async(subwayCode, stationName, transfer) => {
        const table = 'problemArea';
        let stName = (String(stationName)).split('(')[0];
        const query = `SELECT * FROM ${table} WHERE subwayCode = ${subwayCode} AND stationName = '${stName}' AND transfer = ${transfer}`;
        return await pool.queryParam_None(query)
            .then(result => {
                if (result != undefined) {
                    return result;
                }
                else{
                    return {};
                }
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }
};