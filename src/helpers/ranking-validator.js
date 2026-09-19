'use strict';

import RankingHistory from '#eg/ranking/rankingHistory.model.js';

export const isValidBimesterParam = (bimester) => {
    if (!bimester) return true;
    const b = Number(bimester);
    if (isNaN(b) || b < 1 || b > 4) {
        throw new Error('El bimestre debe ser un número entero entre 1 y 4.');
    }
    return true;
};

export const isValidStageParam = (stage) => {
    if (!stage) return true;
    const s = stage.toUpperCase();
    if (!['BASICO', 'DIVERSIFICADO'].includes(s)) {
        throw new Error("La etapa debe ser 'BASICO' o 'DIVERSIFICADO'.");
    }
    return true;
};

export const isValidShiftParam = (shift) => {
    if (!shift) return true;
    const sh = shift.toUpperCase();
    if (!['MATUTINA', 'VESPERTINA'].includes(sh)) {
        throw new Error("La jornada debe ser 'MATUTINA' o 'VESPERTINA'.");
    }
    return true;
};

export const isValidAuraLevelParam = (level) => {
    if (!level) return true;
    const l = level.toUpperCase();
    if (!['NOVATO', 'GUARDIAN', 'LEYENDA'].includes(l)) {
        throw new Error("El nivel de Eco-Aura debe ser 'NOVATO', 'GUARDIAN' o 'LEYENDA'.");
    }
    return true;
};

export const rankingHistoryExistsById = async (id = '') => {
    const history = await RankingHistory.findOne({ _id: id, status: true });
    if (!history) {
        throw new Error(`El historial de ranking con ID '${id}' no existe.`);
    }
};
