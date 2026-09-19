'use strict';

import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Formato de archivo no válido '${file.mimetype}'. Solo se permiten imágenes JPEG, PNG o WEBP.`
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Máximo 5 MB por archivo
        files: 4, // Máximo 4 imágenes por evidencia
    },
});

/**
 * Middleware para capturar y procesar el arreglo de imágenes 'images' en multipart/form-data.
 * Maneja errores de Multer (límite de tamaño, cantidad, etc.) retornando respuestas JSON consistentes.
 */
export const uploadEvidenceImages = (req, res, next) => {
    const uploadMiddleware = upload.array('images', 4);

    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    ok: false,
                    msg: 'Una o más imágenes superan el tamaño máximo permitido de 5 MB.',
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    ok: false,
                    msg: 'Se superó el límite máximo de 4 imágenes por publicación.',
                });
            }
            return res.status(400).json({
                ok: false,
                msg: `Error en la subida de archivos: ${err.message}`,
            });
        } else if (err) {
            return res.status(400).json({
                ok: false,
                msg: err.message || 'Error al procesar las imágenes.',
            });
        }

        next();
    });
};
