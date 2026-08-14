const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/historyController');

router.get('/', getHistory);

router.get('/daily', (req, res, next) => {
  req.query.type = 'day';
  getHistory(req, res, next);
});

router.get('/weekly', (req, res, next) => {
  req.query.type = 'week';
  getHistory(req, res, next);
});

router.get('/monthly', (req, res, next) => {
  req.query.type = 'month';
  getHistory(req, res, next);
});

module.exports = router;
