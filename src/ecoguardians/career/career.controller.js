'use strict';

import Career from './career.model.js';

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
        const defaultCareers = [
            {
                name: 'Informática',
                description: 'Desarrollo de software, sistemas y tecnologías web.',
            },
            {
                name: 'Dibujo Técnico',
                description: 'Diseño arquitectónico y modelado técnico digital.',
            },
            {
                name: 'Electrónica',
                description: 'Sistemas electrónicos, circuitos y automatización industrial.',
            },
        ];

        const results = [];
        for (const def of defaultCareers) {
            let career = await Career.findOne({ name: def.name });
            if (!career) {
                career = new Career(def);
                await career.save();
                results.push({ name: def.name, status: 'creada' });
            } else {
                results.push({ name: def.name, status: 'ya existía' });
            }
        }

        return res.status(200).json({
            ok: true,
            msg: 'Proceso de inicialización de carreras completado.',
            results,
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
