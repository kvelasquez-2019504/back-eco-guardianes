'use strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export class ApiRoutes {
    constructor() {
        this.userRoute = require('#eg/users/user.routes.js');
        this.authRoute = require('#eg/auth/auth.routes.js');
        this.levelRoute = require('#eg/level/level.routes.js');
        this.careerRoute = require('#eg/career/career.routes.js');
        this.coordinatorRoute = require('#eg/coordinator/coordinatorAssignment.routes.js');
        this.classRoute = require('#eg/class/classGroup.routes.js');
    }

    getUserRoutes() {
        return this.userRoute.default;
    }

    getAuthRoutes() {
        return this.authRoute.default;
    }

    getLevelRoutes() {
        return this.levelRoute.default;
    }

    getCareerRoutes() {
        return this.careerRoute.default;
    }

    getCoordinatorRoutes() {
        return this.coordinatorRoute.default;
    }

    getClassRoutes() {
        return this.classRoute.default;
    }
}

