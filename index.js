'use strict';
import {config} from 'dotenv';
import Server from './config/server.js';

config();

const server = new Server();

server.run();