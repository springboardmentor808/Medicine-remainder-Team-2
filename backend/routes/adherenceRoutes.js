const express = require('express');
const router = express.Router();
const { getAdherence } = require('../controllers/adherenceController');

router.get('/', getAdherence);

module.exports = router;
