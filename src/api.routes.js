'use strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export class ApiRoutes {
    constructor() {
        this.userRoute = require('./ecoguardians/users/user.routes.js');
    }

    getUserRoutes() {
        return this.userRoute.default;
    }
}