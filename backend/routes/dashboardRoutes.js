const express = require('express');
const router = express.Router();
const { getDashboardData, resetSeed, clearAll } = require('../controllers/dashboardController');

router.get('/', getDashboardData);
router.post('/reset-seed', resetSeed);
router.post('/clear-all', clearAll);

module.exports = router;
