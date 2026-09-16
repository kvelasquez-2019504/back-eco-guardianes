'use strict';

import { Schema, model } from 'mongoose';

const EvaluationCheckSchema = new Schema(
    {
        criterion: {
            type: Schema.Types.ObjectId,
            ref: 'RubricCriterion',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        pointsEarned: {
            type: Number,
            required: true,
            default: 0,
        },
        achieved: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    { _id: false }
);

const EvaluationSchema = new Schema(
    {
        evaluator: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        evaluatorRole: {
            type: String,
            enum: ['ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT'],
            required: true,
        },
        checks: [EvaluationCheckSchema],
        score: {
            type: Number,
            required: true,
            default: 0,
        },
        comment: {
            type: String,
            trim: true,
            default: '',
        },
        evaluatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const PostSchema = new Schema(
    {
        student: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        classGroup: {
            type: Schema.Types.ObjectId,
            ref: 'ClassGroup',
            required: true,
        },
        shift: {
            type: String,
            enum: ['MATUTINA', 'VESPERTINA'],
            required: true,
        },
        academicYear: {
            type: Number,
            default: 2026,
        },
        description: {
            type: String,
            required: [true, 'La descripción de la acción ecológica es obligatoria'],
            trim: true,
        },
        images: {
            type: [String],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length > 0;
                },
                message: 'Debe incluir al menos una imagen como evidencia.',
            },
        },
        publishedAt: {
            type: Date,
            default: Date.now,
        },
        // Evaluaciones híbridas recibidas
        evaluations: [EvaluationSchema],
        // Puntos oficiales otorgados por docentes/coordinadores (suman al ranking de la sección)
        officialScore: {
            type: Number,
            default: 0,
        },
        // Puntos comunitarios otorgados por alumnos (suman al Eco-Aura)
        communityScore: {
            type: Number,
            default: 0,
        },
        // Total de puntos de Eco-Aura generados por este post para el alumno
        totalEcoAuraEarned: {
            type: Number,
            default: 0,
        },
        isOfficiallyVerified: {
            type: Boolean,
            default: false,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

PostSchema.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('Post', PostSchema);
