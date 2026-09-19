'use strict';

import User from '#eg/users/user.model.js';
import CoordinatorAssignment from '#eg/coordinator/coordinatorAssignment.model.js';

/**
 * Valida que el usuario exista, esté activo y tenga el rol COORDINATOR.
 * @param {string} userId
 */
export const isUserCoordinator = async (userId = '') => {
    const user = await User.findOne({ _id: userId, status: true });
    if (!user) {
        throw new Error(`El usuario con ID '${userId}' no existe o está inactivo.`);
    }
    if (user.role !== 'COORDINATOR') {
        throw new Error(
            `El usuario '${user.name} ${user.lastName}' tiene el rol '${user.role}' y no es un COORDINATOR.`
        );
    }
};

/**
 * Valida si un coordinador ya tiene asignado un nivel educativo.
 * @param {string} coordinatorId
 * @param {string} levelId
 */
export const assignmentNotDuplicated = async (coordinatorId = '', levelId = '') => {
    const existing = await CoordinatorAssignment.findOne({
        coordinator: coordinatorId,
        level: levelId,
        status: true,
    });
    if (existing) {
        throw new Error(`El coordinador ya tiene asignado este nivel educativo.`);
    }
};
