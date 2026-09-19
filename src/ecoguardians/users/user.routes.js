'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateFields } from '#middlewares/fields-validator.js';
import { validateJWT } from '#middlewares/jwt-validator.js';
import {
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
} from '#middlewares/role-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import {
    existentEmail,
    isValidRole,
    userExistsById,
    existentCode,
} from '#helpers/user-validator.js';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
} from './user.controller.js';

const router = Router();

router.post(
    '/',
    [
        canCreateUser,
        check('name', 'El nombre es obligatorio').not().isEmpty().trim(),
        check('lastName', 'El apellido es obligatorio').not().isEmpty().trim(),
        check('email', 'El formato del correo electrónico no es válido').isEmail(),
        check('email').custom(existentEmail),
        check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
        check('role').optional().custom(isValidRole),
        check('code').optional().custom(existentCode),
        validateFields,
    ],
    createUser
);

router.get(
    '/',
    [
        validateJWT,
        check('role').optional().custom(isValidRole),
        validateFields,
    ],
    getUsers
);

router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(userExistsById),
        validateFields,
    ],
    getUserById
);

router.put(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(userExistsById),
        canUpdateUser,
        check('role').optional().custom(isValidRole),
        validateFields,
    ],
    updateUser
);

router.delete(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(userExistsById),
        canDeleteUser,
        validateFields,
    ],
    deleteUser
);

export default router;

