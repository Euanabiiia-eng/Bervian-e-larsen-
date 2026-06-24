import Anthropic from '@anthropic-ai/sdk';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SENSITIVE_KEYWORDS = [
  'cancelar',
  'reagendar',
  'preço',
  'preco',
  'complicação',
  'complicacao',
  'reembolso',
  'advogado',
];

function containsSensitiveKeyword(mensagem: string): boolean {
  const lower = mensagem.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function findQuickAnswer(
  mensagem: string,
  procedimentoId: string,
): Promise<string | null> {
  try {
    const respostas = await prisma.respostaIA.findMany({
      where: { procedimentoId, ativo: true },
    });

    const lower = mensagem.toLowerCase();

    for (const resposta of respostas) {
      const palavras = resposta.palavrasChave.split(',').map((p) => p.trim().toLowerCase());
      const matched = palavras.some((palavra) => lower.includes(palavra));
      if (matched) {
        return resposta.resposta;
      }
    }

    return null;
  } catch (err) {
    logger.error(`Erro ao buscar resposta rápida: ${err}`);
    return null;
  }
}

export async function getAIResponse(params: {
  mensagem: string;
  pacienteNome: string;
  clinicNome: string;
  medicoNome: string;
  procedimentoNome: string;
  dataCirurgia: string;
  hospitalNome: string;
  hospitalEndereco: string;
  orientacoesPre: string;
}): Promise<string> {
  const systemPrompt = `Você é a assistente virtual da ${params.clinicNome}, uma clínica premium de cirurgia plástica. Você auxilia pacientes com dúvidas pré-operatórias de forma calorosa e profissional.

Informações do paciente:
- Nome: ${params.pacienteNome}
- Médico responsável: ${params.medicoNome}
- Procedimento: ${params.procedimentoNome}
- Data da cirurgia: ${params.dataCirurgia}
- Hospital: ${params.hospitalNome}
- Endereço do hospital: ${params.hospitalEndereco}

Orientações pré-operatórias do procedimento:
${params.orientacoesPre}

Instruções importantes:
- Responda em 2-3 frases de forma calorosa e profissional
- Use 🌿 ocasionalmente para um toque especial
- NUNCA invente informações médicas específicas que não foram fornecidas
- Baseie suas respostas apenas nas orientações fornecidas acima
- Se não souber a resposta, oriente o paciente a entrar em contato diretamente com a clínica
- Trate o paciente pelo primeiro nome quando possível`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: params.mensagem,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  return 'Obrigada pelo contato! Nossa equipe está disponível para esclarecer todas as suas dúvidas. 🌿';
}

export async function analyzeSentiment(
  mensagem: string,
): Promise<{ score: number; label: 'positivo' | 'neutro' | 'negativo' | 'risco' }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      system: `Você é um analisador de sentimentos. Analise a mensagem e retorne APENAS um JSON com:
- score: número de -1.0 (muito negativo) a 1.0 (muito positivo)
- label: "positivo", "neutro", "negativo" ou "risco" (risco = mensagem indica urgência, medo intenso ou situação crítica)
Exemplo: {"score": 0.8, "label": "positivo"}
Retorne SOMENTE o JSON, sem mais nada.`,
      messages: [{ role: 'user', content: mensagem }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text.trim()) as {
        score: number;
        label: 'positivo' | 'neutro' | 'negativo' | 'risco';
      };
      return parsed;
    }
  } catch (err) {
    logger.error(`Erro na análise de sentimento: ${err}`);
  }

  return { score: 0, label: 'neutro' };
}

export async function handlePatientMessage(params: {
  mensagem: string;
  pacienteId: string;
  clinicId: string;
}): Promise<{
  conteudo: string;
  pendienteAprovacao: boolean;
  sugestaoIA?: string;
  tipo: string;
}> {
  const { mensagem, pacienteId } = params;

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    include: {
      user: true,
      procedimento: {
        include: {
          hospital: true,
          respostasIA: { where: { ativo: true } },
        },
      },
      medico: { include: { user: true } },
      clinic: true,
    },
  });

  if (!paciente) {
    throw new Error('Paciente não encontrado');
  }

  const needsApproval = containsSensitiveKeyword(mensagem);
  const procedimentoId = paciente.procedimentoId ?? '';

  // Layer 1: check pre-configured answers
  if (!needsApproval && procedimentoId) {
    const quickAnswer = await findQuickAnswer(mensagem, procedimentoId);
    if (quickAnswer) {
      return {
        conteudo: quickAnswer,
        pendienteAprovacao: false,
        tipo: 'auto',
      };
    }
  }

  // Layer 2: get full AI response
  const dataCirurgia = paciente.dataCirurgia
    ? new Date(paciente.dataCirurgia).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Data a confirmar';

  const aiResponse = await getAIResponse({
    mensagem,
    pacienteNome: paciente.user.nome.split(' ')[0],
    clinicNome: paciente.clinic.nome,
    medicoNome: paciente.medico?.user.nome ?? 'seu médico',
    procedimentoNome: paciente.procedimento?.nome ?? 'seu procedimento',
    dataCirurgia,
    hospitalNome: paciente.procedimento?.hospital?.nome ?? 'o hospital',
    hospitalEndereco: paciente.procedimento?.hospital?.endereco ?? '',
    orientacoesPre: paciente.procedimento?.orientacoesPre ?? '',
  });

  if (needsApproval) {
    return {
      conteudo:
        'Sua mensagem foi recebida e será respondida em breve por nossa equipe. 🌿',
      pendienteAprovacao: true,
      sugestaoIA: aiResponse,
      tipo: 'pendente',
    };
  }

  return {
    conteudo: aiResponse,
    pendienteAprovacao: false,
    tipo: 'auto',
  };
}
