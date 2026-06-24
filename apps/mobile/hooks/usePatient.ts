import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function usePatient() {
  const [paciente, setPaciente] = useState<any>(null)
  const [jornada, setJornada] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [mensagens, setMensagens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadPaciente = useCallback(async () => {
    try {
      const { data } = await api.get('/patient/me')
      setPaciente(data.data)
    } catch {}
  }, [])

  const loadJornada = useCallback(async () => {
    try {
      const { data } = await api.get('/patient/jornada')
      setJornada(data.data)
    } catch {}
  }, [])

  const loadDocumentos = useCallback(async () => {
    try {
      const { data } = await api.get('/patient/documentos')
      setDocumentos(data.data)
    } catch {}
  }, [])

  const loadVideos = useCallback(async () => {
    try {
      const { data } = await api.get('/patient/videos')
      setVideos(data.data)
    } catch {}
  }, [])

  const loadChecklist = useCallback(async () => {
    try {
      const { data } = await api.get('/patient/checklist')
      setChecklist(data.data)
    } catch {}
  }, [])

  const loadMensagens = useCallback(async () => {
    try {
      const { data } = await api.get('/patient/mensagens')
      setMensagens(data.data)
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([
      loadPaciente(),
      loadJornada(),
      loadDocumentos(),
      loadVideos(),
      loadChecklist(),
      loadMensagens(),
    ]).finally(() => setLoading(false))
  }, [])

  async function toggleChecklist(id: string, feito: boolean) {
    await api.patch(`/patient/checklist/${id}`, { feito })
    setChecklist((prev) => prev.map((c: any) => c.id === id ? { ...c, feito } : c))
  }

  async function sendMensagem(conteudo: string) {
    const { data } = await api.post('/patient/mensagens', { conteudo })
    setMensagens((prev) => {
      const updated = [...prev, data.data]
      if (data.aiMessage) updated.push(data.aiMessage)
      return updated
    })
    return data
  }

  return {
    paciente, jornada, documentos, videos, checklist, mensagens,
    loading, loadMensagens, toggleChecklist, sendMensagem,
    refetch: () => Promise.all([loadPaciente(), loadJornada()]),
  }
}
