'use strict';

import Turn from './turn.model.js';
import Level from '#eg/level/level.model.js';
import ClassGroup from '#eg/class/classGroup.model.js';

export const getCurrentTurn = async (req, res) => {
    try {
        const now = new Date();

        // 1. Buscar turno cuya ventana de fechas abarque el día actual
        let currentTurn = await Turn.findOne({
            startDate: { $lte: now },
            endDate: { $gte: now },
            status: true,
        }).populate('activeLevels', 'name stage gradeNumber allowedSections')
          .populate('bonusAwarded.classGroup', 'name section');

        // Si no hay ninguno exactamente hoy, buscar el más próximo
        if (!currentTurn) {
            currentTurn = await Turn.findOne({ status: true })
                .sort({ startDate: -1 })
                .populate('activeLevels', 'name stage gradeNumber allowedSections')
                .populate('bonusAwarded.classGroup', 'name section');
        }

        if (!currentTurn) {
            return res.status(404).json({
                ok: false,
                msg: 'No hay ningún turno semanal de Eco-Guardianes configurado actualmente.',
            });
        }

        // 2. Obtener todas las secciones/clases que están de guardia esta semana
        let activeClassesQuery = { status: true, academicYear: currentTurn.academicYear };

        if (!currentTurn.isAllLevelsActive && currentTurn.activeLevels && currentTurn.activeLevels.length > 0) {
            const levelIds = currentTurn.activeLevels.map((l) => l._id);
            activeClassesQuery.level = { $in: levelIds };
        }

        const activeGuardianClasses = await ClassGroup.find(activeClassesQuery)
            .populate('level', 'name stage gradeNumber')
            .populate('career', 'name')
            .populate('teacher', 'name lastName email')
            .sort({ name: 1 });

        return res.status(200).json({
            ok: true,
            msg: `Turno actual: Semana ${currentTurn.weekNumber} del Bimestre ${currentTurn.bimester}.`,
            currentTurn,
            totalGuardianClasses: activeGuardianClasses.length,
            activeGuardianClasses,
        });
    } catch (error) {
        console.error('Error al obtener turno actual:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar el turno actual, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getTurns = async (req, res) => {
    try {
        const { bimester, academicYear = 2026 } = req.query;
        const query = { status: true, academicYear: Number(academicYear) };

        if (bimester) {
            query.bimester = Number(bimester);
        }

        const turns = await Turn.find(query)
            .populate('activeLevels', 'name stage gradeNumber')
            .populate('bonusAwarded.classGroup', 'name section')
            .sort({ bimester: 1, weekNumber: 1 });

        return res.status(200).json({
            ok: true,
            msg: 'Calendario de turnos obtenido exitosamente.',
            total: turns.length,
            turns,
        });
    } catch (error) {
        console.error('Error al listar turnos:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar turnos, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getTurnById = async (req, res) => {
    try {
        const { id } = req.params;

        const turn = await Turn.findById(id)
            .populate('activeLevels', 'name stage gradeNumber allowedSections')
            .populate('bonusAwarded.classGroup', 'name section');

        if (!turn) {
            return res.status(404).json({
                ok: false,
                msg: 'Turno no encontrado.',
            });
        }

        return res.status(200).json({
            ok: true,
            msg: 'Turno encontrado exitosamente.',
            turn,
        });
    } catch (error) {
        console.error('Error al buscar turno:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar turno, contacte al administrador.',
            error: error.message,
        });
    }
};

export const generateBimesterSchedule = async (req, res) => {
    try {
        const { bimester, startDate, academicYear = 2026 } = req.body;
        const b = Number(bimester);

        const levels = await Level.find({ status: true }).sort({ gradeNumber: 1 });
        if (levels.length < 6) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requieren los 6 niveles educativos registrados para generar el calendario automático. Ejecute /level/seed primero si es necesario.',
            });
        }

        const lvl1 = levels.find((l) => l.gradeNumber === 1);
        const lvl2 = levels.find((l) => l.gradeNumber === 2);
        const lvl3 = levels.find((l) => l.gradeNumber === 3);
        const lvl4 = levels.find((l) => l.gradeNumber === 4);
        const lvl5 = levels.find((l) => l.gradeNumber === 5);
        const lvl6 = levels.find((l) => l.gradeNumber === 6);

        let initialDate = startDate ? new Date(startDate) : new Date();

        // Eliminar turnos previos de ese bimestre y año para regenerar
        await Turn.deleteMany({ bimester: b, academicYear: Number(academicYear) });

        const createdTurns = [];

        // Matriz de rotación por niveles en las 8 semanas
        for (let week = 1; week <= 8; week++) {
            const start = new Date(initialDate);
            start.setDate(start.getDate() + (week - 1) * 7);

            const end = new Date(start);
            end.setDate(end.getDate() + 4); // Lunes a Viernes (5 días lectivos)
            end.setHours(23, 59, 59, 999);

            let activeLevels = [];
            let isAllLevelsActive = false;
            let notes = '';

            if (week === 1 || week === 4) {
                // 1ro Básico + 4to Diversificado
                activeLevels = [lvl1._id, lvl4._id];
                notes = `Ronda ${week === 1 ? '1' : '2 (Revancha)'}: 1ro Básico y 4to Diversificado`;
            } else if (week === 2 || week === 5) {
                // 2do Básico + 5to Diversificado
                activeLevels = [lvl2._id, lvl5._id];
                notes = `Ronda ${week === 2 ? '1' : '2 (Revancha)'}: 2do Básico y 5to Diversificado`;
            } else if (week === 3 || week === 6) {
                // Regla especial de 6to Diversificado: en Bimestre 4 NO participa
                if (b === 4) {
                    activeLevels = [lvl3._id];
                    notes = `Ronda ${week === 3 ? '1' : '2'}: 3ro Básico (6to Diversificado excluido por prácticas supervisadas)`;
                } else {
                    activeLevels = [lvl3._id, lvl6._id];
                    notes = `Ronda ${week === 3 ? '1' : '2 (Revancha)'}: 3ro Básico y 6to Diversificado`;
                }
            } else {
                // Semanas 7 y 8: Gran Final Bimestral
                isAllLevelsActive = true;
                activeLevels = levels.map((l) => l._id);
                notes = `Semana ${week}: GRAN FINAL BIMESTRAL - Todos los niveles y secciones activos`;
            }

            const turn = new Turn({
                bimester: b,
                weekNumber: week,
                startDate: start,
                endDate: end,
                academicYear: Number(academicYear),
                activeLevels,
                isAllLevelsActive,
                notes,
            });

            await turn.save();
            createdTurns.push(turn);
        }

        return res.status(201).json({
            ok: true,
            msg: `Calendario oficial de las 8 semanas para el Bimestre ${b} generado exitosamente.`,
            totalWeeks: createdTurns.length,
            schedule: createdTurns,
        });
    } catch (error) {
        console.error('Error al generar calendario del bimestre:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al generar calendario del bimestre.',
            error: error.message,
        });
    }
};

export const createTurn = async (req, res) => {
    try {
        const { bimester, weekNumber, startDate, endDate, academicYear = 2026, activeLevels, isAllLevelsActive, notes } = req.body;

        const turn = new Turn({
            bimester: Number(bimester),
            weekNumber: Number(weekNumber),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            academicYear: Number(academicYear),
            activeLevels: activeLevels || [],
            isAllLevelsActive: Boolean(isAllLevelsActive),
            notes: notes || '',
        });

        await turn.save();

        return res.status(201).json({
            ok: true,
            msg: 'Turno semanal creado exitosamente.',
            turn,
        });
    } catch (error) {
        console.error('Error al crear turno:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear turno, contacte al administrador.',
            error: error.message,
        });
    }
};

export const awardGuardianBonus = async (req, res) => {
    try {
        const { id } = req.params;
        const { classGroupId, points = 50, reason } = req.body;

        const turn = await Turn.findById(id);
        if (!turn) {
            return res.status(404).json({
                ok: false,
                msg: 'Turno no encontrado.',
            });
        }

        const classGroup = await ClassGroup.findOne({ _id: classGroupId, status: true });
        if (!classGroup) {
            return res.status(404).json({
                ok: false,
                msg: 'Clase / Sección no encontrada.',
            });
        }

        turn.bonusAwarded.push({
            classGroup: classGroupId,
            points: Number(points),
            awardedBy: req.user._id,
            reason: reason || 'Bono de cumplimiento destacado en semana de Eco-Guardianes',
            awardedAt: new Date(),
        });

        await turn.save();

        return res.status(200).json({
            ok: true,
            msg: `Bono de guardia (+${points} pts) otorgado exitosamente a la sección '${classGroup.name}'.`,
            turn,
        });
    } catch (error) {
        console.error('Error al otorgar bono de guardia:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al otorgar bono de guardia, contacte al administrador.',
            error: error.message,
        });
    }
};

export const updateTurn = async (req, res) => {
    try {
        const { id } = req.params;
        const turn = await Turn.findByIdAndUpdate(id, req.body, { new: true })
            .populate('activeLevels', 'name stage gradeNumber');

        return res.status(200).json({
            ok: true,
            msg: 'Turno semanal actualizado exitosamente.',
            turn,
        });
    } catch (error) {
        console.error('Error al actualizar turno:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al actualizar turno, contacte al administrador.',
            error: error.message,
        });
    }
};

export const deleteTurn = async (req, res) => {
    try {
        const { id } = req.params;
        await Turn.findByIdAndUpdate(id, { status: false }, { new: true });

        return res.status(200).json({
            ok: true,
            msg: 'Turno semanal desactivado exitosamente.',
        });
    } catch (error) {
        console.error('Error al desactivar turno:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al desactivar turno, contacte al administrador.',
            error: error.message,
        });
    }
};
