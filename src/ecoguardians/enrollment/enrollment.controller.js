'use strict';

import Enrollment from './enrollment.model.js';
import ClassGroup from '#eg/class/classGroup.model.js';
import User from '#eg/users/user.model.js';
import { assertCanManageLevel } from '#helpers/class-validator.js';

export const enrollStudent = async (req, res) => {
    try {
        const { studentId, studentIds, classGroupId, shift, academicYear = 2026 } = req.body;

        const classGroup = await ClassGroup.findOne({ _id: classGroupId, status: true });
        if (!classGroup) {
            return res.status(404).json({
                ok: false,
                msg: 'La clase especificada no existe o está inactiva.',
            });
        }

        // Validar permisos del coordinador sobre el nivel de esta clase
        await assertCanManageLevel(classGroup.level, req.user);

        const normalizedShift = shift.toUpperCase().trim();
        if (!classGroup.coveredShifts.includes(normalizedShift)) {
            return res.status(400).json({
                ok: false,
                msg: `La clase '${classGroup.name}' no opera en jornada ${normalizedShift}. Jornadas disponibles: ${classGroup.coveredShifts.join(', ')}`,
            });
        }

        const ids = Array.isArray(studentIds) ? studentIds : (studentId ? [studentId] : []);
        if (ids.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Debe especificar al menos un alumno (studentId o studentIds).',
            });
        }

        const results = [];
        for (const sId of ids) {
            const studentUser = await User.findOne({ _id: sId, status: true });
            if (!studentUser) {
                results.push({ studentId: sId, status: 'error', reason: 'Usuario no existe o está inactivo' });
                continue;
            }
            if (studentUser.role !== 'STUDENT') {
                results.push({ studentId: sId, status: 'error', reason: `El usuario tiene rol '${studentUser.role}' y no es un STUDENT` });
                continue;
            }

            let enrollment = await Enrollment.findOne({
                student: sId,
                classGroup: classGroupId,
                academicYear,
            });

            if (!enrollment) {
                enrollment = new Enrollment({
                    student: sId,
                    classGroup: classGroupId,
                    shift: normalizedShift,
                    academicYear,
                    status: true,
                });
                await enrollment.save();
                results.push({ studentId: sId, name: `${studentUser.name} ${studentUser.lastName}`, status: 'inscrito' });
            } else if (!enrollment.status) {
                enrollment.status = true;
                enrollment.shift = normalizedShift;
                await enrollment.save();
                results.push({ studentId: sId, name: `${studentUser.name} ${studentUser.lastName}`, status: 'reinscrito' });
            } else {
                results.push({ studentId: sId, name: `${studentUser.name} ${studentUser.lastName}`, status: 'ya inscrito previamente' });
            }
        }

        return res.status(200).json({
            ok: true,
            msg: 'Proceso de inscripción de alumnos completado.',
            class: classGroup.name,
            shift: normalizedShift,
            results,
        });
    } catch (error) {
        console.error('Error al inscribir alumnos:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al procesar inscripción.',
        });
    }
};

export const getClassStudents = async (req, res) => {
    try {
        const { classGroupId } = req.params;
        const { shift } = req.query;

        const classGroup = await ClassGroup.findOne({ _id: classGroupId, status: true });
        if (!classGroup) {
            return res.status(404).json({
                ok: false,
                msg: 'Clase no encontrada.',
            });
        }

        // Control de permisos para ver alumnos:
        // 1. ADMIN puede ver cualquier clase
        // 2. COORDINATOR puede ver si el nivel le pertenece
        // 3. TEACHER puede ver si es el profesor a cargo de esta clase
        const user = req.user;
        const isTeacherOfClass = classGroup.teacher && classGroup.teacher.toString() === user._id.toString();

        if (user.role === 'TEACHER') {
            if (!isTeacherOfClass) {
                return res.status(403).json({
                    ok: false,
                    msg: 'No tienes autorización para ver el listado de alumnos de una clase que no impartes.',
                });
            }
        } else if (user.role === 'COORDINATOR') {
            await assertCanManageLevel(classGroup.level, user);
        } else if (user.role !== 'ADMIN') {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para ver el listado de alumnos.',
            });
        }

        const query = { classGroup: classGroupId, status: true };
        if (shift) {
            query.shift = shift.toUpperCase();
        }

        const enrollments = await Enrollment.find(query)
            .populate('student', 'name lastName email code ecoAura status')
            .sort({ 'student.lastName': 1 });

        const students = enrollments.map((e) => ({
            enrollmentId: e._id,
            shift: e.shift,
            academicYear: e.academicYear,
            student: e.student,
        }));

        return res.status(200).json({
            ok: true,
            msg: `Listado de alumnos de la clase '${classGroup.name}' obtenido exitosamente.`,
            className: classGroup.name,
            totalStudents: students.length,
            students,
        });
    } catch (error) {
        console.error('Error al obtener alumnos de la clase:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al obtener alumnos de la clase.',
        });
    }
};

export const getMyEnrollment = async (req, res) => {
    try {
        const studentId = req.user._id;

        const enrollments = await Enrollment.find({
            student: studentId,
            status: true,
        }).populate({
            path: 'classGroup',
            populate: [
                { path: 'level', select: 'name stage gradeNumber' },
                { path: 'career', select: 'name description' },
                { path: 'teacher', select: 'name lastName email' },
            ],
        });

        return res.status(200).json({
            ok: true,
            msg: 'Tus clases matriculadas fueron obtenidas exitosamente.',
            total: enrollments.length,
            enrollments,
        });
    } catch (error) {
        console.error('Error al consultar mis inscripciones:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar tus inscripciones, contacte al administrador.',
            error: error.message,
        });
    }
};

export const unenrollStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findById(id).populate('classGroup');
        if (!enrollment) {
            return res.status(404).json({
                ok: false,
                msg: 'Inscripción no encontrada.',
            });
        }

        await assertCanManageLevel(enrollment.classGroup.level, req.user);

        await Enrollment.findByIdAndUpdate(id, { status: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Alumno desinscrito de la clase exitosamente.',
        });
    } catch (error) {
        console.error('Error al desinscribir alumno:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al desinscribir alumno.',
        });
    }
};
