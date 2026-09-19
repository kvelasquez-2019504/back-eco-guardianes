'use strict';

import Level from '#eg/level/level.model.js';

export const VALID_STAGES = ['BASICO', 'DIVERSIFICADO'];

export const isValidStage = (stage = '') => {
    if (!VALID_STAGES.includes(stage.toUpperCase())) {
        throw new Error(
            `La etapa '${stage}' no es válida. Etapas permitidas: ${VALID_STAGES.join(', ')}`
        );
    }
    return true;
};

export const existentLevelName = async (name = '') => {
    const level = await Level.findOne({ name: name.trim(), status: true });
    if (level) {
        throw new Error(`El nivel educativo '${name}' ya se encuentra registrado.`);
    }
};

export const levelExistsById = async (id = '') => {
    const level = await Level.findOne({ _id: id, status: true });
    if (!level) {
        throw new Error(`El nivel educativo con ID '${id}' no existe o está inactivo.`);
    }
};
