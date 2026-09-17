'use strict';

import Level from './level.model.js';
import { seedLevels as seedLevelsHelper } from '#helpers/init-seeders.js';

export const createLevel = async (req, res) => {
    try {
        const { name, stage, gradeNumber, allowedSections } = req.body;

        const level = new Level({
            name: name.trim(),
            stage: stage.toUpperCase(),
            gradeNumber: Number(gradeNumber),
            allowedSections: allowedSections || [],
        });

        await level.save();

        return res.status(201).json({
            ok: true,
            msg: 'Nivel educativo creado exitosamente.',
            level,
        });
    } catch (error) {
        console.error('Error al crear nivel:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear nivel, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getLevels = async (req, res) => {
    try {
        const query = { status: true };
        const levels = await Level.find(query).sort({ gradeNumber: 1 });

        return res.status(200).json({
            ok: true,
            msg: 'Niveles educativos obtenidos exitosamente.',
            total: levels.length,
            levels,
        });
    } catch (error) {
        console.error('Error al obtener niveles:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al obtener niveles, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getLevelById = async (req, res) => {
    try {
        const { id } = req.params;
        const level = await Level.findById(id);

        return res.status(200).json({
            ok: true,
            msg: 'Nivel educativo encontrado exitosamente.',
            level,
        });
    } catch (error) {
        console.error('Error al buscar nivel:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar nivel, contacte al administrador.',
            error: error.message,
        });
    }
};

export const updateLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, ...rest } = req.body;

        if (stage) {
            rest.stage = stage.toUpperCase();
        }

        const level = await Level.findByIdAndUpdate(id, rest, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Nivel educativo actualizado exitosamente.',
            level,
        });
    } catch (error) {
        console.error('Error al actualizar nivel:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al actualizar nivel, contacte al administrador.',
            error: error.message,
        });
    }
};

export const deleteLevel = async (req, res) => {
    try {
        const { id } = req.params;
        await Level.findByIdAndUpdate(id, { status: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Nivel educativo desactivado exitosamente.',
        });
    } catch (error) {
        console.error('Error al desactivar nivel:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al desactivar nivel, contacte al administrador.',
            error: error.message,
        });
    }
};

export const seedLevels = async (req, res) => {
    try {
        await seedLevelsHelper();
        return res.status(200).json({
            ok: true,
            msg: 'Niveles educativos de Kinal inicializados exitosamente.',
        });
    } catch (error) {
        console.error('Error al inicializar niveles:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al inicializar niveles por defecto.',
            error: error.message,
        });
    }
};
