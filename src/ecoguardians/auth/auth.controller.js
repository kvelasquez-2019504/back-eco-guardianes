'use strict';

import User from '../users/user.model.js';
import { isValidPassword } from '#helpers/encrypt.js';
import { generateJWT } from '#helpers/generate-jwt.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales inválidas - correo electrónico no registrado.',
            });
        }

        if (!user.status) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales inválidas - usuario inactivo o dado de baja.',
            });
        }

        const validPassword = await isValidPassword(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales inválidas - contraseña incorrecta.',
            });
        }

        const token = await generateJWT(user._id, user.role);

        return res.status(200).json({
            ok: true,
            msg: 'Inicio de sesión exitoso.',
            user,
            token,
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado en el inicio de sesión, contacte al administrador.',
            error: error.message,
        });
    }
};

export const renewToken = async (req, res) => {
    try {
        const { user } = req;
        const token = await generateJWT(user._id, user.role);

        return res.status(200).json({
            ok: true,
            msg: 'Token revalidado exitosamente.',
            user,
            token,
        });
    } catch (error) {
        console.error('Error al renovar token:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al renovar token, contacte al administrador.',
            error: error.message,
        });
    }
};
