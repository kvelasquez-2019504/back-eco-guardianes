'use strict';

import User from '#eg/users/user.model.js';
import ClassGroup from '#eg/class/classGroup.model.js';
import CoordinatorAssignment from '#eg/coordinator/coordinatorAssignment.model.js';

/**
 * Valida que el usuario exista, esté activo y tenga el rol TEACHER.
 * @param {string} teacherId
 */
export const isUserTeacher = async (teacherId = '') => {
    if (!teacherId) return;
    const user = await User.findOne({ _id: teacherId, status: true });
    if (!user) {
        throw new Error(`El profesor con ID '${teacherId}' no existe o está inactivo.`);
    }
    if (user.role !== 'TEACHER') {
        throw new Error(
            `El usuario '${user.name} ${user.lastName}' tiene rol '${user.role}' y no es un TEACHER.`
        );
    }
};

/**
 * Valida que la clase exista y esté activa.
 * @param {string} classId
 */
export const classExistsById = async (classId = '') => {
    const classGroup = await ClassGroup.findOne({ _id: classId, status: true });
    if (!classGroup) {
        throw new Error(`La clase con ID '${classId}' no existe o está inactiva.`);
    }
};

/**
 * Valida si un coordinador o administrador tiene permisos sobre el nivel de la clase.
 * @param {string} levelId
 * @param {object} user
 */
export const assertCanManageLevel = async (levelId, user) => {
    if (user.role === 'ADMIN') return true;

    if (user.role === 'COORDINATOR') {
        const assignment = await CoordinatorAssignment.findOne({
            coordinator: user._id,
            level: levelId,
            status: true,
        });
        if (!assignment) {
            throw new Error(
                'No tienes autorización sobre este nivel educativo (no está asignado a tu coordinación).'
            );
        }
        return true;
    }

    throw new Error('No tienes permisos para gestionar este nivel educativo.');
};
