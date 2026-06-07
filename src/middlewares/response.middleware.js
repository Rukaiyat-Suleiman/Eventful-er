const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
    const responseObj = {
        success,
        statusCode,
        message,
        data: data || error
    };
    if (error !== null) {
        responseObj.error = error;
    }
    res.status(statusCode).json(responseObj);
};

module.exports = sendResponse;
