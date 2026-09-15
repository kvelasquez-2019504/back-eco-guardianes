'use strict';
import Server from './config/server.js';
import {config} from 'dotenv';

config({
    filepath: './.env',
    debug:true
});

const server = new Server();


server.run();