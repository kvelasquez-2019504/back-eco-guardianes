'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import { classExistsById } from '#helpers/class-validator.js';
import { isValidShift, enrollmentExistsById } from '#helpers/enrollment-validator.js';
import {
    enrollStudent,
    getClassStudents,
    getMyEnrollment,
    unenrollStudent,
} from './enrollment.controller.js';

const router = Router();

// Ver listado de alumnos de una clase (TEACHER de la clase, COORDINATOR del nivel, o ADMIN)
router.get(
    '/class/:classGroupId/students',
    [
        validateJWT,
        check('classGroupId').custom(isValidMongoId),
        check('classGroupId').custom(classExistsById),
        validateFields,
    ],
    getClassStudents
);

// Ver mis propias clases matriculadas (STUDENT)
router.get('/my-enrollment', [validateJWT, validateFields], getMyEnrollment);

// Inscribir alumno(s) en una clase y jornada (ADMIN o COORDINATOR)
router.post(
    '/',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('classGroupId', 'El ID de la clase es obligatorio').not().isEmpty(),
        check('classGroupId').custom(isValidMongoId),
        check('classGroupId').custom(classExistsById),
        check('shift', 'La jornada es obligatoria (MATUTINA o VESPERTINA)').not().isEmpty(),
        check('shift').custom(isValidShift),
        validateFields,
    ],
    enrollStudent
);

// Desinscribir alumno de una clase (ADMIN o COORDINATOR)
router.delete(
    '/:id',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(enrollmentExistsById),
        validateFields,
    ],
    unenrollStudent
);

export default router;
