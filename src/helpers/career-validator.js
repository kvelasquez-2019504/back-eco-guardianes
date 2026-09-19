'use strict';

import Career from '#eg/career/career.model.js';

export const existentCareerName = async (name = '') => {
    const career = await Career.findOne({ name: name.trim(), status: true });
    if (career) {
        throw new Error(`La carrera o taller técnico '${name}' ya se encuentra registrado.`);
    }
};

export const careerExistsById = async (id = '') => {
    const career = await Career.findOne({ _id: id, status: true });
    if (!career) {
        throw new Error(`La carrera técnica con ID '${id}' no existe o está inactiva.`);
    }
};
