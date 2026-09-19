'use strict';

import jwt from 'jsonwebtoken';
import User from '#eg/users/user.model.js';

export const validateJWT = async (req, res, next) => {
    let token = req.header('x-token') || req.header('authorization') || req.header('Authorization');

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No se ha proporcionado un token en la petición.',
        });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimLeft();
    }

    try {
        const { uid } = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(uid);

        if (!user) {
            return res.status(401).json({
                ok: false,
                msg: 'Token no válido - usuario no existe en la base de datos.',
            });
        }

        if (!user.status) {
            return res.status(401).json({
                ok: false,
                msg: 'Token no válido - usuario con estado inactivo.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error al validar token:', error);
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido o expirado.',
        });
    }
};
