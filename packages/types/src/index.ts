// ─── Clinic ──────────────────────────────────────────────────────────────────
export interface Clinic {
  id: string;
  nome: string;
  slug: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  plano: 'starter' | 'pro' | 'enterprise';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'staff' | 'patient';

export interface User {
  id: string;
  clinicId: string;
  nome: string;
  email: string;
  role: UserRole;
  telefone?: string;
  ativo: boolean;
  ultimoAcesso?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Medico ──────────────────────────────────────────────────────────────────
export interface Medico {
  id: string;
  clinicId: string;
  userId: string;
  user: User;
  crm: string;
  especialidade: string;
  formacao?: string;
  bio?: string;
  agenda?: string;
  ativo: boolean;
}

// ─── Hospital ────────────────────────────────────────────────────────────────
export type HospitalTipo = 'Hospital' | 'Day Hospital' | 'Centro Cirúrgico';

export interface Hospital {
  id: string;
  clinicId: string;
  nome: string;
  tipo: HospitalTipo;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  contato?: string;
  obs?: string;
  ativo: boolean;
}

// ─── Procedimento ────────────────────────────────────────────────────────────
export type ProcedimentoCategoria = 'Facial' | 'Corporal' | 'Mamário' | 'Minimamente Invasivo';

export interface ProcedimentoVideo {
  id: string;
  procedimentoId: string;
  titulo: string;
  url?: string;
  duracao?: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

export interface RespostaIA {
  id: string;
  procedimentoId: string;
  palavrasChave: string;
  resposta: string;
  ativo: boolean;
}

export interface Procedimento {
  id: string;
  clinicId: string;
  hospitalId?: string;
  hospital?: Hospital;
  nome: string;
  categoria: ProcedimentoCategoria;
  duracaoMin: number;
  anestesia: string;
  valorBase: number;
  internacao: string;
  recuperacaoDias: number;
  descricao?: string;
  lembrete?: string;
  orientacoesPre?: string;
  orientacoesPos?: string;
  materiais?: string;
  complementares?: string;
  ativo: boolean;
  videos: ProcedimentoVideo[];
  respostasIA?: RespostaIA[];
}

// ─── Paciente ────────────────────────────────────────────────────────────────
export type PacienteStatus = 'lead' | 'pre_op' | 'pos_op' | 'alta';

export interface JornadaEtapa {
  id: string;
  pacienteId: string;
  tipo: string;
  label: string;
  data?: string;
  status: 'done' | 'active' | 'pending';
  detalhe?: string;
  ordem: number;
}

export interface Documento {
  id: string;
  pacienteId: string;
  tipo: string;
  titulo: string;
  conteudo?: string;
  urlArquivo?: string;
  status: 'disponivel' | 'pendente' | 'assinado';
  liberadoEm?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  pacienteId: string;
  texto: string;
  feito: boolean;
  janela: 'T72' | 'T24' | 'T2' | 'geral';
  ordem: number;
}

export interface Paciente {
  id: string;
  clinicId: string;
  userId: string;
  user: User;
  procedimentoId?: string;
  procedimento?: Procedimento;
  medicoId?: string;
  medico?: Medico;
  status: PacienteStatus;
  dataCirurgia?: string;
  horaCirurgia?: string;
  valor?: number;
  scoreEngajamento: number;
  ultimoAcessoApp?: string;
  jornada?: JornadaEtapa[];
  documentos?: Documento[];
  checklist?: ChecklistItem[];
}

// ─── Mensagem ────────────────────────────────────────────────────────────────
export type MensagemRemetente = 'patient' | 'clinic' | 'ai';
export type MensagemTipo = 'auto' | 'aprovado' | 'manual';
export type SentimentoLabel = 'positivo' | 'neutro' | 'negativo' | 'risco';

export interface Mensagem {
  id: string;
  pacienteId: string;
  clinicId: string;
  remetente: MensagemRemetente;
  conteudo: string;
  tipo: MensagemTipo;
  pendienteAprovacao: boolean;
  sugestaoIA?: string;
  aprovadoPorId?: string;
  sentimentoScore?: number;
  sentimentoLabel?: SentimentoLabel;
  createdAt: string;
}

// ─── Lead ────────────────────────────────────────────────────────────────────
export type LeadEstagio = 'lead' | 'consulta' | 'proposta' | 'fechamento';

export interface Lead {
  id: string;
  clinicId: string;
  procedimentoId?: string;
  procedimento?: Procedimento;
  medicoId?: string;
  medico?: Medico;
  nome: string;
  telefone?: string;
  email?: string;
  valorEstimado?: number;
  estagio: LeadEstagio;
  ultimoContato?: string;
  obs?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cirurgia ────────────────────────────────────────────────────────────────
export type CirurgiaStatus = 'agendada' | 'realizada' | 'cancelada';

export interface Cirurgia {
  id: string;
  clinicId: string;
  pacienteId: string;
  paciente?: Paciente;
  procedimentoId: string;
  procedimento?: Procedimento;
  medicoId: string;
  medico?: Medico;
  hospitalId: string;
  hospital?: Hospital;
  data: string;
  horaInicio?: string;
  duracaoMin?: number;
  valor?: number;
  status: CirurgiaStatus;
  obs?: string;
  statusPosOp?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  clinicId: string;
  clinic: Clinic;
}

// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardKpis {
  atendimentos: number;
  atendimentosVariacao: number;
  leadsAbertos: number;
  leadsVariacao: number;
  leadsFechamento: number;
  valorPotencial: number;
  cirurgiasAgendadas: number;
  cirurgiasVariacao: number;
  receitaPeriodo: number;
  receitaVariacao: number;
  ticketMedio: number;
  taxaConversao: number;
  npsMedia: number;
}

export interface ChartDataPoint {
  mes: string;
  cirurgias: number;
  receita: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  grafico: ChartDataPoint[];
  proximasCirurgias: Cirurgia[];
}
