var express = require('express');
var router = express.Router();

console.log('trace: /api/board.js');
router.get('/', (req, res)=>{
    res.status(200).send({ 
        message: "this is /api/board"
    })
})

module.exports = router;