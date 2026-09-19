'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import { levelExistsById } from '#helpers/level-validator.js';
import { classExistsById, isUserTeacher } from '#helpers/class-validator.js';
import {
    createClassGroup,
    getClassGroups,
    getClassGroupById,
    assignTeacher,
    getMyClasses,
    updateClassGroup,
    deleteClassGroup,
} from './classGroup.controller.js';

const router = Router();

// Consultar mis clases (para TEACHER)
router.get(
    '/my-classes',
    [validateJWT, hasRole('TEACHER', 'ADMIN', 'COORDINATOR'), validateFields],
    getMyClasses
);

// Listar clases con filtros
router.get('/', [validateJWT, validateFields], getClassGroups);

// Obtener clase por ID
router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(classExistsById),
        validateFields,
    ],
    getClassGroupById
);

// Crear clase (ADMIN o COORDINATOR)
router.post(
    '/',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('levelId', 'El ID del nivel educativo es obligatorio').not().isEmpty(),
        check('levelId').custom(isValidMongoId),
        check('levelId').custom(levelExistsById),
        check('section', 'La sección es obligatoria').not().isEmpty().trim(),
        check('careerId').optional().custom(isValidMongoId),
        check('teacherId').optional().custom(isValidMongoId),
        check('teacherId').optional().custom(isUserTeacher),
        validateFields,
    ],
    createClassGroup
);

// Asignar o cambiar profesor de la clase (ADMIN o COORDINATOR)
router.put(
    '/:id/teacher',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(classExistsById),
        check('teacherId', 'El ID del profesor es obligatorio').not().isEmpty(),
        check('teacherId').custom(isValidMongoId),
        check('teacherId').custom(isUserTeacher),
        validateFields,
    ],
    assignTeacher
);

// Actualizar clase (ADMIN o COORDINATOR)
router.put(
    '/:id',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(classExistsById),
        validateFields,
    ],
    updateClassGroup
);

// Desactivar clase (ADMIN o COORDINATOR)
router.delete(
    '/:id',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('id').custom(isValidMongoId),
        check('id').custom(classExistsById),
        validateFields,
    ],
    deleteClassGroup
);

export default router;
