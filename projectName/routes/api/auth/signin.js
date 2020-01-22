var express = require('express');
var router = express.Router();

console.log('trace: /api/auth/signin.js');
router.get('/', (req, res)=>{
    res.status(200).send({ 
        message: "this is /api/signin"
    })
})

module.exports = router;