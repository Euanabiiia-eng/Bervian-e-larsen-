import prisma from '../lib/prisma';
import logger from '../lib/logger';

export async function liberarDocumentosPosAlta(pacienteId: string): Promise<void> {
  try {
    const result = await prisma.documento.updateMany({
      where: {
        pacienteId,
        tipo: { in: ['receita_pos', 'orientacoes_pos'] },
        status: 'pendente',
      },
      data: {
        status: 'disponivel',
        liberadoEm: new Date(),
      },
    });

    logger.info(
      `Documentos pós-alta liberados para paciente ${pacienteId}: ${result.count} documento(s) atualizado(s)`,
    );
  } catch (err) {
    logger.error(`Erro ao liberar documentos pós-alta para paciente ${pacienteId}: ${err}`);
    throw err;
  }
}
