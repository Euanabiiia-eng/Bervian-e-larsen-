import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

export const jornadaService = {
  async gerarJornadaPaciente(pacienteId: string, procedimentoId: string): Promise<void> {
    const proc = await prisma.procedimento.findUnique({
      where: { id: procedimentoId },
      include: { hospital: true },
    })

    if (!proc) throw new Error('Procedimento não encontrado')

    // Generate journey steps
    const etapas = [
      { tipo: 'consulta', label: 'Consulta realizada', status: 'done', ordem: 1, detalhe: 'Consulta de avaliação realizada com sucesso.' },
      { tipo: 'confirmacao', label: 'Procedimento confirmado', status: 'done', ordem: 2, detalhe: 'Procedimento confirmado e data cirúrgica reservada.' },
      { tipo: 'exames', label: 'Exames pré-operatórios', status: 'pending', ordem: 3, detalhe: 'Realize todos os exames solicitados e entregue na clínica.' },
      { tipo: 'docs', label: 'Documentos assinados', status: 'pending', ordem: 4, detalhe: 'Assine os termos de consentimento.' },
      { tipo: 'prep', label: 'Preparação pré-cirúrgica', status: 'pending', ordem: 5, detalhe: 'Siga as orientações pré-operatórias e o checklist.' },
      { tipo: 'internacao', label: 'Internação', status: 'pending', ordem: 6, detalhe: proc.hospital ? `${proc.hospital.nome} — ${proc.hospital.endereco ?? ''}` : 'Hospital a confirmar.' },
      { tipo: 'cirurgia', label: `${proc.nome}`, status: 'pending', ordem: 7, detalhe: `Procedimento: ${proc.nome}. Anestesia: ${proc.anestesia}. Duração estimada: ${Math.round(proc.duracaoMin / 60)}h${proc.duracaoMin % 60 > 0 ? `${proc.duracaoMin % 60}min` : ''}.` },
      { tipo: 'pos', label: 'Pós-operatório', status: 'pending', ordem: 8, detalhe: `Recuperação estimada: ${proc.recuperacaoDias} dias. Acompanhamento com retornos programados.` },
    ]

    await prisma.jornadaEtapa.deleteMany({ where: { pacienteId } })
    await prisma.jornadaEtapa.createMany({
      data: etapas.map((e) => ({ pacienteId, ...e })),
    })

    // Generate documents
    const documentos = [
      {
        tipo: 'consentimento',
        titulo: `Termo de Consentimento — ${proc.nome}`,
        status: 'pendente',
        conteudo: `Termo de consentimento para o procedimento de ${proc.nome}. Assine após leitura completa.`,
      },
      {
        tipo: 'anestesia',
        titulo: `Termo de Anestesia — ${proc.anestesia}`,
        status: 'pendente',
        conteudo: `Termo de consentimento para anestesia ${proc.anestesia}.`,
      },
      {
        tipo: 'orientacoes_pre',
        titulo: 'Orientações Pré-Operatórias',
        status: 'disponivel',
        conteudo: proc.orientacoesPre ?? 'Orientações serão disponibilizadas em breve.',
      },
      {
        tipo: 'orientacoes_pos',
        titulo: 'Orientações Pós-Operatórias',
        status: 'pendente',
        conteudo: proc.orientacoesPos ?? null,
      },
      {
        tipo: 'receita_pre',
        titulo: 'Receita Pré-Cirúrgica',
        status: 'disponivel',
        conteudo: 'Receita médica pré-operatória. Disponível para download.',
      },
      {
        tipo: 'receita_pos',
        titulo: 'Receita Pós-Operatória',
        status: 'pendente',
        conteudo: null,
      },
      {
        tipo: 'internacao',
        titulo: 'Confirmação de Internação',
        status: 'disponivel',
        conteudo: proc.hospital
          ? `Hospital: ${proc.hospital.nome}\nEndereço: ${proc.hospital.endereco ?? ''}\nCidade: ${proc.hospital.cidade ?? ''}\nTelefone: ${proc.hospital.telefone ?? ''}\nLocal: ${proc.hospital.contato ?? ''}`
          : 'Local de internação a confirmar.',
      },
    ]

    await prisma.documento.deleteMany({ where: { pacienteId } })
    await prisma.documento.createMany({
      data: documentos.map((d) => ({ pacienteId, ...d })),
    })

    // Generate checklist from procedure materials
    const materiais = proc.materiais?.split('\n').filter((m) => m.trim()) ?? []
    const checklistBase = [
      { texto: 'Exames pré-operatórios entregues à clínica', janela: 'T72', ordem: 1 },
      { texto: 'Jejum programado conforme orientação', janela: 'T72', ordem: 2 },
      ...materiais.map((m, i) => ({ texto: m.trim(), janela: 'T72', ordem: 3 + i })),
      { texto: 'Documentação completa (RG/CPF + exames)', janela: 'T24', ordem: 100 },
      { texto: 'Acompanhante confirmado', janela: 'T24', ordem: 101 },
      { texto: 'Suspensão de AAS e anti-inflamatórios confirmada', janela: 'T24', ordem: 102 },
      { texto: 'Banho com sabonete antisséptico (Clorexidina 2%)', janela: 'T2', ordem: 200 },
      { texto: 'Roupas confortáveis e folgadas separadas', janela: 'T2', ordem: 201 },
      { texto: 'Sem maquiagem, esmalte ou acessórios', janela: 'T2', ordem: 202 },
    ]

    await prisma.checklistItem.deleteMany({ where: { pacienteId } })
    await prisma.checklistItem.createMany({
      data: checklistBase.map((c) => ({ pacienteId, ...c })),
    })

    logger.info('Jornada gerada com sucesso', { pacienteId, procedimentoId })
  },

  async liberarDocumentosPosAlta(pacienteId: string): Promise<void> {
    await prisma.documento.updateMany({
      where: { pacienteId, status: 'pendente' },
      data: { status: 'disponivel', liberadoEm: new Date() },
    })

    await prisma.paciente.update({
      where: { id: pacienteId },
      data: { status: 'pos_op' },
    })

    logger.info('Documentos pós-alta liberados', { pacienteId })
  },
}
