'use strict';

import CoordinatorAssignment from './coordinatorAssignment.model.js';
import Level from '#eg/level/level.model.js';

export const assignCoordinatorLevels = async (req, res) => {
    try {
        const { coordinatorId, levelIds } = req.body;

        const ids = Array.isArray(levelIds) ? levelIds : [levelIds];

        const validLevels = await Level.find({ _id: { $in: ids }, status: true });
        if (validLevels.length !== ids.length) {
            return res.status(400).json({
                ok: false,
                msg: 'Uno o más niveles educativos proporcionados no existen o están inactivos.',
            });
        }

        const results = [];
        for (const levelId of ids) {
            let assignment = await CoordinatorAssignment.findOne({
                coordinator: coordinatorId,
                level: levelId,
            });

            if (!assignment) {
                assignment = new CoordinatorAssignment({
                    coordinator: coordinatorId,
                    level: levelId,
                    status: true,
                });
                await assignment.save();
                results.push({ levelId, status: 'asignado' });
            } else if (!assignment.status) {
                assignment.status = true;
                await assignment.save();
                results.push({ levelId, status: 'reactivado' });
            } else {
                results.push({ levelId, status: 'ya asignado' });
            }
        }

        return res.status(200).json({
            ok: true,
            msg: 'Niveles asignados al coordinador exitosamente.',
            results,
        });
    } catch (error) {
        console.error('Error al asignar niveles al coordinador:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al asignar niveles al coordinador, contacte al administrador.',
            error: error.message,
        });
    }
};

export const unassignCoordinatorLevel = async (req, res) => {
    try {
        const { coordinatorId, levelId } = req.body;

        const assignment = await CoordinatorAssignment.findOneAndUpdate(
            { coordinator: coordinatorId, level: levelId, status: true },
            { status: false },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontró una asignación activa para este coordinador y nivel.',
            });
        }

        return res.status(200).json({
            ok: true,
            msg: 'Nivel desasignado del coordinador exitosamente.',
        });
    } catch (error) {
        console.error('Error al desasignar nivel del coordinador:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al desasignar nivel, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getAllAssignments = async (req, res) => {
    try {
        const assignments = await CoordinatorAssignment.find({ status: true })
            .populate('coordinator', 'name lastName email code')
            .populate('level', 'name stage gradeNumber allowedSections');

        return res.status(200).json({
            ok: true,
            msg: 'Asignaciones de coordinación obtenidas exitosamente.',
            total: assignments.length,
            assignments,
        });
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al obtener asignaciones, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getCoordinatorLevels = async (req, res) => {
    try {
        const { coordinatorId } = req.params;

        const assignments = await CoordinatorAssignment.find({
            coordinator: coordinatorId,
            status: true,
        }).populate('level', 'name stage gradeNumber allowedSections');

        const levels = assignments.map((a) => a.level).filter(Boolean);

        return res.status(200).json({
            ok: true,
            msg: 'Niveles del coordinador obtenidos exitosamente.',
            total: levels.length,
            levels,
        });
    } catch (error) {
        console.error('Error al obtener niveles del coordinador:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar niveles del coordinador, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getMyAssignedLevels = async (req, res) => {
    try {
        const coordinatorId = req.user._id;

        const assignments = await CoordinatorAssignment.find({
            coordinator: coordinatorId,
            status: true,
        }).populate('level', 'name stage gradeNumber allowedSections');

        const levels = assignments.map((a) => a.level).filter(Boolean);

        return res.status(200).json({
            ok: true,
            msg: 'Tus niveles asignados fueron obtenidos exitosamente.',
            total: levels.length,
            levels,
        });
    } catch (error) {
        console.error('Error al obtener mis niveles asignados:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar tus niveles asignados, contacte al administrador.',
            error: error.message,
        });
    }
};
