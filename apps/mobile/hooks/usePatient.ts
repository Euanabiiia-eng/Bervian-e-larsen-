import { useState, useEffect, useCallback } from 'react';
import api from '../constants/api';
import type {
  Paciente,
  JornadaEtapa,
  Documento,
  ProcedimentoVideo,
  ChecklistItem,
  Mensagem,
} from '@apice/types';

interface UsePatientReturn {
  paciente: Paciente | null;
  jornada: JornadaEtapa[];
  documentos: Documento[];
  videos: ProcedimentoVideo[];
  checklist: ChecklistItem[];
  mensagens: Mensagem[];
  isLoading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  toggleChecklist: (id: string) => Promise<void>;
  updateJornada: (id: string, status: string) => Promise<void>;
  sendMensagem: (text: string) => Promise<{
    patientMessage: Mensagem;
    aiMessage: Mensagem;
    pendienteAprovacao: boolean;
  }>;
}

export function usePatient(): UsePatientReturn {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [jornada, setJornada] = useState<JornadaEtapa[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [videos, setVideos] = useState<ProcedimentoVideo[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        pacienteRes,
        jornadaRes,
        documentosRes,
        videosRes,
        checklistRes,
        mensagensRes,
      ] = await Promise.all([
        api.get('/patient/me'),
        api.get('/patient/jornada'),
        api.get('/patient/documentos'),
        api.get('/patient/videos'),
        api.get('/patient/checklist'),
        api.get('/patient/mensagens'),
      ]);

      setPaciente(pacienteRes.data.data as Paciente);
      setJornada(jornadaRes.data.data as JornadaEtapa[]);
      setDocumentos(documentosRes.data.data as Documento[]);
      setVideos(videosRes.data.data as ProcedimentoVideo[]);
      setChecklist(checklistRes.data.data as ChecklistItem[]);
      setMensagens(mensagensRes.data.data as Mensagem[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleChecklist = useCallback(async (id: string) => {
    try {
      const response = await api.patch(`/patient/checklist/${id}`);
      const updated = response.data.data as ChecklistItem;
      setChecklist((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar checklist';
      setError(message);
    }
  }, []);

  const updateJornada = useCallback(async (id: string, status: string) => {
    try {
      const response = await api.patch(`/patient/jornada/${id}`, { status });
      const updated = response.data.data as JornadaEtapa;
      setJornada((prev) =>
        prev.map((etapa) => (etapa.id === id ? updated : etapa)),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar jornada';
      setError(message);
    }
  }, []);

  const sendMensagem = useCallback(async (text: string) => {
    const response = await api.post('/patient/mensagens', { mensagem: text });
    const result = response.data.data as {
      patientMessage: Mensagem;
      aiMessage: Mensagem;
      pendienteAprovacao: boolean;
    };

    setMensagens((prev) => [
      ...prev,
      result.patientMessage,
      result.aiMessage,
    ]);

    return result;
  }, []);

  return {
    paciente,
    jornada,
    documentos,
    videos,
    checklist,
    mensagens,
    isLoading,
    error,
    refreshAll: fetchAll,
    toggleChecklist,
    updateJornada,
    sendMensagem,
  };
}

export default usePatient;
