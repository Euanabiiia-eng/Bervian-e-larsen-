// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  userId: string
  clinicId: string
  role: UserRole
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserPublic
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'staff' | 'patient'

export type PatientStatus = 'lead' | 'pre_op' | 'pos_op' | 'alta'

export type JornadaTipo =
  | 'consulta'
  | 'confirmacao'
  | 'exames'
  | 'docs'
  | 'prep'
  | 'internacao'
  | 'cirurgia'
  | 'pos'

export type JornadaStatus = 'done' | 'active' | 'pending'

export type DocumentoTipo =
  | 'consentimento'
  | 'anestesia'
  | 'receita_pre'
  | 'receita_pos'
  | 'orientacoes_pre'
  | 'orientacoes_pos'
  | 'internacao'
  | 'imagem'

export type DocumentoStatus = 'disponivel' | 'pendente' | 'assinado'

export type MensagemRemetente = 'patient' | 'clinic' | 'ai'

export type MensagemTipo = 'auto' | 'aprovado' | 'manual'

export type SentimentoLabel = 'positivo' | 'neutro' | 'negativo' | 'risco'

export type LeadEstagio = 'lead' | 'consulta' | 'proposta' | 'fechamento'

export type CirurgiaStatus = 'agendada' | 'realizada' | 'cancelada'

export type ProcedimentoCategoria = 'Facial' | 'Corporal' | 'Mamário' | 'Minimamente Invasivo'

export type HospitalTipo = 'Hospital' | 'Day Hospital' | 'Centro Cirúrgico'

export type ClinicaPlano = 'starter' | 'pro' | 'enterprise'

export type ChecklistJanela = 'T72' | 'T24' | 'T2' | 'geral'

// ─── Models ──────────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string
  nome: string
  email: string
  role: UserRole
  telefone?: string | null
  clinicId: string
  ativo: boolean
}

export interface ClinicPublic {
  id: string
  nome: string
  slug: string
  logoUrl?: string | null
  corPrimaria: string
  corSecundaria: string
  plano: ClinicaPlano
}

export interface Hospital {
  id: string
  clinicId: string
  nome: string
  tipo: HospitalTipo
  endereco?: string | null
  cidade?: string | null
  telefone?: string | null
  contato?: string | null
  obs?: string | null
  ativo: boolean
  createdAt: string
}

export interface Medico {
  id: string
  clinicId: string
  userId: string
  crm: string
  especialidade: string
  formacao?: string | null
  bio?: string | null
  agenda?: string | null
  ativo: boolean
  user: UserPublic
}

export interface ProcedimentoVideo {
  id: string
  procedimentoId: string
  titulo: string
  url?: string | null
  duracao?: string | null
  descricao?: string | null
  ordem: number
  ativo: boolean
}

export interface Procedimento {
  id: string
  clinicId: string
  hospitalId?: string | null
  nome: string
  categoria: ProcedimentoCategoria
  duracaoMin: number
  anestesia: string
  valorBase: number
  internacao: string
  recuperacaoDias: number
  descricao?: string | null
  lembrete?: string | null
  orientacoesPre?: string | null
  orientacoesPos?: string | null
  materiais?: string | null
  complementares?: string | null
  ativo: boolean
  hospital?: Hospital | null
  videos: ProcedimentoVideo[]
}

export interface Paciente {
  id: string
  clinicId: string
  userId: string
  procedimentoId?: string | null
  medicoId?: string | null
  status: PatientStatus
  dataCirurgia?: string | null
  horaCirurgia?: string | null
  valor?: number | null
  scoreEngajamento: number
  ultimoAcessoApp?: string | null
  user: UserPublic
  procedimento?: Procedimento | null
  medico?: Medico | null
}

export interface JornadaEtapa {
  id: string
  pacienteId: string
  tipo: JornadaTipo
  label: string
  data?: string | null
  status: JornadaStatus
  detalhe?: string | null
  ordem: number
}

export interface Documento {
  id: string
  pacienteId: string
  tipo: DocumentoTipo
  titulo: string
  conteudo?: string | null
  urlArquivo?: string | null
  status: DocumentoStatus
  liberadoEm?: string | null
  createdAt: string
}

export interface ChecklistItem {
  id: string
  pacienteId: string
  texto: string
  feito: boolean
  janela: ChecklistJanela
  ordem: number
}

export interface Mensagem {
  id: string
  pacienteId: string
  clinicId: string
  remetente: MensagemRemetente
  conteudo: string
  tipo: MensagemTipo
  pendienteAprovacao: boolean
  sugestaoIA?: string | null
  aprovadoPorId?: string | null
  sentimentoScore?: number | null
  sentimentoLabel?: SentimentoLabel | null
  createdAt: string
  paciente?: Pick<Paciente, 'id' | 'user'>
}

export interface Lead {
  id: string
  clinicId: string
  procedimentoId?: string | null
  medicoId?: string | null
  nome: string
  telefone?: string | null
  email?: string | null
  valorEstimado?: number | null
  estagio: LeadEstagio
  ultimoContato?: string | null
  obs?: string | null
  createdAt: string
  procedimento?: Pick<Procedimento, 'id' | 'nome'> | null
  medico?: Pick<Medico, 'id' | 'user'> | null
}

export interface Cirurgia {
  id: string
  clinicId: string
  pacienteId: string
  procedimentoId: string
  medicoId: string
  hospitalId: string
  data: string
  horaInicio?: string | null
  duracaoMin?: number | null
  valor?: number | null
  status: CirurgiaStatus
  obs?: string | null
  statusPosOp?: string | null
  paciente: Pick<Paciente, 'id' | 'user'>
  procedimento: Pick<Procedimento, 'id' | 'nome'>
  medico: Pick<Medico, 'id' | 'user'>
  hospital: Pick<Hospital, 'id' | 'nome'>
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface DashboardKpis {
  atendimentos: number
  atendimentosVar: number
  leadsAbertos: number
  leadsVar: number
  leadsFechamento: { count: number; valor: number }
  cirurgiasAgendadas: number
  cirurgiasVar: number
  receita: number
  receitaVar: number
  ticketMedio: number
  taxaConversao: number
  npsScore: number
}

export interface DashboardCharts {
  cirurgiasMes: Array<{ mes: string; total: number }>
  receitaMes: Array<{ mes: string; total: number }>
}

export interface DashboardData {
  kpis: DashboardKpis
  charts: DashboardCharts
  proximasCirurgias: Cirurgia[]
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
