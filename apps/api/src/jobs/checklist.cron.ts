import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { jornadaService } from '../services/jornada.service'
import { logger } from '../lib/logger'

function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60)
}

async function processarAutomacoes() {
  const now = new Date()

  const pacientes = await prisma.paciente.findMany({
    where: {
      status: { in: ['pre_op'] },
      dataCirurgia: { not: null },
    },
    include: {
      user: true,
      clinic: true,
      procedimento: true,
    },
  })

  for (const paciente of pacientes) {
    if (!paciente.dataCirurgia) continue

    const horasAteCircurgia = msToHours(paciente.dataCirurgia.getTime() - now.getTime())

    // T-72h: 3 days before surgery
    if (horasAteCircurgia > 71 && horasAteCircurgia <= 73) {
      logger.info(`[CRON] T-72h → Paciente ${paciente.user.nome}`)
      await prisma.mensagem.create({
        data: {
          pacienteId: paciente.id,
          clinicId: paciente.clinicId,
          remetente: 'clinic',
          conteudo: `Olá, ${paciente.user.nome}! 🌿 Sua cirurgia está se aproximando — faltam 3 dias. Confira o checklist no aplicativo e certifique-se de que todos os materiais estão prontos. Qualquer dúvida, estamos aqui.`,
          tipo: 'auto',
          pendienteAprovacao: false,
        },
      })
    }

    // T-24h: 1 day before surgery
    if (horasAteCircurgia > 23 && horasAteCircurgia <= 25) {
      logger.info(`[CRON] T-24h → Paciente ${paciente.user.nome}`)
      await prisma.mensagem.create({
        data: {
          pacienteId: paciente.id,
          clinicId: paciente.clinicId,
          remetente: 'clinic',
          conteudo: `${paciente.user.nome}, amanhã é o grande dia! 🌿 Lembre-se: jejum completo a partir das 23h. Entrada no hospital às ${paciente.horaCirurgia ?? '07:30'}h. Descanse bem hoje. Nossa equipe estará com você.`,
          tipo: 'auto',
          pendienteAprovacao: false,
        },
      })
    }

    // T-2h: 2 hours before surgery
    if (horasAteCircurgia > 1.5 && horasAteCircurgia <= 2.5) {
      logger.info(`[CRON] T-2h → Paciente ${paciente.user.nome}`)

      const openItems = await prisma.checklistItem.count({
        where: { pacienteId: paciente.id, feito: false, janela: { in: ['T2', 'T24', 'T72'] } },
      })

      if (openItems > 0) {
        logger.warn(`[CRON] ${openItems} itens em aberto para ${paciente.user.nome}`)
        await prisma.mensagem.create({
          data: {
            pacienteId: paciente.id,
            clinicId: paciente.clinicId,
            remetente: 'clinic',
            conteudo: `Atenção: existem ${openItems} item(s) pendente(s) no seu checklist. Verifique o aplicativo agora para garantir que tudo está pronto para sua cirurgia. 🌿`,
            tipo: 'auto',
            pendienteAprovacao: false,
          },
        })
      }
    }
  }
}

async function liberarDocumentosPosAlta() {
  const now = new Date()
  const umDiaAtras = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const cirurgiasRealizadas = await prisma.cirurgia.findMany({
    where: {
      status: 'realizada',
      data: { gte: umDiaAtras, lte: now },
    },
    include: { paciente: true },
  })

  for (const cirurgia of cirurgiasRealizadas) {
    try {
      await jornadaService.liberarDocumentosPosAlta(cirurgia.pacienteId)
      logger.info(`[CRON] Documentos pós-alta liberados para paciente ${cirurgia.pacienteId}`)
    } catch (err) {
      logger.error('[CRON] Erro ao liberar documentos', { error: err, pacienteId: cirurgia.pacienteId })
    }
  }
}

export function startCronJobs() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('[CRON] Executando automações de jornada...')
    try {
      await processarAutomacoes()
      await liberarDocumentosPosAlta()
    } catch (err) {
      logger.error('[CRON] Erro nas automações', { error: err })
    }
  })

  logger.info('✓ Cron jobs iniciados')
}
