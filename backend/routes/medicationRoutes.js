const express = require('express');
const router = express.Router();
const {
  getMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
  markTaken,
  markMissed,
  markSkipped
} = require('../controllers/medicationController');

// Basic CRUD
router.route('/')
  .get(getMedications)
  .post(createMedication);

router.route('/:id')
  .get(getMedicationById)
  .put(updateMedication)
  .delete(deleteMedication);

// Status logging endpoints
router.post('/:id/taken', markTaken);
router.post('/:id/missed', markMissed);
router.post('/:id/skipped', markSkipped);

module.exports = router;
