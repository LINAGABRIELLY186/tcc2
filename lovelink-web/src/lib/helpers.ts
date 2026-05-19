export function getStatusClass(status: string): string {
  switch (status) {
    case 'Aprovado':
    case 'Concluído':
      return 'status-approved';
    case 'Pendente Aprovação':
    case 'Em Planejamento':
      return 'status-pending';
    case 'Reprovado':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Arquivado':
      return 'status-rejected';
    case 'Em Execução':
      return 'status-executing';
    default:
      return 'status-planning';
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
