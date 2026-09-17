'use strict';

import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '#middlewares/jwt-validator.js';
import { hasRole } from '#middlewares/role-validator.js';
import { validateFields } from '#middlewares/fields-validator.js';
import { isValidMongoId } from '#helpers/data-validator.js';
import { postExistsById } from '#helpers/post-validator.js';
import { uploadEvidenceImages } from '#middlewares/file-upload.js';
import {
    createPost,
    getPosts,
    getPostById,
    evaluatePost,
    getMyPosts,
    deletePost,
    getPostImage,
} from './post.controller.js';

const router = Router();

// Feed general de publicaciones (autenticado)
router.get('/', [validateJWT, validateFields], getPosts);

// Consultar mis propias publicaciones (para STUDENT)
router.get('/my-posts', [validateJWT, hasRole('STUDENT', 'ADMIN'), validateFields], getMyPosts);

// Obtener imagen binaria de una publicación (para renderizado directo con <img src="...">)
router.get(
    '/:id/image/:index',
    [
        check('id').custom(isValidMongoId),
        validateFields,
    ],
    getPostImage
);

// Consultar detalle de una publicación
router.get(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(postExistsById),
        validateFields,
    ],
    getPostById
);

// Registrar publicación de evidencia ecológica (solo STUDENT en horario escolar, con multipart/form-data)
router.post(
    '/',
    [
        validateJWT,
        hasRole('STUDENT', 'ADMIN'),
        uploadEvidenceImages,
        check('description', 'La descripción de la acción es obligatoria').not().isEmpty().trim(),
        validateFields,
    ],
    createPost
);

// Calificar publicación con la rúbrica (Modelo híbrido: DOCENTE, COORDINADOR, ADMIN o ALUMNO)
router.post(
    '/:id/evaluate',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(postExistsById),
        check('checks', 'Debe enviar el arreglo de criterios evaluados (checks)').isArray({ min: 1 }),
        validateFields,
    ],
    evaluatePost
);

// Eliminar publicación (autor o ADMIN)
router.delete(
    '/:id',
    [
        validateJWT,
        check('id').custom(isValidMongoId),
        check('id').custom(postExistsById),
        validateFields,
    ],
    deletePost
);

export default router;
