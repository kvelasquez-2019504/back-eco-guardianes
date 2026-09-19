'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { isAdminRole, hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import {
    existentCriterionTitle,
    criterionExistsById,
    isValidCategory,
} from '#helpers/rubric-validator.js';
import {
    createCriterion,
    getCriteria,
    getCriterionById,
    updateCriterion,
    toggleCriterionActive,
    deleteCriterion,
    seedCriteria,
} from './rubric.controller.js';

const router = Router();

// Consultar criterios de rúbrica (Cualquier usuario autenticado para saber qué se evalúa)
router.get('/', [validateJWT, validateFields], getCriteria);

// Consultar un criterio por ID
router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(criterionExistsById),
        validateFields,
    ],
    getCriterionById
);

// Crear un nuevo criterio de rúbrica (ADMIN o COORDINATOR)
router.post(
    '/',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('title', 'El título del criterio es obligatorio').not().isEmpty().trim(),
        check('title').custom(existentCriterionTitle),
        check('points', 'El puntaje debe ser un valor numérico').isNumeric(),
        check('category').optional().custom(isValidCategory),
        validateFields,
    ],
    createCriterion
);

// Inicializar criterios por defecto (solo ADMIN)
router.post('/seed', [validateJWT, isAdminRole, validateFields], seedCriteria);

// Actualizar un criterio de rúbrica (ADMIN o COORDINATOR)
router.put(
    '/:id',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(criterionExistsById),
        check('category').optional().custom(isValidCategory),
        validateFields,
    ],
    updateCriterion
);

// Alternar activación/desactivación del criterio para evaluaciones (ADMIN o COORDINATOR)
router.patch(
    '/:id/toggle',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(criterionExistsById),
        validateFields,
    ],
    toggleCriterionActive
);

// Desactivar / eliminar criterio (solo ADMIN)
router.delete(
    '/:id',
    [
        validateJWT,
        isAdminRole,
        check('id').custom(isValidMongoId),
        check('id').custom(criterionExistsById),
        validateFields,
    ],
    deleteCriterion
);

export default router;
