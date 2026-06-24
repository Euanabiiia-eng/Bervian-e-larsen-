import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type RespostaIA = { palavrasChave: string; resposta: string }

type PacienteWithRelations = {
  id: string
  clinicId: string
  dataCirurgia?: Date | null
  horaCirurgia?: string | null
  user: { nome: string }
  clinic: { nome: string }
  procedimento?: {
    nome: string
    orientacoesPre?: string | null
    hospital?: { nome: string; endereco?: string | null } | null
    respostasIA?: RespostaIA[]
  } | null
  medico?: { user: { nome: string }; crm: string } | null
}

export const aiService = {
  findQuickAnswer(conteudo: string, respostas: RespostaIA[]): string | null {
    const lower = conteudo.toLowerCase()
    for (const r of respostas) {
      const keywords = r.palavrasChave.split(',').map((k) => k.trim().toLowerCase())
      if (keywords.some((kw) => lower.includes(kw))) {
        return r.resposta
      }
    }
    return null
  },

  async getAIResponse(mensagem: string, paciente: PacienteWithRelations): Promise<string> {
    const cirurgiaStr = paciente.dataCirurgia
      ? new Date(paciente.dataCirurgia).toLocaleDateString('pt-BR')
      : 'data a confirmar'

    const systemPrompt = `Você é a assistente virtual da ${paciente.clinic.nome}, clínica de cirurgia plástica premium.
Médico responsável: ${paciente.medico?.user.nome ?? 'Dr. Responsável'} (${paciente.medico?.crm ?? ''}).
Paciente: ${paciente.user.nome}.
Procedimento: ${paciente.procedimento?.nome ?? 'cirurgia'} agendada para ${cirurgiaStr}.
Hospital: ${paciente.procedimento?.hospital?.nome ?? 'hospital a confirmar'} — ${paciente.procedimento?.hospital?.endereco ?? ''}.
Orientações pré-operatórias relevantes:
${paciente.procedimento?.orientacoesPre?.slice(0, 800) ?? 'Conforme orientação médica.'}

Regras obrigatórias:
- Responda em 2-3 frases curtas, calorosa e profissionalmente.
- Use 🌿 ocasionalmente (1 por mensagem máximo).
- NUNCA invente informações médicas específicas que não foram fornecidas.
- Se não souber a resposta, diga que a equipe médica entrará em contato.
- Escreva em português do Brasil.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: mensagem }],
    })

    const text = response.content[0]
    if (text.type !== 'text') throw new Error('Unexpected response type from Anthropic')
    return text.text
  },

  async analyzeSentiment(
    mensagem: string,
    pacienteId: string,
    clinicId: string
  ): Promise<void> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 100,
        system: `Classifique o sentimento desta mensagem de paciente de clínica de cirurgia plástica.
Responda APENAS com um JSON no formato: {"score": 0.0-1.0, "label": "positivo|neutro|negativo|risco"}
"risco" = sinais claros de desistência, cancelamento iminente ou insatisfação grave.
Sem explicações.`,
        messages: [{ role: 'user', content: mensagem }],
      })

      const text = response.content[0]
      if (text.type !== 'text') return

      let parsed: { score: number; label: string }
      try {
        parsed = JSON.parse(text.text.trim())
      } catch {
        return
      }

      // Update the last patient message with sentiment
      const lastMsg = await prisma.mensagem.findFirst({
        where: { pacienteId, remetente: 'patient' },
        orderBy: { createdAt: 'desc' },
      })

      if (lastMsg) {
        await prisma.mensagem.update({
          where: { id: lastMsg.id },
          data: {
            sentimentoScore: parsed.score,
            sentimentoLabel: parsed.label,
          },
        })
      }

      // Update patient engagement score
      const scoreMap: Record<string, number> = { positivo: 10, neutro: 0, negativo: -5, risco: -20 }
      const delta = scoreMap[parsed.label] ?? 0

      await prisma.paciente.update({
        where: { id: pacienteId },
        data: {
          scoreEngajamento: {
            increment: delta,
          },
        },
      })

      // Alert if risk
      if (parsed.label === 'risco') {
        logger.warn('⚠️ RISCO detectado para paciente', { pacienteId, clinicId, mensagem })
      }
    } catch (err) {
      logger.error('Sentiment analysis error', { error: err })
    }
  },
}
