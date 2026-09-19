'use strict';

import User from './user.model.js';
import { encryptPassword } from '#helpers/encrypt.js';

export const createUser = async (req, res) => {
    try {
        const { name, lastName, email, password, role, code } = req.body;
        const hashedPassword = await encryptPassword(password);

        const user = new User({
            name: name.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role ? role.toUpperCase() : 'STUDENT',
            code: code ? String(code).trim() : null,
            ecoAura: {
                points: 0,
                level: 'NOVATO',
            },
        });

        await user.save();

        return res.status(201).json({
            ok: true,
            msg: 'Usuario creado exitosamente.',
            user,
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear usuario, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { limit = 50, from = 0, role } = req.query;
        const query = { status: true };

        if (role) {
            query.role = role.toUpperCase();
        }

        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .skip(Number(from))
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
        ]);

        return res.status(200).json({
            ok: true,
            msg: 'Usuarios obtenidos exitosamente.',
            total,
            users,
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al obtener usuarios, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        return res.status(200).json({
            ok: true,
            msg: 'Usuario encontrado exitosamente.',
            user,
        });
    } catch (error) {
        console.error('Error al buscar usuario por ID:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar usuario, contacte al administrador.',
            error: error.message,
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, email, role, ecoAura, ...rest } = req.body;

        if (password) {
            rest.password = await encryptPassword(password);
        }

        if (role) {
            rest.role = role.toUpperCase();
        }

        const user = await User.findByIdAndUpdate(id, rest, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Usuario actualizado exitosamente.',
            user,
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al actualizar usuario, contacte al administrador.',
            error: error.message,
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndUpdate(id, { status: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Usuario desactivado exitosamente.',
        });
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al desactivar usuario, contacte al administrador.',
            error: error.message,
        });
    }
};


