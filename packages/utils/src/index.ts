export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function jornadaPercent(etapas: Array<{ status: string }>): number {
  if (!etapas.length) return 0;
  const done = etapas.filter((e) => e.status === 'done').length;
  return Math.round((done / etapas.length) * 100);
}

export function diasAteCircurgia(dataCirurgia?: string): number | null {
  if (!dataCirurgia) return null;
  const diff = new Date(dataCirurgia).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const SENTIMENTO_KEYWORDS_RISCO = [
  'cancelar',
  'desistir',
  'não quero',
  'mudei de ideia',
  'com medo',
  'arrependimento',
  'arrependi',
  'complicação',
  'erro',
  'problema grave',
];

export function detectRisk(text: string): boolean {
  const lower = text.toLowerCase();
  return SENTIMENTO_KEYWORDS_RISCO.some((kw) => lower.includes(kw));
}

export const FILA_KEYWORDS = [
  'cancelar',
  'reagendar',
  'preço',
  'valor',
  'complicação',
  'erro',
  'processo',
  'advogado',
  'reembolso',
];

export function needsApproval(text: string): boolean {
  const lower = text.toLowerCase();
  return FILA_KEYWORDS.some((kw) => lower.includes(kw));
}
