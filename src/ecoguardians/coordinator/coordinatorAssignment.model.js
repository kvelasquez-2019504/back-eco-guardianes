'use strict';

import { Schema, model } from 'mongoose';

const CoordinatorAssignment = new Schema({
    coordinator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    level: {
        type: Schema.Types.ObjectId,
        ref: 'Level',
        required: true,
    },
    status: { type: Boolean, default: true },
});

CoordinatorAssignment.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('CoordinatorAssignment', CoordinatorAssignment);

