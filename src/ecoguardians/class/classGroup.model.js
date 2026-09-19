'use strict';

import { Schema, model } from 'mongoose';

const ClassGroup = new Schema({
    name: { type: String, required: true }, // Ej: "1ro Básico - Sección A" o "4to Informática - Sección A"
    level: {
        type: Schema.Types.ObjectId,
        ref: 'Level',
        required: true,
    },
    career: {
        type: Schema.Types.ObjectId,
        ref: 'Career',
        default: null, // Null en básico, ObjectId en diversificado
    },
    section: {
        type: String,
        required: true,
    }, // 'A', 'B', 'C', etc.
    type: {
        type: String,
        enum: ['GUIA', 'TALLER'],
        required: true,
    },
    // Profesor asignado (Profesor Guía o Profesor de Taller)
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    // Regla especial de jornadas:
    // En básico puede ser 'MATUTINA' o 'UNICA'.
    // En diversificado, el taller cubre 'AMBAS' (Matutina y Vespertina para esa sección)
    coveredShifts: [
        {
            type: String,
            enum: ['MATUTINA', 'VESPERTINA'],
        },
    ],
    academicYear: { type: Number, default: 2026 },
    status: { type: Boolean, default: true },
});

ClassGroup.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('ClassGroup', ClassGroup);

