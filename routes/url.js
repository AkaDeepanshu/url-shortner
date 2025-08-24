const express = require('express')
const router = express.Router();
const {handleGenerateShortURL,handleGetUrlAnalytics} = require('../controllers/url')

router.post('/',handleGenerateShortURL);
router.get('/analytics/:shortId',handleGetUrlAnalytics);


module.exports = router;