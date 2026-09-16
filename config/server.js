'use strict';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { connectionDB } from './mongo.js';
import { createRequire } from 'module';
import apiLimiter from "#middlewares/limit-petition.js";
const require = createRequire(import.meta.url);
const app = express();

class Server {
    constructor() {
        this.userPath = `${process.env.ROUTER_PATH_MASTER}/user`;
        this.authPath =  `${process.env.ROUTER_PATH_MASTER}/auth`;
        this.apiRouters = new (require(`${process.env.ROOT_PATH_INTERNAL}/api.routes.js`).ApiRoutes)();
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
        app.use(apiLimiter);
    }

    connectDB() {
        connectionDB();
    }

    routes() {
        app.use(this.userPath, this.apiRouters.getUserRoutes());
        app.use(this.authPath, this.apiRouters.getAuthRoutes());
    }

    run() {
        app.listen(process.env.PORT, () => {
            console.log(`Server running on ${process.env.PORT}`);
        });
    }
}

export default Server;
