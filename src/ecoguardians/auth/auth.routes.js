'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { login, renewToken } from './auth.controller.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { validateJWT } from '#middlewares/jwt-validator.js';

const router = Router();

router.post(
    '/login',
    [
        check('email', 'El correo electrónico es obligatorio').isEmail(),
        check('password', 'La contraseña es obligatoria').not().isEmpty(),
        validateFields,
    ],
    login
);

router.get('/renew', [validateJWT], renewToken);

export default router;
