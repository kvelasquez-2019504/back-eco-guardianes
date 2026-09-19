'use strict';

import { Schema, model } from 'mongoose';

const UserSchema = Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'El apellido es obligatorio'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'El correo electrónico es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
        },
        role: {
            type: String,
            required: true,
            enum: ['ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT'],
            default: 'STUDENT',
        },
        code: {
            type: String,
            trim: true,
            default: null,
        },
        ecoAura: {
            points: {
                type: Number,
                default: 0,
            },
            level: {
                type: String,
                enum: ['NOVATO', 'GUARDIAN', 'LEYENDA'],
                default: 'NOVATO',
            },
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

UserSchema.methods.toJSON = function () {
    const { __v, _id, password, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('User', UserSchema);
