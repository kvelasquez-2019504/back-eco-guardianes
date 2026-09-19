'use strict';

import { Schema, model } from 'mongoose';

const BonusAwardedSchema = new Schema(
    {
        classGroup: {
            type: Schema.Types.ObjectId,
            ref: 'ClassGroup',
            required: true,
        },
        points: {
            type: Number,
            required: true,
            default: 50,
        },
        awardedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            default: 'Cumplimiento destacado de la semana de guardia Eco-Guardianes',
        },
        awardedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const TurnSchema = new Schema(
    {
        bimester: {
            type: Number,
            required: [true, 'El número de bimestre es obligatorio (1 al 4)'],
            min: 1,
            max: 4,
        },
        weekNumber: {
            type: Number,
            required: [true, 'El número de semana es obligatorio (1 al 8)'],
            min: 1,
            max: 8,
        },
        startDate: {
            type: Date,
            required: [true, 'La fecha de inicio de la semana es obligatoria'],
        },
        endDate: {
            type: Date,
            required: [true, 'La fecha de finalización de la semana es obligatoria'],
        },
        academicYear: {
            type: Number,
            default: 2026,
        },
        // Niveles educativos activos como Eco-Guardianes de turno esa semana
        activeLevels: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Level',
            },
        ],
        // Flag para Semanas 7 y 8 (Gran Final Bimestral donde todos los niveles están activos)
        isAllLevelsActive: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
        // Bonificaciones de guardia otorgadas a secciones al final de la semana
        bonusAwarded: [BonusAwardedSchema],
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

TurnSchema.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('Turn', TurnSchema);
