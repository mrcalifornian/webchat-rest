const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let bearer = req.get('Authorization');

    if (!bearer) {
        console.log(bearer);
        const error = new Error('Not authorized!');
        error.statuscode = 401;
        throw error;
    }

    let token = bearer.split(" ")[1];
    let decodedToken;

    try {
        decodedToken = jwt.verify(token, 'mysupersecretisnothere');
    } catch (error) {
        error.statuscode = 500;
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Not authorized!');
        error.statuscode = 403;
        throw error;
    }

    req.userID = decodedToken.userID;
    // console.log(decodedToken.userID);
    next();
}