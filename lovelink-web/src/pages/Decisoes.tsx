import { useEffect, useState } from 'react';
import { decisoesApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Calendar, FileText, Building2, User, Info, FileDown, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusClass, formatDate } from '@/lib/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Layout de Colunas Estilo Card (Conforme a foto enviada)
const ColumnGroup = ({ title, children, color, icon, width = "min-w-[140px]" }: any) => (
  <div className={`flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 ${width}`}>
    <div className={`${color} py-3 px-2 text-white flex items-center justify-center gap-1.5 font-bold text-[10px] tracking-widest uppercase text-center`}>
      {icon} {title}
    </div>
    <div className="flex flex-col flex-1 divide-y divide-border/40 bg-white/50">{children}</div>
  </div>
);

const Cell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`h-[60px] flex items-center justify-center px-3 text-center text-xs text-muted-foreground leading-tighttext-slate-600 dark:text-slate-300 ${className}`}>
    {children}
  </div>
);

export default function Decisoes() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro Padronizados
  const [search, setSearch] = useState('');
  const [filterSecretaria, setFilterSecretaria] = useState('');
  const [filterTipoDecisao, setFilterTipoDecisao] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await decisoesApi.listAll();
        setItems(data || []);
      } catch { toast.error('Erro ao carregar decisões.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  // Lógica de Filtro Multi-critério
  const filtered = items.filter(d => {
    const matchSearch = d.projeto_nome?.toLowerCase().includes(search.toLowerCase());
    const matchSec = filterSecretaria ? d.secretaria_sigla === filterSecretaria : true;
    const matchDecisao = filterTipoDecisao ? d.tipo_decisao === filterTipoDecisao : true;
    return matchSearch && matchSec && matchDecisao;
  });

  // Exportador de PDF Padronizado (IDÊNTICO AOS PROJETOS)
  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Paisagem para caber mais dados
    
    // Título do PDF
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Relatório: Decisões do Gabinete", 14, 20);
    
    // Subtítulo com data de geração
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = filtered.map(d => [
      formatDate(d.data_decisao),
      d.projeto_nome,
      d.secretaria_sigla,
      d.tipo_decisao,
      d.gestor_nome,
      d.observacoes || '-'
    ]);

    autoTable(doc, {
      head: [['Data', 'Projeto', 'Secretaria', 'Decisão', 'Gestor', 'Observações']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }, // Azul marinho padrão
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`decisoes_gabinete_${new Date().getTime()}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Decisões do Gabinete</h1>
        <p className="page-subtitle">Histórico de todas as decisões sobre projetos</p>
      </div>

      {/* ÁREA DE FILTROS (CORES IGUAIS À TELA DE PROJETOS) */}
      <div className="border-accent/20 bg-accent/5 p-6 rounded-xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nome do projeto..." 
                className="pl-9 bg-background" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Secretaria</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={filterSecretaria}
              onChange={(e) => setFilterSecretaria(e.target.value)}
            >
              <option value="">Todas</option>
              {Array.from(new Set(items.map(i => i.secretaria_sigla))).sort().map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Decisão</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={filterTipoDecisao}
              onChange={(e) => setFilterTipoDecisao(e.target.value)}
            >
              <option value="">Todas</option>
              {Array.from(new Set(items.map(i => i.tipo_decisao))).sort().map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2" 
              onClick={() => { setSearch(''); setFilterSecretaria(''); setFilterTipoDecisao(''); }}
            >
              <FilterX className="h-4 w-4" /> Limpar
            </Button>
            <Button onClick={exportToPDF} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white font-bold">
              <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* GRID DE COLUNAS (DESIGN DA FOTO) */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-2 min-w-max px-1">
          <ColumnGroup title="Data" icon={<Calendar className="h-3 w-3"/>} color="bg-slate-500" width="min-w-[150px]">
            {filtered.map((d, i) => <Cell key={i}>{formatDate(d.data_decisao)}</Cell>)}
          </ColumnGroup>

          <ColumnGroup title="Projeto" icon={<FileText className="h-3 w-3"/>} color="bg-purple-500" width="min-w-[240px]">
            {filtered.map((d, i) => <Cell key={i} className="font-bold text-slate-800 px-4">{d.projeto_nome}</Cell>)}
          </ColumnGroup>

          <ColumnGroup title="Secretaria" icon={<Building2 className="h-3 w-3"/>} color="bg-blue-500" width="min-w-[150px]">
            {filtered.map((d, i) => <Cell key={i}>{d.secretaria_sigla}</Cell>)}
          </ColumnGroup>

          <ColumnGroup title="Decisão" icon={<Info className="h-3 w-3"/>} color="bg-sky-500" width="min-w-[140px]">
            {filtered.map((d, i) => (
              <Cell key={i}>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${getStatusClass(d.tipo_decisao)}`}>
                  {d.tipo_decisao}
                </span>
              </Cell>
            ))}
          </ColumnGroup>

          <ColumnGroup title="Gestor" icon={<User className="h-3 w-3"/>} color="bg-cyan-500" width="min-w-[150px]">
            {filtered.map((d, i) => <Cell key={i}>{d.gestor_nome}</Cell>)}
          </ColumnGroup>

          <ColumnGroup title="Observações" color="bg-teal-400" width="min-w-[220px]">
            {filtered.map((d, i) => (
              <Cell key={i} className="text-[10px] italic">
                <span className="line-clamp-2 px-2" title={d.observacoes}>{d.observacoes || '—'}</span>
              </Cell>
            ))}
          </ColumnGroup>
        </div>
      </div>
    </div>
  );
}