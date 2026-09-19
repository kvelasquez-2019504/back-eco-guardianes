'use strict';

import Career from './career.model.js';
import { seedCareers as seedCareersHelper } from '#helpers/init-seeders.js';

export const createCareer = async (req, res) => {
    try {
        const { name, description } = req.body;

        const career = new Career({
            name: name.trim(),
            description: description ? description.trim() : '',
        });

        await career.save();

        return res.status(201).json({
            ok: true,
            msg: 'Carrera o taller técnico creado exitosamente.',
            career,
        });
    } catch (error) {
        console.error('Error al crear carrera:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear carrera, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getCareers = async (req, res) => {
    try {
        const query = { status: true };
        const careers = await Career.find(query).sort({ name: 1 });

        return res.status(200).json({
            ok: true,
            msg: 'Carreras técnicas obtenidas exitosamente.',
            total: careers.length,
            careers,
        });
    } catch (error) {
        console.error('Error al obtener carreras:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al obtener carreras, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getCareerById = async (req, res) => {
    try {
        const { id } = req.params;
        const career = await Career.findById(id);

        return res.status(200).json({
            ok: true,
            msg: 'Carrera técnica encontrada exitosamente.',
            career,
        });
    } catch (error) {
        console.error('Error al buscar carrera:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar carrera, contacte al administrador.',
            error: error.message,
        });
    }
};

export const updateCareer = async (req, res) => {
    try {
        const { id } = req.params;
        const career = await Career.findByIdAndUpdate(id, req.body, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Carrera técnica actualizada exitosamente.',
            career,
        });
    } catch (error) {
        console.error('Error al actualizar carrera:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al actualizar carrera, contacte al administrador.',
            error: error.message,
        });
    }
};

export const deleteCareer = async (req, res) => {
    try {
        const { id } = req.params;
        await Career.findByIdAndUpdate(id, { status: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Carrera técnica desactivada exitosamente.',
        });
    } catch (error) {
        console.error('Error al desactivar carrera:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al desactivar carrera, contacte al administrador.',
            error: error.message,
        });
    }
};

export const seedCareers = async (req, res) => {
    try {
        await seedCareersHelper();
        return res.status(200).json({
            ok: true,
            msg: 'Carreras técnicas de Kinal inicializadas exitosamente.',
        });
    } catch (error) {
        console.error('Error al inicializar carreras:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al inicializar carreras por defecto.',
            error: error.message,
        });
    }
};
