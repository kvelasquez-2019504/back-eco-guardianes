"use strict";

import {Schema, model} from 'mongoose';

const User = Schema({
    idUser: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    status:{
        type: Boolean,
        default: true
    }
});

User.methods.toJSON = function(){
    const { __v, _id, password, ...object } = this.toObject();
    object.uid = _id;
    return object;
};

export default model('User', User);