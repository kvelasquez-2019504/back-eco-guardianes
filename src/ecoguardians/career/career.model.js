'use strict';

import { Schema, model } from 'mongoose';

const Career = new Schema({
    name: { 
        type: String, 
        required: true 
    }, // Ej: "Informática", "Dibujo Técnico", "Electrónica"
    description: { 
        type: String 
    },
    status: { 
        type: Boolean, 
        default: true 
    },
});

Career.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('Career', Career);

