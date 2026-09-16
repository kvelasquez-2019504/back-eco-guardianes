'use strict';

import { Schema, model } from 'mongoose';

const Enrollment = new Schema({
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
    academicYear: { type: Number, default: 2026 },
    status: { type: Boolean, default: true },
});
