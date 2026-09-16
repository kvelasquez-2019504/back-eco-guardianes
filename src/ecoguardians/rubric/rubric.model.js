'use strict';

import { Schema, model } from 'mongoose';

const RubricCriterionSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'El título del criterio es obligatorio'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        points: {
            type: Number,
            required: [true, 'El puntaje del criterio es obligatorio'],
            min: [1, 'El puntaje mínimo es 1'],
            default: 10,
        },
        category: {
            type: String,
            enum: ['CLASIFICACION', 'LIMPIEZA', 'ORDEN', 'GENERAL'],
            default: 'GENERAL',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
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

RubricCriterionSchema.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('RubricCriterion', RubricCriterionSchema);
