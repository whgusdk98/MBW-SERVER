var express = require('express');
var router = express.Router();

console.log('trace: /api/index.js');
router.use('/board', require('./board'));
router.use('/auth', require('./auth'));

module.exports = router;