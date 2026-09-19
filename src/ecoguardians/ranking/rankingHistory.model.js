'use strict';

import { Schema, model } from 'mongoose';

const SectionPodiumSchema = new Schema(
    {
        position: {
            type: Number,
            required: true,
        },
        classGroup: {
            type: Schema.Types.ObjectId,
            ref: 'ClassGroup',
            required: true,
        },
        className: {
            type: String,
            required: true,
        },
        section: {
            type: String,
            required: true,
        },
        stage: {
            type: String,
            enum: ['BASICO', 'DIVERSIFICADO'],
            required: true,
        },
        totalScore: {
            type: Number,
            required: true,
            default: 0,
        },
        postPoints: {
            type: Number,
            default: 0,
        },
        bonusPoints: {
            type: Number,
            default: 0,
        },
        postsCount: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const StudentPodiumSchema = new Schema(
    {
        position: {
            type: Number,
            required: true,
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            default: null,
        },
        ecoAuraPoints: {
            type: Number,
            required: true,
            default: 0,
        },
        ecoAuraLevel: {
            type: String,
            enum: ['NOVATO', 'GUARDIAN', 'LEYENDA'],
            required: true,
        },
    },
    { _id: false }
);

const RankingHistorySchema = new Schema(
    {
        bimester: {
            type: Number,
            required: [true, 'El número de bimestre es obligatorio (1 al 4)'],
            min: 1,
            max: 4,
        },
        academicYear: {
            type: Number,
            required: true,
            default: 2026,
        },
        closedAt: {
            type: Date,
            default: Date.now,
        },
        closedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Podio de Ciclo Básico
        topSectionsBasico: [SectionPodiumSchema],
        // Podio de Diversificado
        topSectionsDiversificado: [SectionPodiumSchema],
        // Podio General Institucional
        topSectionsGeneral: [SectionPodiumSchema],
        // Alumnos destacados por Eco-Aura
        topStudents: [StudentPodiumSchema],
        notes: {
            type: String,
            trim: true,
            default: 'Cierre oficial y premiación bimestral de Eco-Guardianes',
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

RankingHistorySchema.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('RankingHistory', RankingHistorySchema);
