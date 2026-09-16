'use strict';

import RubricCriterion from '#eg/rubric/rubric.model.js';

export const VALID_CATEGORIES = ['CLASIFICACION', 'LIMPIEZA', 'ORDEN', 'GENERAL'];

export const isValidCategory = (category = '') => {
    if (!category) return true;
    if (!VALID_CATEGORIES.includes(category.toUpperCase())) {
        throw new Error(
            `La categoría '${category}' no es válida. Opciones permitidas: ${VALID_CATEGORIES.join(', ')}`
        );
    }
    return true;
};

export const existentCriterionTitle = async (title = '') => {
    const existing = await RubricCriterion.findOne({
        title: title.trim(),
        status: true,
    });
    if (existing) {
        throw new Error(`Ya existe un criterio de rúbrica con el título '${title}'.`);
    }
};

export const criterionExistsById = async (id = '') => {
    const criterion = await RubricCriterion.findOne({ _id: id, status: true });
    if (!criterion) {
        throw new Error(`El criterio de rúbrica con ID '${id}' no existe o está inactivo.`);
    }
};
