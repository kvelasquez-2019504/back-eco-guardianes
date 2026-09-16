'use strict';

import ClassGroup from './classGroup.model.js';
import Level from '#eg/level/level.model.js';
import Career from '#eg/career/career.model.js';
import { assertCanManageLevel } from '#helpers/class-validator.js';

export const createClassGroup = async (req, res) => {
    try {
        const { levelId, careerId, section, teacherId, academicYear = 2026 } = req.body;

        // Validar permisos del coordinador sobre el nivel
        await assertCanManageLevel(levelId, req.user);

        const level = await Level.findOne({ _id: levelId, status: true });
        if (!level) {
            return res.status(404).json({
                ok: false,
                msg: 'El nivel educativo especificado no existe.',
            });
        }

        const normalizedSection = section.toUpperCase().trim();
        if (!level.allowedSections.includes(normalizedSection)) {
            return res.status(400).json({
                ok: false,
                msg: `La sección '${normalizedSection}' no está permitida para ${level.name}. Secciones permitidas: ${level.allowedSections.join(', ')}`,
            });
        }

        let type;
        let career = null;
        let coveredShifts = [];
        let name = '';

        if (level.stage === 'BASICO') {
            type = 'GUIA';
            career = null;
            coveredShifts = ['MATUTINA'];
            name = `${level.name} - Sección ${normalizedSection}`;
        } else if (level.stage === 'DIVERSIFICADO') {
            type = 'TALLER';
            if (!careerId) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Para diversificado es obligatorio especificar la carrera o taller técnico (careerId).',
                });
            }

            const careerDoc = await Career.findOne({ _id: careerId, status: true });
            if (!careerDoc) {
                return res.status(404).json({
                    ok: false,
                    msg: 'La carrera técnica especificada no existe.',
                });
            }

            career = careerDoc._id;
            // Regla: En diversificado el taller cubre ambas jornadas (Matutina y Vespertina)
            coveredShifts = ['MATUTINA', 'VESPERTINA'];
            name = `${level.name} - ${careerDoc.name} - Sección ${normalizedSection}`;
        }

        // Validar duplicidad
        const existingClass = await ClassGroup.findOne({
            level: levelId,
            career,
            section: normalizedSection,
            academicYear,
            status: true,
        });

        if (existingClass) {
            return res.status(400).json({
                ok: false,
                msg: `Ya existe una clase registrada para ${name} en el ciclo ${academicYear}.`,
            });
        }

        const classGroup = new ClassGroup({
            name,
            level: levelId,
            career,
            section: normalizedSection,
            type,
            teacher: teacherId || null,
            coveredShifts,
            academicYear,
        });

        await classGroup.save();

        return res.status(201).json({
            ok: true,
            msg: 'Clase / Grupo académico creado exitosamente.',
            classGroup,
        });
    } catch (error) {
        console.error('Error al crear clase:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al crear clase.',
        });
    }
};

export const getClassGroups = async (req, res) => {
    try {
        const { level, career, type, teacher, academicYear = 2026 } = req.query;
        const query = { status: true, academicYear: Number(academicYear) };

        if (level) query.level = level;
        if (career) query.career = career;
        if (type) query.type = type.toUpperCase();
        if (teacher) query.teacher = teacher;

        const classes = await ClassGroup.find(query)
            .populate('level', 'name stage gradeNumber')
            .populate('career', 'name')
            .populate('teacher', 'name lastName email code')
            .sort({ name: 1 });

        return res.status(200).json({
            ok: true,
            msg: 'Clases obtenidas exitosamente.',
            total: classes.length,
            classes,
        });
    } catch (error) {
        console.error('Error al obtener clases:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al obtener clases, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getClassGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const classGroup = await ClassGroup.findById(id)
            .populate('level', 'name stage gradeNumber allowedSections')
            .populate('career', 'name description')
            .populate('teacher', 'name lastName email code');

        return res.status(200).json({
            ok: true,
            msg: 'Clase encontrada exitosamente.',
            classGroup,
        });
    } catch (error) {
        console.error('Error al buscar clase por ID:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar clase, contacte al administrador.',
            error: error.message,
        });
    }
};

export const assignTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherId } = req.body;

        const classGroup = await ClassGroup.findById(id);
        if (!classGroup) {
            return res.status(404).json({
                ok: false,
                msg: 'Clase no encontrada.',
            });
        }

        // Validar permisos del coordinador sobre el nivel de esta clase
        await assertCanManageLevel(classGroup.level, req.user);

        classGroup.teacher = teacherId;
        await classGroup.save();

        const updatedClass = await ClassGroup.findById(id)
            .populate('level', 'name stage')
            .populate('career', 'name')
            .populate('teacher', 'name lastName email code');

        return res.status(200).json({
            ok: true,
            msg: `Profesor asignado exitosamente a la clase '${classGroup.name}'.`,
            classGroup: updatedClass,
        });
    } catch (error) {
        console.error('Error al asignar profesor:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al asignar profesor a la clase.',
        });
    }
};

export const getMyClasses = async (req, res) => {
    try {
        const teacherId = req.user._id;

        const classes = await ClassGroup.find({
            teacher: teacherId,
            status: true,
        })
            .populate('level', 'name stage gradeNumber')
            .populate('career', 'name description')
            .sort({ name: 1 });

        return res.status(200).json({
            ok: true,
            msg: 'Tus clases asignadas fueron obtenidas exitosamente.',
            total: classes.length,
            classes,
        });
    } catch (error) {
        console.error('Error al obtener mis clases:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar tus clases, contacte al administrador.',
            error: error.message,
        });
    }
};

export const updateClassGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const classGroup = await ClassGroup.findById(id);
        if (!classGroup) {
            return res.status(404).json({
                ok: false,
                msg: 'Clase no encontrada.',
            });
        }

        await assertCanManageLevel(classGroup.level, req.user);

        const updated = await ClassGroup.findByIdAndUpdate(id, req.body, { new: true })
            .populate('level', 'name stage')
            .populate('career', 'name')
            .populate('teacher', 'name lastName email');

        return res.status(200).json({
            ok: true,
            msg: 'Clase actualizada exitosamente.',
            classGroup: updated,
        });
    } catch (error) {
        console.error('Error al actualizar clase:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al actualizar clase.',
        });
    }
};

export const deleteClassGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const classGroup = await ClassGroup.findById(id);
        if (!classGroup) {
            return res.status(404).json({
                ok: false,
                msg: 'Clase no encontrada.',
            });
        }

        await assertCanManageLevel(classGroup.level, req.user);

        await ClassGroup.findByIdAndUpdate(id, { status: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Clase desactivada exitosamente.',
        });
    } catch (error) {
        console.error('Error al desactivar clase:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al desactivar clase.',
        });
    }
};
