'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { isAdminRole, hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import { isUserCoordinator } from '#helpers/coordinator-validator.js';
import { levelExistsById } from '#helpers/level-validator.js';
import {
    assignCoordinatorLevels,
    unassignCoordinatorLevel,
    getAllAssignments,
    getCoordinatorLevels,
    getMyAssignedLevels,
} from './coordinatorAssignment.controller.js';

const router = Router();

// Listar todas las asignaciones (solo ADMIN)
router.get('/', [validateJWT, isAdminRole, validateFields], getAllAssignments);

// Ver mis propios niveles asignados (para el COORDINATOR autenticado o ADMIN)
router.get(
    '/my-levels',
    [validateJWT, hasRole('COORDINATOR', 'ADMIN'), validateFields],
    getMyAssignedLevels
);

// Ver niveles asignados a un coordinador por su ID (ADMIN o COORDINATOR)
router.get(
    '/:coordinatorId/levels',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('coordinatorId').custom(isValidMongoId),
        check('coordinatorId').custom(isUserCoordinator),
        validateFields,
    ],
    getCoordinatorLevels
);

// Asignar uno o más niveles a un coordinador (solo ADMIN)
router.post(
    '/assign',
    [
        validateJWT,
        isAdminRole,
        check('coordinatorId', 'El ID del coordinador es obligatorio').not().isEmpty(),
        check('coordinatorId').custom(isValidMongoId),
        check('coordinatorId').custom(isUserCoordinator),
        check('levelIds', 'Debe enviar un arreglo de IDs de niveles (levelIds)').not().isEmpty(),
        validateFields,
    ],
    assignCoordinatorLevels
);

// Desasignar un nivel a un coordinador (solo ADMIN)
router.delete(
    '/unassign',
    [
        validateJWT,
        isAdminRole,
        check('coordinatorId').custom(isValidMongoId),
        check('coordinatorId').custom(isUserCoordinator),
        check('levelId').custom(isValidMongoId),
        check('levelId').custom(levelExistsById),
        validateFields,
    ],
    unassignCoordinatorLevel
);

export default router;
