'use strict';

import jwt from 'jsonwebtoken';

export const generateJWT = (uid = '', role = '') => {
    return new Promise((resolve, reject) => {
        const payload = { uid, role };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: '8h',
            },
            (err, token) => {
                if (err) {
                    console.error('Error al generar JWT:', err);
                    reject('No se pudo generar el token');
                } else {
                    resolve(token);
                }
            }
        );
    });
};
