'use strict';

import Post from '#eg/post/post.model.js';

export const postExistsById = async (id = '') => {
    const post = await Post.findOne({ _id: id, status: true });
    if (!post) {
        throw new Error(`La publicación con ID '${id}' no existe o ha sido eliminada.`);
    }
};

/**
 * Calcula el nivel de Eco-Aura correspondiente a un total de puntos:
 * - 0 a 100: NOVATO
 * - 101 a 300: GUARDIAN
 * - 301+: LEYENDA
 * 
 * @param {number} points
 * @returns {string}
 */
export const calculateEcoAuraLevel = (points = 0) => {
    if (points >= 301) {
        return 'LEYENDA';
    }
    if (points >= 101) {
        return 'GUARDIAN';
    }
    return 'NOVATO';
};
