const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const pool = require('../module/poolAsync');


module.exports = {
    find: async (odsayCode) => {
        const table = 'subwayCode';
        const query = `SELECT * FROM ${table} WHERE odsayCode = ${odsayCode}`;
        return pool.queryParam_None(query)
            .then(async (result) => {
                if (result.length == 0) {
                    return {
                        code: statusCode.BAD_REQUEST,
                        json: {}
                    }
                }
                return {
                    code: statusCode.OK,
                    json: result
                };
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    },
    transOdSayCode: async (publicCode) => {
        const table = 'subwayGPS';
        const query = `SELECT * FROM ${table} WHERE stationCodeNoUsed = ${publicCode}`;
        return pool.queryParam_None(query)
            .then(async (result) => {
                console.log(result)
                if (result.length == 0) {
                    return {};
                }
                return result;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }
}