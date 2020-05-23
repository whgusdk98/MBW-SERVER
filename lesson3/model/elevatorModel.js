const statusCode = require('../module/statusCode');
const responseMessage = require('../module/responseMessage');
const pool = require('../module/poolAsync');


module.exports = {
    find: ({
        categoryBool,
        subwayCode, 
        startName
    }) => {
        const table = 'elevatorInfo';
        let stName = String(startName).split('(')[0];
        const query = `SELECT * FROM ${table} WHERE categoryBool = '${categoryBool}' AND subwayCode = '${subwayCode}' AND stationName = '${stName}'`;
        //const query = `SELECT * FROM ${table} WHERE categoryBool = '1' AND subwayCode = '4' AND  stationName = '숙대입구'`;
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