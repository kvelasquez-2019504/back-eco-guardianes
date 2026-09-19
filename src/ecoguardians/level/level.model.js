'use strict';

import { Schema, model } from 'mongoose';

const Level = new Schema({
    name: { type: String, required: true }, // Ej: "Primero Básico", "Cuarto Diversificado"
    stage: {
        type: String,
        enum: ['BASICO', 'DIVERSIFICADO'],
        required: true,
    },
    gradeNumber: { type: Number, required: true }, // 1, 2, 3, 4, 5, 6
    // Secciones permitidas para este grado:
    allowedSections: [{ type: String }], // Ej. para 1ro: ['A','B','C','D','E','F']
    status: { type: Boolean, default: true },
});

Level.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('Level', Level);

