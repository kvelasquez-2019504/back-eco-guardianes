'use strict';

import jwt from 'jsonwebtoken';
import User from '../ecoguardians/users/user.model.js';

export const isAdminRole = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            ok: false,
            msg: 'Se quiere verificar el rol sin validar el token primero.',
        });
    }

    const { role, name } = req.user;

    if (role !== 'ADMIN') {
        return res.status(403).json({
            ok: false,
            msg: `${name} no tiene permisos de Administrador para realizar esta acción.`,
        });
    }

    next();
};

export const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({
                ok: false,
                msg: 'Se quiere verificar el rol sin validar el token primero.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                ok: false,
                msg: `El servicio requiere uno de estos roles: ${roles.join(', ')}. Tu rol actual es: ${req.user.role}`,
            });
        }

        next();
    };
};

/**
 * Middleware para validar permisos al crear un usuario:
 * - Sin token (registro público): Se prohíbe autoasignarse roles privilegiados y se fuerza a STUDENT.
 * - ADMIN: Puede crear cualquier rol.
 * - COORDINATOR: Solo puede crear TEACHER o STUDENT.
 * - TEACHER o STUDENT: No pueden crear usuarios.
 */
export const canCreateUser = async (req, res, next) => {
    let token = req.header('x-token') || req.header('authorization') || req.header('Authorization');

    if (token) {
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }

        try {
            const { uid } = jwt.verify(token, process.env.JWT_SECRET);
            const authUser = await User.findOne({ _id: uid, status: true });

            if (authUser) {
                req.user = authUser;
            }
        } catch (error) {
            // Token inválido en petición autenticada
            return res.status(401).json({
                ok: false,
                msg: 'Token inválido o expirado.',
            });
        }
    }

    // Caso 1: Usuario autenticado
    if (req.user) {
        const { role } = req.user;
        const requestedRole = req.body.role ? req.body.role.toUpperCase() : 'STUDENT';

        if (role === 'ADMIN') {
            return next();
        }

        if (role === 'COORDINATOR') {
            if (['ADMIN', 'COORDINATOR'].includes(requestedRole)) {
                return res.status(403).json({
                    ok: false,
                    msg: 'Los coordinadores solo tienen autorización para crear usuarios con rol TEACHER o STUDENT.',
                });
            }
            return next();
        }

        // TEACHER o STUDENT autenticados no pueden crear usuarios
        return res.status(403).json({
            ok: false,
            msg: `Los usuarios con rol ${role} no tienen permisos para registrar nuevos usuarios en el sistema.`,
        });
    }

    // Caso 2: Registro público (sin token)
    if (req.body.role && req.body.role.toUpperCase() !== 'STUDENT') {
        return res.status(403).json({
            ok: false,
            msg: 'No tienes autorización para autoasignarte roles privilegiados. El registro público solo permite rol STUDENT.',
        });
    }

    // Se asegura de que el rol asignado sea STUDENT
    req.body.role = 'STUDENT';
    next();
};

/**
 * Middleware para validar permisos al actualizar un usuario:
 * - ADMIN: Puede actualizar cualquier usuario y cualquier campo.
 * - COORDINATOR: Puede actualizar TEACHER o STUDENT (no ADMIN ni otros COORDINATOR).
 * - TEACHER o STUDENT: Solo puede actualizar su propio perfil y no puede alterar rol, status ni ecoAura.
 */
export const canUpdateUser = async (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            ok: false,
            msg: 'Se requiere autenticación para actualizar un usuario.',
        });
    }

    const authRole = req.user.role;
    const authId = req.user._id.toString();
    const targetId = req.params.id;

    if (authRole === 'ADMIN') {
        return next();
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
        return res.status(404).json({
            ok: false,
            msg: 'Usuario a modificar no encontrado.',
        });
    }

    if (authRole === 'COORDINATOR') {
        if (targetUser.role === 'ADMIN') {
            return res.status(403).json({
                ok: false,
                msg: 'Los coordinadores no tienen autorización para modificar a un Administrador.',
            });
        }

        if (targetUser.role === 'COORDINATOR' && authId !== targetId) {
            return res.status(403).json({
                ok: false,
                msg: 'Los coordinadores no pueden modificar a otros coordinadores.',
            });
        }

        if (req.body.role && ['ADMIN', 'COORDINATOR'].includes(req.body.role.toUpperCase())) {
            return res.status(403).json({
                ok: false,
                msg: 'Los coordinadores no pueden ascender usuarios a roles ADMIN o COORDINATOR.',
            });
        }

        return next();
    }

    // TEACHER o STUDENT: solo pueden actualizar su propio perfil
    if (authId !== targetId) {
        return res.status(403).json({
            ok: false,
            msg: 'No tienes permisos para modificar el perfil de otros usuarios.',
        });
    }

    // Proteger campos críticos para que el usuario no se auto-modifique privilegios ni puntos
    delete req.body.role;
    delete req.body.status;
    delete req.body.ecoAura;
    delete req.body.code;

    next();
};

/**
 * Middleware para validar permisos al eliminar (desactivar) un usuario:
 * - ADMIN: Puede desactivar a cualquier usuario.
 * - COORDINATOR: Solo puede desactivar usuarios TEACHER o STUDENT.
 * - TEACHER o STUDENT: No pueden desactivar usuarios.
 */
export const canDeleteUser = async (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            ok: false,
            msg: 'Se requiere autenticación para desactivar un usuario.',
        });
    }

    const authRole = req.user.role;
    const targetId = req.params.id;

    if (authRole === 'ADMIN') {
        return next();
    }

    if (authRole === 'COORDINATOR') {
        const targetUser = await User.findById(targetId);
        if (!targetUser) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario a desactivar no encontrado.',
            });
        }

        if (['ADMIN', 'COORDINATOR'].includes(targetUser.role)) {
            return res.status(403).json({
                ok: false,
                msg: 'Los coordinadores solo tienen permisos para desactivar a usuarios con rol TEACHER o STUDENT.',
            });
        }

        return next();
    }

    return res.status(403).json({
        ok: false,
        msg: 'No tienes permisos para desactivar usuarios en el sistema.',
    });
};

