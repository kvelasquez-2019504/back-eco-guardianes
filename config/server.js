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
        this.authPath = `${process.env.ROUTER_PATH_MASTER}/auth`;
        this.levelPath = `${process.env.ROUTER_PATH_MASTER}/level`;
        this.careerPath = `${process.env.ROUTER_PATH_MASTER}/career`;
        this.coordinatorPath = `${process.env.ROUTER_PATH_MASTER}/coordinator`;
        this.classPath = `${process.env.ROUTER_PATH_MASTER}/class`;
        this.enrollmentPath = `${process.env.ROUTER_PATH_MASTER}/enrollment`;
        this.rubricPath = `${process.env.ROUTER_PATH_MASTER}/rubric`;
        this.postPath = `${process.env.ROUTER_PATH_MASTER}/post`;
        this.turnPath = `${process.env.ROUTER_PATH_MASTER}/turn`;
        this.rankingPath = `${process.env.ROUTER_PATH_MASTER}/ranking`;
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
        app.use(this.levelPath, this.apiRouters.getLevelRoutes());
        app.use(this.careerPath, this.apiRouters.getCareerRoutes());
        app.use(this.coordinatorPath, this.apiRouters.getCoordinatorRoutes());
        app.use(this.classPath, this.apiRouters.getClassRoutes());
        app.use(this.enrollmentPath, this.apiRouters.getEnrollmentRoutes());
        app.use(this.rubricPath, this.apiRouters.getRubricRoutes());
        app.use(this.postPath, this.apiRouters.getPostRoutes());
        app.use(this.turnPath, this.apiRouters.getTurnRoutes());
        app.use(this.rankingPath, this.apiRouters.getRankingRoutes());
    }

    run() {
        app.listen(process.env.PORT, () => {
            console.log(`Server running on ${process.env.PORT}`);
        });
    }
}

export default Server;
