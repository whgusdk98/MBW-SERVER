const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const pool = require('../module/poolAsync');


module.exports = {
    find: (odsayCode) => {
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
    }
}