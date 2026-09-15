'use strict';
import express from 'express';
import helmet from 'helmet';
import morgan from "morgan";
import cors from 'cors';
import {connectionDB} from "./mongo.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = express();

class Server{

    constructor(){
        this.userPath = `${process.env.ROUTER_PATH_MASTER}/user`;
        this.apiRouters = new (require(`../src/api.routes.js`).ApiRoutes)();
        this.middleware();
        this.connectDB();
        this.routes();
    }

    middleware(){
        app.use(express.json());
        app.use(express.urlencoded({extended: false}));
        app.use(helmet());
        app.use(morgan("dev"));
        app.use(cors());
    }

    connectDB(){
        connectionDB();
    }

    routes(){
       app.use(this.userPath, this.apiRouters.getUserRoutes());
    }
    
    run(){
        app.listen(process.env.PORT,()=>{
            console.log(`Server running on ${process.env.PORT}`);
        });
    }
}

export default Server;