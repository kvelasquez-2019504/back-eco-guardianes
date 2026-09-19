'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { isAdminRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import {
    isValidStage,
    existentLevelName,
    levelExistsById,
} from '#helpers/level-validator.js';
import {
    createLevel,
    getLevels,
    getLevelById,
    updateLevel,
    deleteLevel,
    seedLevels,
} from './level.controller.js';

const router = Router();

router.get('/', [validateJWT, validateFields], getLevels);

router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(levelExistsById),
        validateFields,
    ],
    getLevelById
);

router.post(
    '/',
    [
        validateJWT,
        isAdminRole,
        check('name', 'El nombre del nivel es obligatorio').not().isEmpty().trim(),
        check('name').custom(existentLevelName),
        check('stage', 'La etapa es obligatoria (BASICO o DIVERSIFICADO)').not().isEmpty(),
        check('stage').custom(isValidStage),
        check('gradeNumber', 'El número de grado es obligatorio (1 al 6)').isNumeric(),
        validateFields,
    ],
    createLevel
);

router.post(
    '/seed',
    [validateJWT, isAdminRole, validateFields],
    seedLevels
);

router.put(
    '/:id',
    [
        validateJWT,
        isAdminRole,
        check('id').custom(isValidMongoId),
        check('id').custom(levelExistsById),
        check('stage').optional().custom(isValidStage),
        validateFields,
    ],
    updateLevel
);

router.delete(
    '/:id',
    [
        validateJWT,
        isAdminRole,
        check('id').custom(isValidMongoId),
        check('id').custom(levelExistsById),
        validateFields,
    ],
    deleteLevel
);

export default router;
