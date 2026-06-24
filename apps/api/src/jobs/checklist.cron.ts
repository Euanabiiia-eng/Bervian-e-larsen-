import cron from 'node-cron';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { notifyPatient, notifyClinicStaff } from '../services/notification.service';
import { liberarDocumentosPosAlta } from '../services/document.service';

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function subHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

function subDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

async function runCronLogic(): Promise<void> {
  const now = new Date();

  try {
    // T-72h: surgeries 72±1h away
    const t72Start = addHours(now, 71);
    const t72End = addHours(now, 73);

    const t72Surgeries = await prisma.paciente.findMany({
      where: {
        dataCirurgia: { gte: t72Start, lte: t72End },
        status: 'pre_op',
      },
      include: { clinic: true },
    });

    for (const paciente of t72Surgeries) {
      await notifyPatient(
        paciente.id,
        'Sua cirurgia se aproxima! 🌿',
        'Faltam 72 horas para sua cirurgia. Lembre-se de iniciar o jejum e revisar seu checklist.',
      );
      await notifyClinicStaff(
        paciente.clinicId,
        'Paciente: T-72h',
        `O paciente ${paciente.id} tem cirurgia em 72 horas. Verificar checklist.`,
      );
      logger.info(`T-72h: notificação enviada para paciente ${paciente.id}`);
    }

    // T-24h: surgeries 24±1h away
    const t24Start = addHours(now, 23);
    const t24End = addHours(now, 25);

    const t24Surgeries = await prisma.paciente.findMany({
      where: {
        dataCirurgia: { gte: t24Start, lte: t24End },
        status: 'pre_op',
      },
      include: { clinic: true },
    });

    for (const paciente of t24Surgeries) {
      await notifyPatient(
        paciente.id,
        'Amanhã é o grande dia! 🌿',
        'Faltam 24 horas para sua cirurgia. Confirme seu horário e lembre-se do jejum.',
      );
      await notifyClinicStaff(
        paciente.clinicId,
        'Paciente: T-24h',
        `O paciente ${paciente.id} tem cirurgia em 24 horas.`,
      );
      logger.info(`T-24h: notificação enviada para paciente ${paciente.id}`);
    }

    // T-2h: surgeries 2±0.5h away
    const t2Start = addHours(now, 1.5);
    const t2End = addHours(now, 2.5);

    const t2Surgeries = await prisma.paciente.findMany({
      where: {
        dataCirurgia: { gte: t2Start, lte: t2End },
        status: 'pre_op',
      },
      include: { clinic: true },
    });

    for (const paciente of t2Surgeries) {
      await notifyClinicStaff(
        paciente.clinicId,
        'Checklist Final: T-2h',
        `Paciente ${paciente.id} chega em aproximadamente 2 horas. Realizar checklist final.`,
      );
      logger.info(`T-2h: notificação de staff para paciente ${paciente.id}`);
    }

    // D+1: surgeries that happened ~24h ago with status=realizada
    const d1Start = subHours(now, 25);
    const d1End = subHours(now, 23);

    const d1Surgeries = await prisma.paciente.findMany({
      where: {
        dataCirurgia: { gte: d1Start, lte: d1End },
        status: 'pre_op',
      },
    });

    for (const paciente of d1Surgeries) {
      const cirurgia = await prisma.cirurgia.findFirst({
        where: {
          pacienteId: paciente.id,
          status: 'realizada',
          data: { gte: d1Start, lte: d1End },
        },
      });

      if (cirurgia) {
        await liberarDocumentosPosAlta(paciente.id);
        await prisma.paciente.update({
          where: { id: paciente.id },
          data: { status: 'pos_op' },
        });
        logger.info(`D+1: documentos liberados e status atualizado para paciente ${paciente.id}`);
      }
    }

    // D+14: surgeries 14 days ago
    const d14Start = subDays(now, 15);
    const d14End = subDays(now, 13);

    const d14Surgeries = await prisma.paciente.findMany({
      where: {
        dataCirurgia: { gte: d14Start, lte: d14End },
        status: 'pos_op',
      },
    });

    for (const paciente of d14Surgeries) {
      logger.info(
        `D+14: NPS trigger para paciente ${paciente.id} — enviar pesquisa de satisfação`,
      );
    }
  } catch (err) {
    logger.error(`Erro no job de checklist: ${err}`);
  }
}

export function startCronJobs(): void {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Executando job de checklist/cronograma...');
    await runCronLogic();
  });

  logger.info('Cron jobs iniciados');
}
