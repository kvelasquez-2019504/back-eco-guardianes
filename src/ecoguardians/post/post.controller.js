'use strict';

import Post from './post.model.js';
import Enrollment from '#eg/enrollment/enrollment.model.js';
import RubricCriterion from '#eg/rubric/rubric.model.js';
import User from '#eg/users/user.model.js';
import { validateSchoolSchedule } from '#helpers/schedule-validator.js';
import { calculateEcoAuraLevel } from '#helpers/post-validator.js';

export const createPost = async (req, res) => {
    try {
        const studentId = req.user._id;

        // 1. Obtener la matrícula activa del alumno para determinar su sección y jornada
        const enrollment = await Enrollment.findOne({
            student: studentId,
            status: true,
        }).populate({
            path: 'classGroup',
            populate: { path: 'level', select: 'name stage gradeNumber' },
        });

        if (!enrollment || !enrollment.classGroup || !enrollment.classGroup.level) {
            return res.status(400).json({
                ok: false,
                msg: 'No estás matriculado en ninguna clase activa para registrar acciones ecológicas.',
            });
        }

        const stage = enrollment.classGroup.level.stage;
        const shift = enrollment.shift;

        // 2. Validación estricta de horario escolar de Kinal (Lunes a Viernes GMT-6)
        validateSchoolSchedule(stage, shift);

        const { description, images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Debe incluir al menos una imagen fotográfica como evidencia de la acción.',
            });
        }

        const post = new Post({
            student: studentId,
            classGroup: enrollment.classGroup._id,
            shift,
            academicYear: enrollment.academicYear,
            description: description.trim(),
            images,
            publishedAt: new Date(),
        });

        await post.save();

        const populatedPost = await Post.findById(post._id)
            .populate('student', 'name lastName email code ecoAura')
            .populate({
                path: 'classGroup',
                select: 'name section type',
                populate: { path: 'level', select: 'name stage' },
            });

        return res.status(201).json({
            ok: true,
            msg: '¡Evidencia ecológica registrada exitosamente dentro de tu horario escolar!',
            post: populatedPost,
        });
    } catch (error) {
        console.error('Error al crear publicación:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al publicar evidencia.',
        });
    }
};

export const getPosts = async (req, res) => {
    try {
        const { classGroupId, shift, studentId, limit = 20, from = 0 } = req.query;
        const query = { status: true };

        if (classGroupId) query.classGroup = classGroupId;
        if (shift) query.shift = shift.toUpperCase();
        if (studentId) query.student = studentId;

        const [total, posts] = await Promise.all([
            Post.countDocuments(query),
            Post.find(query)
                .populate('student', 'name lastName email code ecoAura')
                .populate('classGroup', 'name section type')
                .populate('evaluations.evaluator', 'name lastName role ecoAura')
                .skip(Number(from))
                .limit(Number(limit))
                .sort({ publishedAt: -1 }),
        ]);

        return res.status(200).json({
            ok: true,
            msg: 'Publicaciones obtenidas exitosamente.',
            total,
            posts,
        });
    } catch (error) {
        console.error('Error al listar publicaciones:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al listar publicaciones, contacte al administrador.',
            error: error.message,
        });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findOne({ _id: id, status: true })
            .populate('student', 'name lastName email code ecoAura')
            .populate('classGroup', 'name section type')
            .populate('evaluations.evaluator', 'name lastName role ecoAura');

        if (!post) {
            return res.status(404).json({
                ok: false,
                msg: 'Publicación no encontrada.',
            });
        }

        return res.status(200).json({
            ok: true,
            msg: 'Publicación obtenida exitosamente.',
            post,
        });
    } catch (error) {
        console.error('Error al buscar publicación:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al buscar publicación, contacte al administrador.',
            error: error.message,
        });
    }
};

export const evaluatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { checks, comment = '' } = req.body;

        if (!checks || !Array.isArray(checks) || checks.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Debe enviar los resultados de la rúbrica (checks: [{ criterionId, achieved }]).',
            });
        }

        const post = await Post.findOne({ _id: id, status: true });
        if (!post) {
            return res.status(404).json({
                ok: false,
                msg: 'Publicación a calificar no encontrada.',
            });
        }

        const evaluator = req.user;
        const author = await User.findById(post.student);

        // 1. Procesar checks según la rúbrica activa
        let calculatedScore = 0;
        const evaluationChecks = [];

        for (const item of checks) {
            const criterion = await RubricCriterion.findOne({
                _id: item.criterionId,
                status: true,
            });

            if (criterion) {
                const isAchieved = Boolean(item.achieved);
                const pointsEarned = isAchieved ? criterion.points : 0;
                calculatedScore += pointsEarned;

                evaluationChecks.push({
                    criterion: criterion._id,
                    title: criterion.title,
                    pointsEarned,
                    achieved: isAchieved,
                });
            }
        }

        const newEvaluation = {
            evaluator: evaluator._id,
            evaluatorRole: evaluator.role,
            checks: evaluationChecks,
            score: calculatedScore,
            comment: comment.trim(),
            evaluatedAt: new Date(),
        };

        // 2. Separación de Lógica según el Rol del Evaluador (Modelo Híbrido)
        if (['ADMIN', 'COORDINATOR', 'TEACHER'].includes(evaluator.role)) {
            // EVALUACIÓN OFICIAL (Suma al ranking de la sección y al Eco-Aura del autor)
            post.officialScore += calculatedScore;
            post.isOfficiallyVerified = true;
            post.totalEcoAuraEarned += calculatedScore;
            post.evaluations.push(newEvaluation);
            await post.save();

            // Aumentar Eco-Aura del alumno autor
            if (author) {
                author.ecoAura.points += calculatedScore;
                author.ecoAura.level = calculateEcoAuraLevel(author.ecoAura.points);
                await author.save();
            }

            return res.status(200).json({
                ok: true,
                msg: `Evaluación oficial registrada con éxito. Puntos otorgados a la sección: +${calculatedScore}`,
                scoreGranted: calculatedScore,
                type: 'OFICIAL',
                authorNewAura: author ? author.ecoAura : null,
                post,
            });
        } else {
            // EVALUACIÓN COMUNITARIA / PARES (STUDENT)
            // Regla antifraude: No autocalificarse
            if (post.student.toString() === evaluator._id.toString()) {
                return res.status(400).json({
                    ok: false,
                    msg: 'No puedes calificar tu propia publicación.',
                });
            }

            // Regla antifraude: No calificar dos veces el mismo post
            const alreadyEvaluated = post.evaluations.some(
                (e) => e.evaluator.toString() === evaluator._id.toString()
            );
            if (alreadyEvaluated) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ya has calificado esta publicación con anterioridad.',
                });
            }

            // Puntos comunitarios al post (sin límite de participación de compañeros)
            post.communityScore += calculatedScore;
            post.totalEcoAuraEarned += calculatedScore;
            post.evaluations.push(newEvaluation);
            await post.save();

            // Aumentar Eco-Aura del alumno autor (+puntos según rúbrica de pares)
            if (author) {
                author.ecoAura.points += calculatedScore;
                author.ecoAura.level = calculateEcoAuraLevel(author.ecoAura.points);
                await author.save();
            }

            // Aumentar Eco-Aura del alumno evaluador (+5 pts por participar como Eco-Vigilante)
            evaluator.ecoAura.points += 5;
            evaluator.ecoAura.level = calculateEcoAuraLevel(evaluator.ecoAura.points);
            await evaluator.save();

            return res.status(200).json({
                ok: true,
                msg: `Revisión comunitaria registrada. +${calculatedScore} pts de Eco-Aura para el autor y +5 pts para ti como revisor.`,
                type: 'COMUNITARIA',
                evaluatorNewAura: evaluator.ecoAura,
                authorNewAura: author ? author.ecoAura : null,
                post,
            });
        }
    } catch (error) {
        console.error('Error al evaluar publicación:', error);
        return res.status(400).json({
            ok: false,
            msg: error.message || 'Error al calificar publicación.',
        });
    }
};

export const getMyPosts = async (req, res) => {
    try {
        const studentId = req.user._id;

        const posts = await Post.find({
            student: studentId,
            status: true,
        })
            .populate('classGroup', 'name section type')
            .populate('evaluations.evaluator', 'name lastName role ecoAura')
            .sort({ publishedAt: -1 });

        return res.status(200).json({
            ok: true,
            msg: 'Tus publicaciones fueron obtenidas exitosamente.',
            total: posts.length,
            posts,
        });
    } catch (error) {
        console.error('Error al obtener mis publicaciones:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al consultar tus publicaciones, contacte al administrador.',
            error: error.message,
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                ok: false,
                msg: 'Publicación no encontrada.',
            });
        }

        // Solo el autor o un ADMIN pueden eliminar el post
        if (req.user.role !== 'ADMIN' && post.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para eliminar esta publicación.',
            });
        }

        post.status = false;
        await post.save();

        return res.status(200).json({
            ok: true,
            msg: 'Publicación eliminada exitosamente.',
        });
    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al eliminar publicación, contacte al administrador.',
            error: error.message,
        });
    }
};
