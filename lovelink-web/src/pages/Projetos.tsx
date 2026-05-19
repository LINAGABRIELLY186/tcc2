import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { projetosApi, secretariasApi, usersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { 
  Plus, Pencil, Trash2, Search, Loader2, Eye, 
  CheckCircle2, FilterX, Info, Building2, Calendar, User2,
  ChevronLeft, ChevronRight, FileText, FileDown, DollarSign, Activity
} from 'lucide-react';
import { getStatusClass, formatDate, formatCurrency } from '@/lib/helpers';
import { useNavigate } from 'react-router-dom';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";



// --- COMPONENTES DE DESIGN (ESTILO COLUNAS) ---
const ColumnGroup = ({ title, children, color, icon, width = "min-w-[150px]" }: any) => (
  <div className={`flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 ${width}`}>
    <div className={`${color} py-3 px-2 text-white flex items-center justify-center gap-1.5 font-bold text-[10px] tracking-widest uppercase text-center`}>
      {icon} {title}
    </div>
    <div className="flex flex-col flex-1 divide-y divide-border/40 bg-white/50">{children}</div>
  </div>
);

const Cell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`h-[65px] flex items-center justify-center px-3 text-center text-xs text-muted-foreground leading-tight  ${className}`}>
    {children}
  </div>
);

export default function Projetos() {
  const { user, isPrefeita } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [secretarias, setSecretarias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const pdfStyles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', color: '#334155' },
    header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#0f172a', paddingBottom: 10 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    subtitle: { fontSize: 8, color: '#64748b', marginTop: 2 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', padding: 6, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', padding: 6 },
    colNome: { width: '35%' },
    colSec: { width: '15%' },
    colPrazo: { width: '15%' },
    colCusto: { width: '15%' },
    colStatus: { width: '20%' },
    footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 7, color: '#94a3b8' }
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterSecretaria, setFilterSecretaria] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAprovacao, setFilterAprovacao] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decisaoDialog, setDecisaoDialog] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    nome: '', objetivo: '', prazo: '', custo_previsto: '',
    id_responsavel: '', id_secretaria: '', id_secretaria_parceira: '',
  });
  const [decisaoForm, setDecisaoForm] = useState({ tipo_decisao: '', observacoes: '' });
  const [saving, setSaving] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('pendentes');

  const [filterAno, setFilterAno] = useState('all');

// Opcional: Criar uma lista de anos dinâmica baseada nos seus projetos
const anosDisponiveis = Array.from(
  new Set(items.map(p => new Date(p.prazo).getFullYear()))
).sort((a, b) => b - a); // Do mais novo para o mais antigo

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, secRes, usrRes] = await Promise.all([
        projetosApi.list(),
        secretariasApi.list(),
        usersApi.list(),
      ]);
     let todosOsProjetos = projRes.data;

    // --- LÓGICA DE ORDENAÇÃO ADICIONADA AQUI ---
    // Ordena da data mais próxima (hoje) para a mais distante
    todosOsProjetos.sort((a: any, b: any) => {
      const dataA = new Date(a.prazo).getTime();
      const dataB = new Date(b.prazo).getTime();
      return dataA - dataB; // Menor data (mais próxima) vem primeiro
    });
    // ------------------------------------------

    let filtrados = todosOsProjetos;
      if (!isPrefeita && user) {
        filtrados = todosOsProjetos.filter((p: any) => {
          if (p.status_aprovacao?.toLowerCase() === 'reprovado') return false;
          const uSec = Number(user.id_secretaria);
          const pSec = Number(p.id_secretaria);
          const pParc = Number(p.id_secretaria_parceira);
          const matchSecretaria = (pSec === uSec);
          const matchParceria = (pParc > 0 && pParc === uSec);
          const matchResponsavel = (Number(p.id_responsavel) === Number(user.id_user));
          return matchSecretaria || matchParceria || matchResponsavel;
        });
      }
      setItems(filtrados);
      setSecretarias(secRes.data);
      setUsuarios(usrRes.data);
    } catch (error) {
      toast.error('Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter(p => {
  // 1. Preparação dos dados de data
  const dataProjeto = new Date(p.prazo);
  const anoProjeto = dataProjeto.getFullYear().toString();

  // 2. Filtros de Busca e Selects (Secretaria, Status, Aprovação)
  const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || 
                        p.secretaria_sigla?.toLowerCase().includes(search.toLowerCase());
  const matchesSecretaria = filterSecretaria === 'all' || String(p.id_secretaria) === filterSecretaria;
  const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
  const matchesAprovacao = filterAprovacao === 'all' || p.status_aprovacao === filterAprovacao;
  
  // 3. Filtro de Ano
  const matchesAno = filterAno === 'all' || anoProjeto === filterAno;

  // 4. Filtro de Abas (Aba Ativa) - ESTA É A CORREÇÃO
  // Se a aba for 'pendentes', escondemos os concluídos. Se for 'todos', mostramos tudo.
  const matchesAba = abaAtiva === 'todos' || p.status !== 'Concluído';

  // O projeto só aparece se passar em TODOS os critérios ao mesmo tempo
  return matchesSearch && matchesSecretaria && matchesStatus && matchesAprovacao && matchesAno && matchesAba;
});

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterSecretaria, filterStatus, filterAprovacao, itemsPerPage]);

  const resetFilters = () => {
    setSearch('');
    setFilterSecretaria('all');
    setFilterStatus('all');
    setFilterAprovacao('all');
    setFilterAno('all');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', objetivo: '', prazo: '', custo_previsto: '', id_responsavel: '', id_secretaria: '', id_secretaria_parceira: '', });
    setDialogOpen(true);
  };

  const ListaProjetosPDF = ({ dados }: { dados: any[] }) => (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Relatório Geral de Projetos</Text>
          <Text style={pdfStyles.subtitle}>SALA DE SITUAÇÃO • Filtros aplicados na exportação</Text>
        </View>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.colNome}>Projeto</Text>
          <Text style={pdfStyles.colSec}>Secretaria</Text>
          <Text style={pdfStyles.colPrazo}>Prazo</Text>
          <Text style={pdfStyles.colCusto}>Custo</Text>
          <Text style={pdfStyles.colStatus}>Status</Text>
        </View>
        {dados.map((p, i) => (
          <View key={i} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colNome}>{p.nome}</Text>
            <Text style={pdfStyles.colSec}>{p.secretaria_sigla}</Text>
            <Text style={pdfStyles.colPrazo}>{formatDate(p.prazo)}</Text>
            <Text style={pdfStyles.colCusto}>{formatCurrency(p.custo_previsto)}</Text>
            <Text style={pdfStyles.colStatus}>{p.status}</Text>
          </View>
        ))}
        <Text style={pdfStyles.footer}>Gerado em {new Date().toLocaleString('pt-BR')}</Text>
      </Page>
    </Document>
  );

  const openEdit = async (id: number) => {
    try {
      const { data } = await projetosApi.getById(id);
      const projetoNaLista = items.find(p => p.id_projeto === id);
      setEditing(data);
      setForm({
        nome: data.nome,
        objetivo: data.objetivo || '',
        prazo: data.prazo ? data.prazo.split('T')[0] : '',
        custo_previsto: data.custo_previsto?.toString() || '',
        id_responsavel: data.id_responsavel?.toString() || '',
        id_secretaria: data.id_secretaria?.toString() || '',
        id_secretaria_parceira: projetoNaLista?.id_secretaria_parceira?.toString() || 'none',
      });
      setDialogOpen(true);
    } catch {
      toast.error('Erro ao carregar dados.');
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        custo_previsto: parseFloat(form.custo_previsto) || 0,
        id_secretaria: editing ? parseInt(editing.id_secretaria) : (isPrefeita ? parseInt(form.id_secretaria) : user.id_secretaria),
        id_responsavel: isPrefeita ? parseInt(form.id_responsavel) : (editing ? parseInt(editing.id_responsavel) : user.id_user),
        id_secretaria_parceira: form.id_secretaria_parceira === 'none' ? null : parseInt(form.id_secretaria_parceira),
      };
      if (editing) {
        await projetosApi.update(editing.id_projeto, { ...payload, status: editing.status, status_aprovacao: editing.status_aprovacao });
        toast.success('Projeto atualizado!');
      } else {
        await projetosApi.create(payload as any);
        toast.success('Projeto cadastrado!');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await projetosApi.delete(deleteId);
      toast.success('Projeto excluído!');
      setDeleteId(null);
      fetchData();
    } catch {
      setDeleteId(null);
    }
  };

  const handleDecisao = async () => {
    if (!decisaoDialog || !decisaoForm.tipo_decisao) return;
    setSaving(true);
    try {
      await projetosApi.registrarDecisao(decisaoDialog.id_projeto, {
        tipo_decisao: decisaoForm.tipo_decisao,
        observacoes: decisaoForm.observacoes,
        id_gestor: user!.id_user,
      });
      toast.success(`Projeto ${decisaoForm.tipo_decisao.toLowerCase()}!`);
      setDecisaoDialog(null);
      setDecisaoForm({ tipo_decisao: '', observacoes: '' });
      fetchData();
    } catch {
      toast.error('Erro ao registrar decisão.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="page-header flex items-center justify-between flex-wrap gap-4">
  <div>
    <h1 className="page-title">Projetos</h1>
    <p className="page-subtitle">{isPrefeita ? 'Descubra os projetos que transformam nossa cidade.' : 'Explore os projetos da sua secretaria.'}</p>
  </div>

  <div className="flex items-center gap-4">
    {/* --- NOVAS ABAS --- */}
    <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-[280px]">
  <TabsList className="grid w-full grid-cols-2 rounded-full bg-primary/10 p-1 h-11 border border-primary/20">
    <TabsTrigger 
      value="pendentes" 
      className="rounded-full font-bold text-[11px] uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
    >
      Em Andamento
    </TabsTrigger>
    <TabsTrigger 
      value="todos" 
      className="rounded-full font-bold text-[11px] uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
    >
      Ver Todos
    </TabsTrigger>
  </TabsList>
</Tabs>

    <div className="flex items-center gap-2">
      <PDFDownloadLink document={<ListaProjetosPDF dados={filtered} />} fileName={`relatorio-projetos-${new Date().getTime()}.pdf`}>
        {({ loading }) => (
          <Button variant="default" disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
            Exportar PDF
          </Button>
        )}
      </PDFDownloadLink>
      <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Projeto</Button>
    </div>
  </div>
</div>

        <Card className="border-primary/20 bg-primary/10 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Buscar</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Nome do projeto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
              {isPrefeita && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Secretaria</Label>
                  <Select value={filterSecretaria} onValueChange={setFilterSecretaria}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Secretarias</SelectItem>{secretarias.map(s => (<SelectItem key={s.id_sec} value={s.id_sec.toString()}>{s.sigla}</SelectItem>))}</SelectContent></Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Status</SelectItem><SelectItem value="Em Planejamento">Em Planejamento</SelectItem><SelectItem value="Em Execução">Em Execução</SelectItem><SelectItem value="Concluído">Concluído</SelectItem><SelectItem value="Atrasado">Atrasado</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Aprovação</Label>
                <Select value={filterAprovacao} onValueChange={setFilterAprovacao}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Aprovações</SelectItem><SelectItem value="Pendente Aprovação">Pendente Aprovação</SelectItem><SelectItem value="Aprovado">Aprovado</SelectItem><SelectItem value="Reprovado">Reprovado</SelectItem><SelectItem value="Arquivado">Arquivado</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Ano do Prazo</Label>
              <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              <Button variant="outline" onClick={resetFilters} className="w-full"><FilterX className="h-4 w-4 mr-2" /> Limpar Filtros</Button>
            </div>
        
          </CardContent>
        </Card>

        {/* --- GRID DE COLUNAS (DESIGN) --- */}
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-3 min-w-max px-1">
            
            <ColumnGroup title="Projeto" icon={<FileText className="h-3 w-3"/>} color="bg-purple-500" width="min-w-[250px]">
              {paginatedItems.map((p, i) => (
                <Cell key={i} className={`font-bold text-slate-800 ${p.status_aprovacao?.toLowerCase() === 'reprovado' ? 'text-red-600 bg-red-50/50' : ''}`}>
                  {p.nome}
                </Cell>
              ))}
            </ColumnGroup>

            <ColumnGroup title="Secretaria" icon={<Building2 className="h-3 w-3"/>} color="bg-blue-500" width="min-w-[200px]">
              {paginatedItems.map((p, i) => (
                <Cell key={i} className="flex-col gap-1">
                  <span className="font-bold text-foreground">{p.secretaria_sigla}</span>
                  {p.parceria_sigla && p.parceria_sigla !== "0" && p.parceria_sigla !== 0 && (
                  <span className="bg-blue-100 text-blue-700 px-1 rounded font-bold text-[10px]">
                    🤝 {p.parceria_sigla}
                  </span>
                  )}
                </Cell>
              ))}
            </ColumnGroup>

            <ColumnGroup title="Prazo / Custo" icon={<DollarSign className="h-3 w-3"/>} color="bg-slate-500" width="min-w-[150px]">
              {paginatedItems.map((p, i) => (
                <Cell key={i} className="flex-col gap-0.5">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(p.prazo)}</span>
                  <span className="font-mono text-emerald-600 font-bold">{formatCurrency(p.custo_previsto)}</span>
                </Cell>
              ))}
            </ColumnGroup>

            <ColumnGroup title="Status" icon={<Activity className="h-3 w-3"/>} color="bg-sky-500" width="min-w-[150px]">
              {paginatedItems.map((p, i) => (
                <Cell key={i}>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${getStatusClass(p.status)}`}>
                    {p.status}
                  </span>
                </Cell>
              ))}
            </ColumnGroup>

            <ColumnGroup title="Aprovação" icon={<CheckCircle2 className="h-3 w-3"/>} color="bg-cyan-500" width="min-w-[200px]">
              {paginatedItems.map((p, i) => (
                <Cell key={i}>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${p.status_aprovacao?.toLowerCase() === 'reprovado' ? 'bg-red-100 text-red-700 border-red-200' : getStatusClass(p.status_aprovacao)}`}>
                    {p.status_aprovacao}
                  </span>
                </Cell>
              ))}
            </ColumnGroup>

            <ColumnGroup title="Ações" icon={<Info className="h-3 w-3"/>} color="bg-teal-400" width="min-w-[160px]">
  {paginatedItems.map((p, i) => {
    // Definimos se o projeto está concluído (usando uma verificação segura)
    const isConcluido = p.status?.toLowerCase().trim() === 'concluído' || p.status?.toLowerCase().trim() === 'concluido';

    return (
      <Cell key={i} className="gap-1">
        {/* O botão de "Olho" (Visualizar) SEMPRE fica visível */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projetos/${p.id_projeto}`)}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Visualizar Detalhes</TooltipContent>
        </Tooltip>

        {/* SÓ MOSTRA EDITAR E EXCLUIR SE NÃO ESTIVER CONCLUÍDO */}
        {!isConcluido && p.status_aprovacao?.toLowerCase() !== 'reprovado' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p.id_projeto)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id_projeto)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </>
        )}
        
        {/* Lógica da Prefeita (Decisão) se houver */}
        {isPrefeita && p.status_aprovacao === 'Pendente Aprovação' && !isConcluido && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="text-accent" onClick={() => { setDecisaoDialog(p); setDecisaoForm({ tipo_decisao: '', observacoes: '' }); }}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decisão</TooltipContent>
          </Tooltip>
        )}
      </Cell>
    );
  })}
</ColumnGroup>

          </div>
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-6 p-4 bg-white border rounded-xl gap-4">
          <div className="flex items-center gap-3"><Label className="text-sm text-muted-foreground text-xs font-bold uppercase">Exibir:</Label><Input type="number" value={itemsPerPage} onChange={(e) => setItemsPerPage(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 h-8" /></div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-muted-foreground uppercase">{totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="h-8 px-3 flex items-center justify-center text-xs font-black bg-primary text-white rounded">{currentPage}</div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* MODAIS (CÓDIGO ORIGINAL INTEGRAL) */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle className="text-xl flex items-center gap-2">{editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}{editing ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle><DialogDescription>Preencha os campos abaixo para {editing ? 'atualizar os dados do' : 'cadastrar um novo'} projeto no sistema.</DialogDescription></DialogHeader>
            <div className="grid gap-6 py-4 max-h-[65vh] overflow-y-auto px-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider"><Info className="h-4 w-4" /> Informações Gerais</div>
                <div className="space-y-2"><Label htmlFor="nome">Nome do Projeto</Label><div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="nome" placeholder="Ex: Reflorestamento Urbano" className="pl-10" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div></div>
                <div className="space-y-2"><Label htmlFor="objetivo">Objetivo Estratégico</Label><Textarea id="objetivo" className="min-h-[100px] resize-none" value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="prazo">Prazo Estimado</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="prazo" type="date" className="pl-10" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></div></div>
                  <div className="space-y-2"><Label htmlFor="custo">Custo Previsto</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span><Input id="custo" type="number" className="pl-10" value={form.custo_previsto} onChange={e => setForm({ ...form, custo_previsto: e.target.value })} /></div></div>
                </div>
              </div>
              <hr className="border-muted/50" />
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider"><User2 className="h-4 w-4" /> Responsabilidade</div>
                <div className="grid gap-4">
                  <div className="space-y-2"><Label>Secretaria Responsável</Label><Select value={form.id_secretaria} onValueChange={v => setForm({ ...form, id_secretaria: v, id_responsavel: '' })} disabled={!isPrefeita}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{secretarias.map(s => (<SelectItem key={s.id_sec} value={s.id_sec.toString()}>{s.sigla} - {s.nome}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Secretaria Parceira</Label><Select value={form.id_secretaria_parceira} onValueChange={v => setForm({ ...form, id_secretaria_parceira: v })}><SelectTrigger><SelectValue placeholder="Sem parceria" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{secretarias.filter(s => s.id_sec.toString() !== form.id_secretaria).map(s => (<SelectItem key={s.id_sec} value={s.id_sec.toString()}>🤝 {s.sigla}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Líder do Projeto</Label><Select value={form.id_responsavel} onValueChange={v => setForm({ ...form, id_responsavel: v })} disabled={!form.id_secretaria}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{usuarios.filter(u => String(u.id_secretaria) === String(form.id_secretaria)).map(u => (<SelectItem key={u.id_user} value={u.id_user.toString()}>{u.nome}</SelectItem>))}</SelectContent></Select></div>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Atualizar' : 'Cadastrar'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!decisaoDialog} onOpenChange={() => setDecisaoDialog(null)}>
          <DialogContent><DialogHeader><DialogTitle>Decisão do Gabinete</DialogTitle><DialogDescription>Projeto: {decisaoDialog?.nome}</DialogDescription></DialogHeader>
            <div className="space-y-4"><div className="space-y-2"><Label>Decisão</Label><Select value={decisaoForm.tipo_decisao} onValueChange={v => setDecisaoForm({ ...decisaoForm, tipo_decisao: v })}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Aprovado">Aprovar</SelectItem><SelectItem value="Reprovado">Reprovar</SelectItem><SelectItem value="Arquivado">Arquivar</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={decisaoForm.observacoes} onChange={e => setDecisaoForm({ ...decisaoForm, observacoes: e.target.value })} rows={3} /></div></div>
            <DialogFooter><Button variant="outline" onClick={() => setDecisaoDialog(null)}>Cancelar</Button><Button onClick={handleDecisao} disabled={saving || !decisaoForm.tipo_decisao}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirmar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir projeto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}