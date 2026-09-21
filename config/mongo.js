'use strict';

import dns from 'dns';
import mongoose from 'mongoose';

// Resolver bloqueo de registros DNS SRV (querySrv ECONNREFUSED) de routers/ISPs locales para MongoDB Atlas
try {
    dns.setServers([
        process.env.DNS_1, process.env.DNS_2]);
} catch (e) {
    // Mantener DNS del sistema en caso de entornos restringidos
}

export const connectionDB = async () => {
    const { connection, connect } = mongoose;
    try {
        connection.on('error', () => {
            console.log('MongoDB | could not be connected to MongoDB');
            mongoose.disconnect();
        });
        connection.on('connecting', () => {
            console.log('MongoDB | Try connecting');
        });
        connection.on('connected', () => {
            console.log('MongoDB | connected to MongoDB');
        });
        connection.on('open', () => {
            console.log('MongoDB | connected to database');
        });
        connection.on('reconnected', () => {
            console.log('MongoDB | reconnected to MongoDB');
        });
        connection.on('disconnected', () => {
            console.log('MongoDB | disconnected');
        });

        await connect(process.env.URI_MONGO, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 50,
        });
    } catch (error) {
        console.log('Database connection failed', error);
    }
};
