'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { isAdminRole, hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import {
    isValidBimester,
    isValidWeekNumber,
    turnExistsById,
} from '#helpers/turn-validator.js';
import { classExistsById } from '#helpers/class-validator.js';
import {
    getCurrentTurn,
    getTurns,
    getTurnById,
    generateBimesterSchedule,
    createTurn,
    awardGuardianBonus,
    updateTurn,
    deleteTurn,
} from './turn.controller.js';

const router = Router();

// Consultar turno actual (Cualquier usuario autenticado)
router.get('/current', [validateJWT, validateFields], getCurrentTurn);

// Consultar calendario de turnos (Cualquier usuario autenticado)
router.get('/', [validateJWT, validateFields], getTurns);

// Consultar turno por ID (Cualquier usuario autenticado)
router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(turnExistsById),
        validateFields,
    ],
    getTurnById
);

// Generar matriz de 8 semanas de un bimestre automáticamente (ADMIN o COORDINATOR)
router.post(
    '/generate-schedule',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('bimester', 'El bimestre es obligatorio').not().isEmpty(),
        check('bimester').custom(isValidBimester),
        check('startDate', 'La fecha de inicio debe ser válida').optional().isISO8601(),
        validateFields,
    ],
    generateBimesterSchedule
);

// Crear turno manual (ADMIN o COORDINATOR)
router.post(
    '/',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('bimester', 'El bimestre es obligatorio').not().isEmpty(),
        check('bimester').custom(isValidBimester),
        check('weekNumber', 'El número de semana es obligatorio').not().isEmpty(),
        check('weekNumber').custom(isValidWeekNumber),
        check('startDate', 'La fecha de inicio es obligatoria').isISO8601(),
        check('endDate', 'La fecha de finalización es obligatoria').isISO8601(),
        validateFields,
    ],
    createTurn
);

// Otorgar bono de guardia a una sección (ADMIN o COORDINATOR)
router.post(
    '/:id/bonus',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(turnExistsById),
        check('classGroupId', 'El ID de la sección es obligatorio').not().isEmpty(),
        check('classGroupId').custom(isValidMongoId),
        check('classGroupId').custom(classExistsById),
        check('points', 'Los puntos de bono deben ser un número').optional().isNumeric(),
        validateFields,
    ],
    awardGuardianBonus
);

// Actualizar turno (ADMIN o COORDINATOR)
router.put(
    '/:id',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(turnExistsById),
        check('bimester').optional().custom(isValidBimester),
        check('weekNumber').optional().custom(isValidWeekNumber),
        check('startDate').optional().isISO8601(),
        check('endDate').optional().isISO8601(),
        validateFields,
    ],
    updateTurn
);

// Desactivar / eliminar turno (solo ADMIN)
router.delete(
    '/:id',
    [
        validateJWT,
        isAdminRole,
        check('id').custom(isValidMongoId),
        check('id').custom(turnExistsById),
        validateFields,
    ],
    deleteTurn
);

export default router;
