'use strict';

import User from '#eg/users/user.model.js';

export const VALID_ROLES = [
    'ADMIN',
    'COORDINATOR',
    'TEACHER',
    'STUDENT',
];

/**
 * Valida que el rol ingresado pertenezca a la lista de roles permitidos.
 * @param {string} role
 * @returns {boolean}
 */
export const isValidRole = (role = '') => {
    if (role && !VALID_ROLES.includes(role.toUpperCase())) {
        throw new Error(
            `El rol '${role}' no es válido. Roles permitidos: ${VALID_ROLES.join(', ')}`
        );
    }
    return true;
};

/**
 * Valida que el correo electrónico no esté registrado previamente.
 * @param {string} email
 */
export const existentEmail = async (email = '') => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
        throw new Error(`El correo '${email}' ya se encuentra registrado.`);
    }
};

/**
 * Valida que el usuario exista por su ID y esté activo.
 * @param {string} id
 */
export const userExistsById = async (id = '') => {
    const user = await User.findOne({ _id: id, status: true });
    if (!user) {
        throw new Error(`El usuario con ID '${id}' no existe o ha sido dado de baja.`);
    }
};

/**
 * Valida que el código institucional (carné) no esté duplicado si se proporciona.
 * @param {string} code
 */
export const existentCode = async (code = '') => {
    if (!code) return;
    const existing = await User.findOne({ code: String(code).trim() });
    if (existing) {
        throw new Error(`El código institucional / carné '${code}' ya está en uso.`);
    }
};
