const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateBody, validateUUIDParam, isValidISO8601 } = require('../middleware/validation');
const Plant = require('../models/Plant');
const CareSchedule = require('../models/CareSchedule');
const CareAction = require('../models/CareAction');
const { computeCareStatus } = require('../utils/careStatus');
const { NotFoundError, ValidationError, UnprocessableError } = require('../utils/errors');

const VALID_CARE_TYPES = ['watering', 'fertilizing', 'repotting'];

router.use(authenticate);

// POST /api/v1/plants/:id/care-actions
router.post(
  '/:id/care-actions',
  validateUUIDParam('id'),
  validateBody([
    {
      field: 'care_type',
      required: true,
      type: 'string',
      enum: VALID_CARE_TYPES,
    },
  ]),
  async (req, res, next) => {
    try {
      const { care_type, performed_at } = req.body;

      // Validate performed_at if provided
      if (performed_at !== undefined && performed_at !== null) {
        if (!isValidISO8601(performed_at)) {
          throw new ValidationError('performed_at must be a valid ISO 8601 datetime.');
        }
        if (new Date(performed_at) > new Date()) {
          throw new ValidationError('performed_at must not be in the future.');
        }
      }

      // Check plant ownership
      const plant = await Plant.findByIdAndUser(req.params.id, req.user.id);
      if (!plant) {
        throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
      }

      // Check that a schedule exists for this care type
      const schedule = await CareSchedule.findByPlantAndType(plant.id, care_type);
      if (!schedule) {
        throw new UnprocessableError(
          `Plant does not have a schedule configured for ${care_type}.`,
          'NO_SCHEDULE_FOR_CARE_TYPE'
        );
      }

      // Create the care action
      const effectivePerformedAt = performed_at || new Date().toISOString();
      const action = await CareAction.create({
        plant_id: plant.id,
        care_type,
        performed_at: effectivePerformedAt,
      });

      // Update the schedule's last_done_at
      const updatedSchedule = await CareSchedule.updateLastDoneAt(schedule.id, effectivePerformedAt);
      const enriched = computeCareStatus({
        id: updatedSchedule.id,
        care_type: updatedSchedule.care_type,
        frequency_value: updatedSchedule.frequency_value,
        frequency_unit: updatedSchedule.frequency_unit,
        last_done_at: updatedSchedule.last_done_at,
      });

      res.status(201).json({
        data: {
          care_action: {
            id: action.id,
            plant_id: action.plant_id,
            care_type: action.care_type,
            performed_at: action.performed_at,
            note: action.note,
          },
          updated_schedule: enriched,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/plants/:id/care-actions/:action_id
router.delete(
  '/:id/care-actions/:action_id',
  validateUUIDParam('id'),
  validateUUIDParam('action_id'),
  async (req, res, next) => {
    try {
      // Check plant ownership
      const plant = await Plant.findByIdAndUser(req.params.id, req.user.id);
      if (!plant) {
        throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
      }

      // Check action exists and belongs to this plant
      const action = await CareAction.findByIdAndPlant(req.params.action_id, plant.id);
      if (!action) {
        throw new NotFoundError('Care action', 'ACTION_NOT_FOUND');
      }

      // Delete the action
      await CareAction.delete(action.id);

      // Revert the schedule's last_done_at to the previous action
      const schedule = await CareSchedule.findByPlantAndType(plant.id, action.care_type);
      const previousAction = await CareAction.findLatestByPlantAndType(plant.id, action.care_type);

      const newLastDoneAt = previousAction ? previousAction.performed_at : null;
      const updatedSchedule = await CareSchedule.updateLastDoneAt(schedule.id, newLastDoneAt);

      const enriched = computeCareStatus({
        id: updatedSchedule.id,
        care_type: updatedSchedule.care_type,
        frequency_value: updatedSchedule.frequency_value,
        frequency_unit: updatedSchedule.frequency_unit,
        last_done_at: updatedSchedule.last_done_at,
      });

      res.status(200).json({
        data: {
          deleted_action_id: action.id,
          updated_schedule: enriched,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
