const authUtil = { 
    successTrue: (statusCode, message, data) => { 
        return { 
            statusCode: statusCode, 
            message: message, 
            data: data
        } 
    }, 
    successFalse: (statusCode, message, data)=> { 
        return { 
            statusCode: statusCode, 
            message: message,
            data: null 
        } 
    }, 
    successFail: (statusCode, message, data)=> { 
        return { 
            statusCode: statusCode, 
            message: message,
            data: [] 
        } 
    }
} 
module.exports = authUtil;

