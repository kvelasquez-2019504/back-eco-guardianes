'use strict';

import Turn from '#eg/turn/turn.model.js';

export const isValidBimester = (bimester) => {
    const b = Number(bimester);
    if (isNaN(b) || b < 1 || b > 4) {
        throw new Error('El bimestre debe ser un número entero entre 1 y 4.');
    }
    return true;
};

export const isValidWeekNumber = (weekNumber) => {
    const w = Number(weekNumber);
    if (isNaN(w) || w < 1 || w > 8) {
        throw new Error('El número de semana debe estar entre 1 y 8.');
    }
    return true;
};

export const turnExistsById = async (id = '') => {
    const turn = await Turn.findOne({ _id: id, status: true });
    if (!turn) {
        throw new Error(`El turno con ID '${id}' no existe o está inactivo.`);
    }
};
