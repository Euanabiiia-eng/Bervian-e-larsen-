import prisma from '../lib/prisma';
import logger from '../lib/logger';

interface EtapaDefinition {
  tipo: string;
  label: string;
  status: string;
  ordem: number;
  detalhe?: string;
}

const ETAPAS_BASE: EtapaDefinition[] = [
  { tipo: 'consulta', label: 'Consulta Inicial', status: 'done', ordem: 0 },
  { tipo: 'confirmacao', label: 'Confirmação da Cirurgia', status: 'done', ordem: 1 },
  { tipo: 'exames', label: 'Exames Pré-Operatórios', status: 'pending', ordem: 2 },
  { tipo: 'docs', label: 'Documentação', status: 'pending', ordem: 3 },
  { tipo: 'prep', label: 'Preparação para a Cirurgia', status: 'active', ordem: 4 },
  { tipo: 'internacao', label: 'Internação', status: 'pending', ordem: 5 },
  { tipo: 'cirurgia', label: 'Cirurgia', status: 'pending', ordem: 6 },
  { tipo: 'pos', label: 'Pós-Operatório', status: 'pending', ordem: 7 },
];

interface ChecklistDefinition {
  texto: string;
  janela: string;
  ordem: number;
}

const CHECKLIST_BASE: ChecklistDefinition[] = [
  { texto: 'Confirmar jejum completo (sólidos 8h, água até 4h antes)', janela: 'T72', ordem: 0 },
  { texto: 'Revisar todos os exames pré-operatórios com o médico', janela: 'T72', ordem: 1 },
  { texto: 'Separar toda a documentação (RG, CPF, exames)', janela: 'T24', ordem: 2 },
  { texto: 'Confirmar presença do acompanhante adulto', janela: 'T24', ordem: 3 },
  { texto: 'Realizar banho com sabonete antisséptico', janela: 'T2', ordem: 4 },
];

export async function gerarJornadaPaciente(
  pacienteId: string,
  procedimentoId: string,
): Promise<void> {
  try {
    const procedimento = await prisma.procedimento.findUnique({
      where: { id: procedimentoId },
    });

    if (!procedimento) {
      throw new Error(`Procedimento ${procedimentoId} não encontrado`);
    }

    // Delete existing journey data to allow re-generation
    await prisma.jornadaEtapa.deleteMany({ where: { pacienteId } });
    await prisma.documento.deleteMany({ where: { pacienteId } });
    await prisma.checklistItem.deleteMany({ where: { pacienteId } });

    // 1. Create 8 JornadaEtapa records
    await prisma.jornadaEtapa.createMany({
      data: ETAPAS_BASE.map((etapa) => ({
        pacienteId,
        tipo: etapa.tipo,
        label: etapa.label,
        status: etapa.status,
        ordem: etapa.ordem,
        detalhe: etapa.detalhe ?? null,
      })),
    });

    // 2. Create Documento records
    const documentos = [];

    if (procedimento.orientacoesPre) {
      documentos.push({
        pacienteId,
        tipo: 'orientacoes_pre',
        titulo: 'Orientações Pré-Operatórias',
        conteudo: procedimento.orientacoesPre,
        status: 'disponivel',
        liberadoEm: new Date(),
      });
    }

    if (procedimento.orientacoesPos) {
      documentos.push({
        pacienteId,
        tipo: 'orientacoes_pos',
        titulo: 'Orientações Pós-Operatórias',
        conteudo: procedimento.orientacoesPos,
        status: 'pendente',
        liberadoEm: null,
      });

      documentos.push({
        pacienteId,
        tipo: 'receita_pos',
        titulo: 'Receita Pós-Operatória',
        conteudo: 'Receita será disponibilizada após a cirurgia.',
        status: 'pendente',
        liberadoEm: null,
      });
    }

    if (documentos.length > 0) {
      await prisma.documento.createMany({ data: documentos });
    }

    // 3. Create ChecklistItem records from procedure materials
    const checklistItems: Array<{
      pacienteId: string;
      texto: string;
      janela: string;
      ordem: number;
    }> = [];

    // Add material items from procedure
    if (procedimento.materiais) {
      const materiais = procedimento.materiais
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      materiais.forEach((material, index) => {
        checklistItems.push({
          pacienteId,
          texto: `Preparar: ${material}`,
          janela: 'geral',
          ordem: index,
        });
      });
    }

    // Add base checklist items
    const baseOffset = checklistItems.length;
    CHECKLIST_BASE.forEach((item) => {
      checklistItems.push({
        pacienteId,
        texto: item.texto,
        janela: item.janela,
        ordem: baseOffset + item.ordem,
      });
    });

    if (checklistItems.length > 0) {
      await prisma.checklistItem.createMany({ data: checklistItems });
    }

    logger.info(
      `Jornada gerada para paciente ${pacienteId}: ${ETAPAS_BASE.length} etapas, ${documentos.length} documentos, ${checklistItems.length} itens de checklist`,
    );
  } catch (err) {
    logger.error(`Erro ao gerar jornada para paciente ${pacienteId}: ${err}`);
    throw err;
  }
}

export async function atualizarJornadaEtapa(
  etapaId: string,
  status: string,
  data?: string,
): Promise<void> {
  try {
    await prisma.jornadaEtapa.update({
      where: { id: etapaId },
      data: {
        status,
        ...(data !== undefined ? { data } : {}),
      },
    });
    logger.info(`Etapa ${etapaId} atualizada para status: ${status}`);
  } catch (err) {
    logger.error(`Erro ao atualizar etapa ${etapaId}: ${err}`);
    throw err;
  }
}
