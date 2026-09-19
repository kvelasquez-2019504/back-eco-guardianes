'use strict';

import User from '#eg/users/user.model.js';
import Enrollment from '#eg/enrollment/enrollment.model.js';

export const VALID_SHIFTS = ['MATUTINA', 'VESPERTINA'];

export const isValidShift = (shift = '') => {
    if (!VALID_SHIFTS.includes(shift.toUpperCase())) {
        throw new Error(
            `La jornada '${shift}' no es válida. Opciones permitidas: ${VALID_SHIFTS.join(', ')}`
        );
    }
    return true;
};

export const isUserStudent = async (studentId = '') => {
    if (!studentId) return;
    const user = await User.findOne({ _id: studentId, status: true });
    if (!user) {
        throw new Error(`El alumno con ID '${studentId}' no existe o está inactivo.`);
    }
    if (user.role !== 'STUDENT') {
        throw new Error(
            `El usuario '${user.name} ${user.lastName}' tiene rol '${user.role}' y no es un STUDENT.`
        );
    }
};

export const enrollmentExistsById = async (enrollmentId = '') => {
    const enrollment = await Enrollment.findOne({ _id: enrollmentId, status: true });
    if (!enrollment) {
        throw new Error(`La inscripción con ID '${enrollmentId}' no existe o está inactiva.`);
    }
};
