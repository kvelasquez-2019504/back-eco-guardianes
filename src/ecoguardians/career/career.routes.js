'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { isAdminRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import {
    existentCareerName,
    careerExistsById,
} from '#helpers/career-validator.js';
import {
    createCareer,
    getCareers,
    getCareerById,
    updateCareer,
    deleteCareer,
    seedCareers,
} from './career.controller.js';

const router = Router();

router.get('/', [validateJWT, validateFields], getCareers);

router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(careerExistsById),
        validateFields,
    ],
    getCareerById
);

router.post(
    '/',
    [
        validateJWT,
        isAdminRole,
        check('name', 'El nombre de la carrera técnica es obligatorio').not().isEmpty().trim(),
        check('name').custom(existentCareerName),
        validateFields,
    ],
    createCareer
);

router.post(
    '/seed',
    [validateJWT, isAdminRole, validateFields],
    seedCareers
);

router.put(
    '/:id',
    [
        validateJWT,
        isAdminRole,
        check('id').custom(isValidMongoId),
        check('id').custom(careerExistsById),
        validateFields,
    ],
    updateCareer
);

router.delete(
    '/:id',
    [
        validateJWT,
        isAdminRole,
        check('id').custom(isValidMongoId),
        check('id').custom(careerExistsById),
        validateFields,
    ],
    deleteCareer
);

export default router;
