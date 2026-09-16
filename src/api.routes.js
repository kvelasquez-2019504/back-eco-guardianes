'use strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export class ApiRoutes {
    constructor() {
        this.userRoute = require('#eg/users/user.routes.js');
        this.authRoute = require('#eg/auth/auth.routes.js');
    }

    getUserRoutes() {
        return this.userRoute.default;
    }

    getAuthRoutes() {
        return this.authRoute.default;
    }
}

