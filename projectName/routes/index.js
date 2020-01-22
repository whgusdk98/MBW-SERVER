var express = require('express');
var router = express.Router();

var url = require('url');
var parseObject = url.parse('http://www.seoulmetro.co.kr/kr/equipmentList.do?menuIdx=367');
console.log(parseObject)


console.log('trace: index.js');
router.use('/api', require('./api'));

module.exports = router;
