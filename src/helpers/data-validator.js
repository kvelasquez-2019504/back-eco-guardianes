'use strict';

import mongoose from 'mongoose';

/**
 * Valida si un string tiene el formato de ObjectId válido de MongoDB.
 * @param {string} id
 * @returns {boolean}
 */
export const isValidMongoId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`El identificador '${id}' no tiene un formato válido.`);
    }
    return true;
};
