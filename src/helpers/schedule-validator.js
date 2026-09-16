'use strict';

/**
 * Obtiene la fecha y hora actual en el huso horario oficial de Guatemala (UTC-6).
 */
export const getGuatemalaTime = () => {
    const now = new Date();
    const options = { timeZone: 'America/Guatemala', hour12: false };
    const dateString = now.toLocaleString('en-US', options);
    const gtDate = new Date(dateString);

    const dayOfWeek = gtDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const hours = gtDate.getHours();
    const minutes = gtDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    return { dayOfWeek, hours, minutes, totalMinutes, gtDate };
};

/**
 * Valida si la hora y día actual corresponden a los horarios escolares oficiales de Kinal:
 * - Lunes a Viernes únicamente.
 * - Básicos (Matutina): 07:00 a 13:15 hrs.
 * - Diversificado Matutina: 07:00 a 12:05 hrs.
 * - Diversificado Vespertina: 12:40 a 17:40 hrs.
 * 
 * @param {string} stage 'BASICO' o 'DIVERSIFICADO'
 * @param {string} shift 'MATUTINA' o 'VESPERTINA'
 */
export const validateSchoolSchedule = (stage, shift) => {
    const { dayOfWeek, hours, minutes, totalMinutes } = getGuatemalaTime();

    // Validar día lectivo (Lunes=1 a Viernes=5)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error(
            'Las evidencias ecológicas solo pueden publicarse de Lunes a Viernes en jornada escolar.'
        );
    }

    const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (stage === 'BASICO') {
        const start = 7 * 60; // 07:00 -> 420 mins
        const end = 13 * 60 + 15; // 13:15 -> 795 mins

        if (totalMinutes < start || totalMinutes > end) {
            throw new Error(
                `Horario escolar no válido para Ciclo Básico. Horario permitido: 07:00 a 13:15 hrs. Hora actual: ${currentTimeStr} hrs.`
            );
        }
    } else if (stage === 'DIVERSIFICADO') {
        if (shift === 'MATUTINA') {
            const start = 7 * 60; // 07:00 -> 420 mins
            const end = 12 * 60 + 5; // 12:05 -> 725 mins

            if (totalMinutes < start || totalMinutes > end) {
                throw new Error(
                    `Horario escolar no válido para Diversificado Matutina. Horario permitido: 07:00 a 12:05 hrs. Hora actual: ${currentTimeStr} hrs.`
                );
            }
        } else if (shift === 'VESPERTINA') {
            const start = 12 * 60 + 40; // 12:40 -> 760 mins
            const end = 17 * 60 + 40; // 17:40 -> 1060 mins

            if (totalMinutes < start || totalMinutes > end) {
                throw new Error(
                    `Horario escolar no válido para Diversificado Vespertina. Horario permitido: 12:40 a 17:40 hrs. Hora actual: ${currentTimeStr} hrs.`
                );
            }
        }
    }

    return true;
};
