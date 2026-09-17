'use strict';

import RubricCriterion from './rubric.model.js';
import { seedRubrics as seedRubricsHelper } from '#helpers/init-seeders.js';

export const createCriterion = async (req, res) => {
    try {
        const { title, description, points, category, order } = req.body;

        const criterion = new RubricCriterion({
            title: title.trim(),
            description: description ? description.trim() : '',
            points: Number(points) || 10,
            category: category ? category.toUpperCase() : 'GENERAL',
            order: order !== undefined ? Number(order) : 0,
            isActive: true,
            status: true,
        });

        await criterion.save();

        return res.status(201).json({
            ok: true,
            msg: 'Criterio de rúbrica creado exitosamente.',
            criterion,
        });
    } catch (error) {
        console.error('Error al crear criterio de rúbrica:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear criterio, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getCriteria = async (req, res) => {
    try {
        const { all, category } = req.query;
        const query = { status: true };

        // Si all no es true, solo devuelve los criterios activos para evaluación
        if (all !== 'true') {
            query.isActive = true;
        }

        if (category) {
            query.category = category.toUpperCase();
        }

        const criteria = await RubricCriterion.find(query).sort({ order: 1, createdAt: 1 });

        return res.status(200).json({
            ok: true,
            msg: 'Criterios de rúbrica obtenidos exitosamente.',
            total: criteria.length,
            criteria,
        });
    } catch (error) {
        console.error('Error al obtener criterios de rúbrica:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al obtener criterios, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getCriterionById = async (req, res) => {
    try {
        const { id } = req.params;
        const criterion = await RubricCriterion.findById(id);

        return res.status(200).json({
            ok: true,
            msg: 'Criterio de rúbrica encontrado exitosamente.',
            criterion,
        });
    } catch (error) {
        console.error('Error al buscar criterio de rúbrica:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar criterio, contacte al administrador.',
            error: error.message,
        });
    }
};

export const updateCriterion = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, ...rest } = req.body;

        if (category) {
            rest.category = category.toUpperCase();
        }

        const criterion = await RubricCriterion.findByIdAndUpdate(id, rest, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Criterio de rúbrica actualizado exitosamente.',
            criterion,
        });
    } catch (error) {
        console.error('Error al actualizar criterio de rúbrica:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al actualizar criterio, contacte al administrador.',
            error: error.message,
        });
    }
};

export const toggleCriterionActive = async (req, res) => {
    try {
        const { id } = req.params;
        const criterion = await RubricCriterion.findById(id);

        if (!criterion) {
            return res.status(404).json({
                ok: false,
                msg: 'Criterio no encontrado.',
            });
        }

        criterion.isActive = !criterion.isActive;
        await criterion.save();

        return res.status(200).json({
            ok: true,
            msg: `Criterio '${criterion.title}' ${criterion.isActive ? 'activado' : 'desactivado'} para evaluaciones.`,
            criterion,
        });
    } catch (error) {
        console.error('Error al alternar estado del criterio:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al cambiar estado del criterio, contacte al administrador.',
            error: error.message,
        });
    }
};

export const deleteCriterion = async (req, res) => {
    try {
        const { id } = req.params;
        await RubricCriterion.findByIdAndUpdate(id, { status: false, isActive: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Criterio de rúbrica eliminado exitosamente.',
        });
    } catch (error) {
        console.error('Error al eliminar criterio de rúbrica:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al eliminar criterio, contacte al administrador.',
            error: error.message,
        });
    }
};

export const seedCriteria = async (req, res) => {
    try {
        await seedRubricsHelper();
        return res.status(200).json({
            ok: true,
            msg: 'Criterios de rúbrica oficiales inicializados exitosamente.',
        });
    } catch (error) {
        console.error('Error al sembrar criterios por defecto:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al inicializar criterios por defecto.',
            error: error.message,
        });
    }
};
