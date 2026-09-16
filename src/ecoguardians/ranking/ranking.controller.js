'use strict';

import Post from '#eg/post/post.model.js';
import Turn from '#eg/turn/turn.model.js';
import ClassGroup from '#eg/class/classGroup.model.js';
import User from '#eg/users/user.model.js';
import RankingHistory from './rankingHistory.model.js';

/**
 * Calcula y devuelve la tabla de clasificación colectiva por secciones.
 * Permite filtrar por bimestre, etapa (Básico / Diversificado), jornada y año lectivo.
 */
export const getCollectiveRanking = async (req, res) => {
    try {
        const { bimester, stage, shift, academicYear = 2026 } = req.query;
        const year = Number(academicYear);

        // 1. Delimitar fechas si se consulta un bimestre específico
        let dateFilter = {};
        let turnWindow = null;

        if (bimester) {
            const b = Number(bimester);
            const turns = await Turn.find({
                bimester: b,
                academicYear: year,
                status: true,
            }).sort({ startDate: 1 });

            if (turns.length > 0) {
                const minStartDate = turns[0].startDate;
                const maxEndDate = turns[turns.length - 1].endDate;
                dateFilter = {
                    publishedAt: { $gte: minStartDate, $lte: maxEndDate },
                };
                turnWindow = {
                    startDate: minStartDate,
                    endDate: maxEndDate,
                    totalWeeksConfigured: turns.length,
                };
            }
        }

        // 2. Agregación de puntos oficiales verificados de las publicaciones
        const postMatch = {
            status: true,
            isOfficiallyVerified: true,
            academicYear: year,
            ...dateFilter,
        };

        const postScores = await Post.aggregate([
            { $match: postMatch },
            {
                $group: {
                    _id: '$classGroup',
                    postPoints: { $sum: '$officialScore' },
                    postsCount: { $sum: 1 },
                },
            },
        ]);

        // 3. Agregación de bonificaciones de guardia de los turnos
        const turnMatch = {
            status: true,
            academicYear: year,
        };
        if (bimester) {
            turnMatch.bimester = Number(bimester);
        }

        const turnBonusScores = await Turn.aggregate([
            { $match: turnMatch },
            { $unwind: '$bonusAwarded' },
            {
                $group: {
                    _id: '$bonusAwarded.classGroup',
                    bonusPoints: { $sum: '$bonusAwarded.points' },
                },
            },
        ]);

        // Mapear acumulados por sección
        const postMap = new Map();
        postScores.forEach((p) => {
            postMap.set(p._id.toString(), {
                postPoints: p.postPoints,
                postsCount: p.postsCount,
            });
        });

        const bonusMap = new Map();
        turnBonusScores.forEach((b) => {
            bonusMap.set(b._id.toString(), b.bonusPoints);
        });

        // 4. Obtener todas las clases activas
        const classQuery = { status: true, academicYear: year };
        if (shift) {
            classQuery.coveredShifts = shift.toUpperCase();
        }

        const classes = await ClassGroup.find(classQuery)
            .populate('level', 'name stage gradeNumber')
            .populate('career', 'name')
            .populate('teacher', 'name lastName email');

        // Filtrar por etapa educativa si se solicitó (BASICO o DIVERSIFICADO)
        let filteredClasses = classes;
        if (stage) {
            filteredClasses = classes.filter(
                (c) => c.level && c.level.stage === stage.toUpperCase()
            );
        }

        // 5. Consolidar tabla de posiciones
        const rankingList = filteredClasses.map((c) => {
            const cid = c._id.toString();
            const pData = postMap.get(cid) || { postPoints: 0, postsCount: 0 };
            const bonusPoints = bonusMap.get(cid) || 0;
            const totalScore = pData.postPoints + bonusPoints;

            return {
                classGroupId: c._id,
                name: c.name,
                section: c.section,
                type: c.type,
                stage: c.level?.stage || 'GENERAL',
                gradeNumber: c.level?.gradeNumber || null,
                levelName: c.level?.name || null,
                careerName: c.career?.name || null,
                teacher: c.teacher ? `${c.teacher.name} ${c.teacher.lastName}` : 'Sin asignar',
                coveredShifts: c.coveredShifts,
                postPoints: pData.postPoints,
                bonusPoints,
                postsCount: pData.postsCount,
                totalScore,
            };
        });

        // Ordenar por puntaje total descendente; desempate por cantidad de publicaciones
        rankingList.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (b.postsCount !== a.postsCount) return b.postsCount - a.postsCount;
            return a.name.localeCompare(b.name);
        });

        // Asignar posición ordinal (1°, 2°, 3°, ...)
        const leaderboard = rankingList.map((item, index) => ({
            position: index + 1,
            ...item,
        }));

        const podium = leaderboard.slice(0, 3);

        return res.status(200).json({
            ok: true,
            msg: 'Ranking colectivo de secciones obtenido exitosamente.',
            academicYear: year,
            bimester: bimester ? Number(bimester) : 'ANUAL_ACUMULADO',
            stageFilter: stage ? stage.toUpperCase() : 'TODAS_LAS_ETAPAS',
            shiftFilter: shift ? shift.toUpperCase() : 'TODAS_LAS_JORNADAS',
            turnWindow,
            podium,
            totalParticipatingSections: leaderboard.length,
            leaderboard,
        });
    } catch (error) {
        console.error('Error al calcular ranking colectivo:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al generar ranking colectivo, contacte al administrador.',
            error: error.message,
        });
    }
};

/**
 * Consulta el ranking individual de alumnos por puntos de Eco-Aura.
 */
export const getIndividualRanking = async (req, res) => {
    try {
        const { limit = 20, from = 0, level } = req.query;
        const query = { role: 'STUDENT', status: true };

        if (level) {
            query['ecoAura.level'] = level.toUpperCase();
        }

        const students = await User.find(query, 'name lastName email code ecoAura')
            .sort({ 'ecoAura.points': -1, 'name': 1 })
            .skip(Number(from))
            .limit(Number(limit));

        const totalStudents = await User.countDocuments(query);

        // Asignar posición ordinal según la paginación
        const topStudents = students.map((s, index) => ({
            position: Number(from) + index + 1,
            uid: s._id,
            name: s.name,
            lastName: s.lastName,
            code: s.code,
            ecoAura: s.ecoAura,
        }));

        // Conteo de distribución por rango de aura
        const distributionAgg = await User.aggregate([
            { $match: { role: 'STUDENT', status: true } },
            { $group: { _id: '$ecoAura.level', count: { $sum: 1 } } },
        ]);

        const auraDistribution = {
            NOVATO: 0,
            GUARDIAN: 0,
            LEYENDA: 0,
        };
        distributionAgg.forEach((d) => {
            if (d._id && auraDistribution[d._id] !== undefined) {
                auraDistribution[d._id] = d.count;
            }
        });

        return res.status(200).json({
            ok: true,
            msg: 'Ranking individual de Eco-Aura obtenido exitosamente.',
            totalStudents,
            auraDistribution,
            topStudents,
        });
    } catch (error) {
        console.error('Error al consultar ranking individual:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar ranking individual.',
            error: error.message,
        });
    }
};

/**
 * Cierre oficial y congelamiento de podio de un bimestre (Solo ADMIN o COORDINATOR).
 * Guarda de forma inmutable el podio de Básicos, Diversificado, General y el Top de Alumnos.
 */
export const closeBimester = async (req, res) => {
    try {
        const { bimester, academicYear = 2026, notes } = req.body;
        const b = Number(bimester);
        const year = Number(academicYear);

        // 1. Obtener ventana de fechas del bimestre
        const turns = await Turn.find({
            bimester: b,
            academicYear: year,
            status: true,
        }).sort({ startDate: 1 });

        let dateFilter = {};
        if (turns.length > 0) {
            dateFilter = {
                publishedAt: {
                    $gte: turns[0].startDate,
                    $lte: turns[turns.length - 1].endDate,
                },
            };
        }

        // 2. Sumar publicaciones oficiales verificadas
        const postScores = await Post.aggregate([
            {
                $match: {
                    status: true,
                    isOfficiallyVerified: true,
                    academicYear: year,
                    ...dateFilter,
                },
            },
            {
                $group: {
                    _id: '$classGroup',
                    postPoints: { $sum: '$officialScore' },
                    postsCount: { $sum: 1 },
                },
            },
        ]);

        // 3. Sumar bonos de guardia del bimestre
        const turnBonusScores = await Turn.aggregate([
            {
                $match: {
                    status: true,
                    bimester: b,
                    academicYear: year,
                },
            },
            { $unwind: '$bonusAwarded' },
            {
                $group: {
                    _id: '$bonusAwarded.classGroup',
                    bonusPoints: { $sum: '$bonusAwarded.points' },
                },
            },
        ]);

        const postMap = new Map();
        postScores.forEach((p) => {
            postMap.set(p._id.toString(), {
                postPoints: p.postPoints,
                postsCount: p.postsCount,
            });
        });

        const bonusMap = new Map();
        turnBonusScores.forEach((tb) => {
            bonusMap.set(tb._id.toString(), tb.bonusPoints);
        });

        const allClasses = await ClassGroup.find({ status: true, academicYear: year })
            .populate('level', 'name stage gradeNumber');

        const formatSectionPodium = (classList) => {
            return classList
                .map((c) => {
                    const cid = c._id.toString();
                    const pData = postMap.get(cid) || { postPoints: 0, postsCount: 0 };
                    const bonusPoints = bonusMap.get(cid) || 0;
                    const totalScore = pData.postPoints + bonusPoints;

                    return {
                        classGroup: c._id,
                        className: c.name,
                        section: c.section,
                        stage: c.level?.stage || 'BASICO',
                        totalScore,
                        postPoints: pData.postPoints,
                        bonusPoints,
                        postsCount: pData.postsCount,
                    };
                })
                .sort((a, b) => b.totalScore - a.totalScore || b.postsCount - a.postsCount)
                .slice(0, 3)
                .map((item, index) => ({ position: index + 1, ...item }));
        };

        const topBasico = formatSectionPodium(
            allClasses.filter((c) => c.level && c.level.stage === 'BASICO')
        );

        const topDiversificado = formatSectionPodium(
            allClasses.filter((c) => c.level && c.level.stage === 'DIVERSIFICADO')
        );

        const topGeneral = formatSectionPodium(allClasses);

        // 4. Obtener el Top 10 de Alumnos líderes en Eco-Aura
        const topStudentDocs = await User.find(
            { role: 'STUDENT', status: true },
            'name lastName code ecoAura'
        )
            .sort({ 'ecoAura.points': -1 })
            .limit(10);

        const topStudents = topStudentDocs.map((s, index) => ({
            position: index + 1,
            student: s._id,
            name: s.name,
            lastName: s.lastName,
            code: s.code,
            ecoAuraPoints: s.ecoAura.points,
            ecoAuraLevel: s.ecoAura.level,
        }));

        // 5. Crear o actualizar el registro histórico del bimestre
        let history = await RankingHistory.findOne({ bimester: b, academicYear: year });
        if (history) {
            history.topSectionsBasico = topBasico;
            history.topSectionsDiversificado = topDiversificado;
            history.topSectionsGeneral = topGeneral;
            history.topStudents = topStudents;
            history.closedBy = req.user._id;
            history.closedAt = new Date();
            if (notes) history.notes = notes;
            await history.save();
        } else {
            history = new RankingHistory({
                bimester: b,
                academicYear: year,
                closedBy: req.user._id,
                closedAt: new Date(),
                topSectionsBasico: topBasico,
                topSectionsDiversificado: topDiversificado,
                topSectionsGeneral: topGeneral,
                topStudents,
                notes: notes || `Cierre oficial del Bimestre ${b} - Año ${year}`,
            });
            await history.save();
        }

        return res.status(201).json({
            ok: true,
            msg: `¡Bimestre ${b} cerrado oficialmente! Podios consolidados y guardados en el historial institucional.`,
            history,
        });
    } catch (error) {
        console.error('Error al cerrar bimestre:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al cerrar el bimestre, contacte al administrador.',
            error: error.message,
        });
    }
};

/**
 * Consulta los podios históricos archivados de bimestres anteriores.
 */
export const getPodiumHistory = async (req, res) => {
    try {
        const { bimester, academicYear } = req.query;
        const query = { status: true };

        if (bimester) query.bimester = Number(bimester);
        if (academicYear) query.academicYear = Number(academicYear);

        const history = await RankingHistory.find(query)
            .populate('closedBy', 'name lastName email')
            .sort({ academicYear: -1, bimester: -1 });

        return res.status(200).json({
            ok: true,
            msg: 'Historial de podios bimestrales obtenido exitosamente.',
            total: history.length,
            history,
        });
    } catch (error) {
        console.error('Error al consultar historial de podios:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar historial de podios.',
            error: error.message,
        });
    }
};

/**
 * Consulta un podio histórico específico por su ID.
 */
export const getPodiumHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await RankingHistory.findById(id).populate('closedBy', 'name lastName email');

        if (!history) {
            return res.status(404).json({
                ok: false,
                msg: 'Historial de podio no encontrado.',
            });
        }

        return res.status(200).json({
            ok: true,
            msg: 'Historial de podio encontrado exitosamente.',
            history,
        });
    } catch (error) {
        console.error('Error al buscar historial de podio:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar historial de podio.',
            error: error.message,
        });
    }
};
