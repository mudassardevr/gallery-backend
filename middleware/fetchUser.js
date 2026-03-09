const jwt = require('jsonwebtoken');

module.exports = function(req , res , next) {

    const token = req.header("auth-token");

    if(!token){
        return res.status(401).json({error : "N token"});
    }

    try {
        const decoded = jwt.verify(token , process.env.JWT_SECRET)
        req.user = decoded.user;
        next();        
    } catch (error) {
         return res.status(401).json({error: "Invalid token"});
    }


}