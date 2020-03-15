var express = require('express');
var router = express.Router();


router.use('/users', require('./users')); 
//router.use('/boards', require('./boards'));
router.use('/searchPath', require('./searchPath'));
router.use('/addMyPath', require('./addMyPath'));
router.use('/problemArea', require('./problemArea'));
router.use('/myPlace',require('./myPlace'));

module.exports = router;
