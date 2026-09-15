'use strict';
import {Router} from 'express';
import {
    createUser,
    readUser,
    searchUser
} from './user.controller.js';

let router = Router();

router.post('/',
    [],
    createUser
);

router.get("/",
    [],
    readUser
)

router.get("/:id",
    [],
    searchUser
)


export default router;

