'use strict';

import User from './user.model.js';
import {encryptPassword} from '../../helpers/encrypt.js';

export const createUser = async (req, res) => {
    try{
        const {name, lastName, email, password} = req.body;
        let hashedPassword = await encryptPassword(password);
        let user = new User({
            name,lastName, email, password:hashedPassword
        });
        await user.save();

        res.status(201).json({
            ok:true,
            msg: "Usuario creado correctamente.",
            user
        });
    } catch (error){
        res.status(500).json({
            ok: false,
            msg: "Error inesperado al crear usuario, contacte al administrador",
            error
        });
    }
};

export const readUser = async (req, res) => {
    try{
        let user = await User.find();
        res.status(201).json({
            ok:true,
            msg: "Usuarios listados correctamente",
            user
        });
    } catch (error){
        res.status(500).json({
            ok: false,
            msg: "Error inesperado al crear usuario, contacte al administrador",
            error
        });
    }
};

export const searchUser = async (req, res) => {
    try{
        const{id}= req.header;
        let user = await User.findOne({uid:id});
        res.status(201).json({
            ok:true,
            msg: "Usuario encontrado correctamente",
            user
        });
    } catch (error){
        res.status(500).json({
            ok: false,
            msg: "Error inesperado al crear usuario, contacte al administrador",
            error
        });
    }
};