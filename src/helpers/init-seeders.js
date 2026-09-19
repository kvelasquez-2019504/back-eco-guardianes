'use strict';

import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '#eg/users/user.model.js';
import Level from '#eg/level/level.model.js';
import Career from '#eg/career/career.model.js';
import RubricCriterion from '#eg/rubric/rubric.model.js';
import { encryptPassword } from '#helpers/encrypt.js';
import { connectionDB } from '../../config/mongo.js';

/**
 * Sembrador de Usuario Administrador Inicial
 */
export const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({
            $or: [{ role: 'ADMIN' }, { email: 'admin@kinal.edu.gt' }],
        });

        if (!adminExists) {
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
            const hashedPassword = await encryptPassword(defaultPassword);

            const admin = new User({
                name: 'Administrador',
                lastName: 'General',
                email: 'admin@kinal.edu.gt',
                password: hashedPassword,
                role: 'ADMIN',
                code: 'ADMIN-01',
                ecoAura: {
                    points: 0,
                    level: 'LEYENDA',
                },
                status: true,
            });

            await admin.save();
            console.log(`[🌱 SEED] Usuario Administrador creado exitosamente`);
        } else {
            console.log('[🌱 SEED] Usuario Administrador verificado (ya existe en el sistema).');
        }
    } catch (error) {
        console.error('[❌ SEED ERROR] Error al sembrar usuario administrador:', error.message);
    }
};

/**
 * Sembrador de Niveles Educativos de Kinal
 */
export const seedLevels = async () => {
    try {
        const defaultLevels = [
            {
                name: 'Primero Básico',
                stage: 'BASICO',
                gradeNumber: 1,
                allowedSections: ['A', 'B', 'C', 'D', 'E', 'F'],
            },
            {
                name: 'Segundo Básico',
                stage: 'BASICO',
                gradeNumber: 2,
                allowedSections: ['A', 'B', 'C', 'D', 'E'],
            },
            {
                name: 'Tercero Básico',
                stage: 'BASICO',
                gradeNumber: 3,
                allowedSections: ['A', 'B', 'C', 'D'],
            },
            {
                name: 'Cuarto Diversificado',
                stage: 'DIVERSIFICADO',
                gradeNumber: 4,
                allowedSections: ['A', 'B', 'C'],
            },
            {
                name: 'Quinto Diversificado',
                stage: 'DIVERSIFICADO',
                gradeNumber: 5,
                allowedSections: ['A', 'B', 'C'],
            },
            {
                name: 'Sexto Diversificado',
                stage: 'DIVERSIFICADO',
                gradeNumber: 6,
                allowedSections: ['A', 'B', 'C'],
            },
        ];

        let createdCount = 0;
        for (const def of defaultLevels) {
            const exists = await Level.findOne({ name: def.name });
            if (!exists) {
                const level = new Level(def);
                await level.save();
                createdCount++;
            }
        }

        if (createdCount > 0) {
            console.log(`[🌱 SEED] Se sembraron ${createdCount} niveles educativos de Kinal.`);
        } else {
            console.log('[🌱 SEED] Niveles educativos verificados (los 6 niveles están activos).');
        }
    } catch (error) {
        console.error('[❌ SEED ERROR] Error al sembrar niveles educativos:', error.message);
    }
};

/**
 * Sembrador de Carreras Técnicas de Kinal
 */
export const seedCareers = async () => {
    try {
        const defaultCareers = [
            {
                name: 'Informática',
                description: 'Desarrollo de software, sistemas y tecnologías web.',
            },
            {
                name: 'Dibujo Técnico',
                description: 'Diseño arquitectónico y modelado técnico digital.',
            },
            {
                name: 'Electrónica',
                description: 'Sistemas electrónicos, circuitos y automatización industrial.',
            },
        ];

        let createdCount = 0;
        for (const def of defaultCareers) {
            const exists = await Career.findOne({ name: def.name });
            if (!exists) {
                const career = new Career(def);
                await career.save();
                createdCount++;
            }
        }

        if (createdCount > 0) {
            console.log(`[🌱 SEED] Se sembraron ${createdCount} carreras técnicas.`);
        } else {
            console.log('[🌱 SEED] Carreras técnicas verificadas (las 3 carreras están activas).');
        }
    } catch (error) {
        console.error('[❌ SEED ERROR] Error al sembrar carreras técnicas:', error.message);
    }
};

/**
 * Sembrador de Criterios Oficiales de la Rúbrica
 */
export const seedRubrics = async () => {
    try {
        const defaultCriteria = [
            {
                title: 'Clasificación Correcta de Residuos',
                description: 'El desecho se depositó en el contenedor adecuado (Orgánico, Inorgánico, Reciclable).',
                points: 15,
                category: 'CLASIFICACION',
                order: 1,
            },
            {
                title: 'Área Circundante Impecable',
                description: 'El suelo y perímetro alrededor de los basureros se encuentra completamente limpio y sin restos.',
                points: 10,
                category: 'LIMPIEZA',
                order: 2,
            },
            {
                title: 'Bolsas y Tapas en Orden',
                description: 'Los botes cuentan con su bolsa correcta colocada y las tapas o accesos están bien colocados.',
                points: 5,
                category: 'ORDEN',
                order: 3,
            },
            {
                title: 'Iniciativa Comunitaria Extra',
                description: 'El alumno o grupo recogió basura adicional en pasillos, patio o salón de clases de forma proactiva.',
                points: 10,
                category: 'GENERAL',
                order: 4,
            },
        ];

        let createdCount = 0;
        for (const def of defaultCriteria) {
            const exists = await RubricCriterion.findOne({ title: def.title });
            if (!exists) {
                const criterion = new RubricCriterion(def);
                await criterion.save();
                createdCount++;
            }
        }

        if (createdCount > 0) {
            console.log(`[🌱 SEED] Se sembraron ${createdCount} criterios de rúbrica oficiales.`);
        } else {
            console.log('[🌱 SEED] Criterios de rúbrica verificados (los 4 criterios están activos).');
        }
    } catch (error) {
        console.error('[❌ SEED ERROR] Error al sembrar criterios de rúbrica:', error.message);
    }
};

/**
 * Función Maestra: Ejecuta todos los seeders de forma secuencial e idempotente.
 */
export const initSeeders = async () => {
    console.log('--------------------------------------------------');
    console.log('🌱 [INICIALIZACIÓN DE SEMILLAS] Verificando datos base...');
    await seedAdminUser();
    await seedLevels();
    await seedCareers();
    await seedRubrics();
    console.log('✅ [INICIALIZACIÓN DE SEMILLAS] Base de datos inicializada y lista.');
    console.log('--------------------------------------------------');
};

