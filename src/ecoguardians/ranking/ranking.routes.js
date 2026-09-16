'use strict';

import { Router } from 'express';
import { check, query } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import { isValidBimester } from '#helpers/turn-validator.js';
import {
    isValidBimesterParam,
    isValidStageParam,
    isValidShiftParam,
    isValidAuraLevelParam,
    rankingHistoryExistsById,
} from '#helpers/ranking-validator.js';
import {
    getCollectiveRanking,
    getIndividualRanking,
    closeBimester,
    getPodiumHistory,
    getPodiumHistoryById,
} from './ranking.controller.js';

const router = Router();

// Ranking colectivo de secciones (Cualquier usuario autenticado)
router.get(
    '/collective',
    [
        validateJWT,
        query('bimester').optional().custom(isValidBimesterParam),
        query('stage').optional().custom(isValidStageParam),
        query('shift').optional().custom(isValidShiftParam),
        validateFields,
    ],
    getCollectiveRanking
);

// Ranking individual de Eco-Aura (Cualquier usuario autenticado)
router.get(
    '/individual',
    [
        validateJWT,
        query('level').optional().custom(isValidAuraLevelParam),
        query('limit').optional().isNumeric().withMessage('Limit debe ser numérico'),
        query('from').optional().isNumeric().withMessage('From debe ser numérico'),
        validateFields,
    ],
    getIndividualRanking
);

// Historial de podios bimestrales cerrados (Cualquier usuario autenticado)
router.get(
    '/history',
    [
        validateJWT,
        query('bimester').optional().custom(isValidBimesterParam),
        validateFields,
    ],
    getPodiumHistory
);

// Detalle de un podio histórico por ID (Cualquier usuario autenticado)
router.get(
    '/history/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(rankingHistoryExistsById),
        validateFields,
    ],
    getPodiumHistoryById
);

// Cierre oficial de bimestre y generación del podio institucional (ADMIN o COORDINATOR)
router.post(
    '/close-bimester',
    [
        validateJWT,
        hasRole('ADMIN', 'COORDINATOR'),
        check('bimester', 'El número de bimestre es obligatorio').not().isEmpty(),
        check('bimester').custom(isValidBimester),
        validateFields,
    ],
    closeBimester
);

export default router;
