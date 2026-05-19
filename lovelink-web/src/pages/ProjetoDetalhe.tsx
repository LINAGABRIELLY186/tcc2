import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Document, Page, Text, View, StyleSheet, PDFDownloadLink 
} from '@react-pdf/renderer';
import { projetosApi, etapasApi, decisoesApi, usersApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, FileDown, CheckCircle2 } from 'lucide-react';
import { getStatusClass, formatDate, formatCurrency } from '@/lib/helpers';

// --- ESTILOS DO PDF ---
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#334155' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#0f172a', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  subtitle: { fontSize: 9, color: '#64748b', marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: 6, color: '#1e293b', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', marginBottom: 8 },
  label: { fontWeight: 'bold', color: '#475569', fontSize: 9 },
  value: { fontSize: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9', paddingVertical: 6 },
  col1: { width: '40%' },
  col2: { width: '25%' },
  col3: { width: '20%' },
  col4: { width: '15%', textAlign: 'right' },
  decisionBox: { marginBottom: 8, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

// --- COMPONENTE DO DOCUMENTO PDF ---
const MyDocument = ({ projeto, etapas, decisoes }: any) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>Relatório de Projeto</Text>
        <Text style={pdfStyles.subtitle}>SALA DE SITUAÇÃO - SISTEMA DE GESTÃO PÚBLICA</Text>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>DETALHES DO PROJETO</Text>
        <View style={pdfStyles.grid}>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Nome:</Text><Text style={pdfStyles.value}>{projeto.nome}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Secretaria:</Text><Text style={pdfStyles.value}>{projeto.nome_secretaria}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Responsável:</Text><Text style={pdfStyles.value}>{projeto.nome_responsavel}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Prazo:</Text><Text style={pdfStyles.value}>{formatDate(projeto.prazo)}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Custo:</Text><Text style={pdfStyles.value}>{formatCurrency(projeto.custo_previsto)}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Status:</Text><Text style={pdfStyles.value}>{projeto.status}</Text></View>
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>CRONOGRAMA DE ETAPAS</Text>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.col1}>Etapa</Text>
          <Text style={pdfStyles.col2}>Status</Text>
          <Text style={pdfStyles.col3}>Prazo</Text>
          <Text style={pdfStyles.col4}>Progresso</Text>
        </View>
        {etapas.map((et: any, i: number) => (
          <View key={i} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.col1}>{et.nome_etapa}</Text>
            <Text style={pdfStyles.col2}>{et.status_etapa}</Text>
            <Text style={pdfStyles.col3}>{formatDate(et.data_fim_prevista)}</Text>
            <Text style={pdfStyles.col4}>{et.percentual_conclusao}%</Text>
          </View>
        ))}
      </View>

      {decisoes.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>HISTÓRICO DE DECISÕES</Text>
          {decisoes.map((d: any, i: number) => (
            <View key={i} style={pdfStyles.decisionBox}>
              <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{d.tipo_decisao} • {formatDate(d.data_decisao)}</Text>
              <Text style={{ fontSize: 8, color: '#64748b' }}>Gestor: {d.gestor_nome}</Text>
              <Text style={{ marginTop: 4 }}>{d.observacoes}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={pdfStyles.footer}>Gerado em {new Date().toLocaleString('pt-BR')} • Autenticado via Sistema Sala de Situação</Text>
    </Page>
  </Document>
);

// --- COMPONENTE PRINCIPAL ---
export default function ProjetoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetoId = parseInt(id!);

  const [projeto, setProjeto] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [decisoes, setDecisoes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [etapaDialog, setEtapaDialog] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<any | null>(null);
  const [etapaForm, setEtapaForm] = useState({
    nome_etapa: '', descricao: '', data_inicio_prevista: '', data_fim_prevista: '',
    responsavel_etapa: '', status_etapa: 'Pendente', percentual_conclusao: '0',
    data_inicio_real: '', data_fim_real: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, etapasRes, decRes, usrRes] = await Promise.all([
        projetosApi.getById(projetoId),
        etapasApi.listByProjeto(projetoId),
        decisoesApi.listByProjeto(projetoId),
        usersApi.list(),
      ]);
      setProjeto(projRes.data);
      setEtapas(etapasRes.data);
      setDecisoes(decRes.data);
      setUsuarios(usrRes.data);
    } catch { toast.error('Erro ao carregar projeto.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [projetoId]);

  const openCreateEtapa = () => {
    setEditingEtapa(null);
    setEtapaForm({
      nome_etapa: '', descricao: '', data_inicio_prevista: '', data_fim_prevista: '',
      responsavel_etapa: '', status_etapa: 'Pendente', percentual_conclusao: '0',
      data_inicio_real: '', data_fim_real: '',
    });
    setEtapaDialog(true);
  };

  const openEditEtapa = (etapa: any) => {
    setEditingEtapa(etapa);
    setEtapaForm({
      nome_etapa: etapa.nome_etapa, descricao: etapa.descricao || '',
      data_inicio_prevista: etapa.data_inicio_prevista?.split('T')[0] || '',
      data_fim_prevista: etapa.data_fim_prevista?.split('T')[0] || '',
      responsavel_etapa: etapa.responsavel_etapa?.toString() || '',
      status_etapa: etapa.status_etapa || 'Pendente',
      percentual_conclusao: etapa.percentual_conclusao?.toString() || '0',
      data_inicio_real: etapa.data_inicio_real?.split('T')[0] || '',
      data_fim_real: etapa.data_fim_real?.split('T')[0] || '',
    });
    setEtapaDialog(true);
  };

  const handleSaveEtapa = async () => {
    if (!etapaForm.nome_etapa.trim()) { toast.error('Nome da etapa é obrigatório.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...etapaForm,
        responsavel_etapa: parseInt(etapaForm.responsavel_etapa) || null,
        percentual_conclusao: parseInt(etapaForm.percentual_conclusao) || 0,
        data_inicio_prevista: etapaForm.data_inicio_prevista || null,
        data_fim_prevista: etapaForm.data_fim_prevista || null,
        data_inicio_real: etapaForm.data_inicio_real || null,
        data_fim_real: etapaForm.data_fim_real || null,
      };
      if (editingEtapa) {
        await etapasApi.update(editingEtapa.id_etapa, payload);
        toast.success('Etapa atualizada!');
      } else {
        await etapasApi.create(projetoId, payload);
        toast.success('Etapa cadastrada!');
      }
      setEtapaDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar etapa.');
    } finally { setSaving(false); }
  };

  const handleValidarConclusaoGeral = async () => {
    setSaving(true);
    try {
      await projetosApi.update(projetoId, { 
        ...projeto, 
        status: 'Concluído' 
      });
      toast.success('Projeto finalizado com sucesso!');
      await fetchData(); 
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao finalizar projeto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEtapa = async (idEtapa: number) => {
    try {
      await etapasApi.delete(idEtapa);
      toast.success('Etapa excluída!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir etapa.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!projeto) return <p className="text-center text-muted-foreground py-12">Projeto não encontrado.</p>;

  return (
    <div className="container pb-10">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/projetos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>

        <PDFDownloadLink
          document={<MyDocument projeto={projeto} etapas={etapas} decisoes={decisoes} />}
          fileName={`Relatorio_${projeto.nome.replace(/\s+/g, '_')}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <Button variant="default" className="bg-blue-700 hover:bg-blue-800" disabled={pdfLoading}>
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
              Exportar Relatório PDF
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <Card className="mb-6 overflow-hidden border-none shadow-lg">
        <div className="h-2 bg-blue-700 w-full" />
        <CardContent className="p-0">
          <div className="bg-slate-50/50 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <span className="text-blue-700 font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">
                  {projeto.nome_secretaria}
                </span>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {projeto.nome}
                </h1>
                <p className="text-slate-500 mt-2 max-w-2xl text-lg leading-relaxed">
                  {projeto.objetivo || 'Sem descrição de objetivo definida.'}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
              {projeto.status !== 'Concluído' && 
              etapas.length > 0 && 
              etapas.every(et => Number(et.percentual_conclusao) === 100) ? (
                <Button 
                  onClick={handleValidarConclusaoGeral}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  FINALIZAR PROJETO
                </Button>
              ) : (
                <span className={`px-4 py-1.5 rounded-lg font-bold text-sm shadow-sm ${getStatusClass(projeto.status)}`}>
                  {projeto.status.toUpperCase()}
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                Status do Projeto
              </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <Label className="text-slate-400 text-[10px] uppercase font-bold">Gestor Responsável</Label>
                  <p className="font-semibold text-slate-800 text-sm block">{projeto.nome_responsavel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <Label className="text-slate-400 text-[10px] uppercase font-bold">Prazo Final</Label>
                  <p className="font-semibold text-slate-800 text-sm block">{formatDate(projeto.prazo)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <Label className="text-slate-400 text-[10px] uppercase font-bold">Investimento</Label>
                  <p className="font-bold text-emerald-700 text-sm block">{formatCurrency(projeto.custo_previsto)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <Label className="text-slate-400 text-[10px] uppercase font-bold">Status de Aprovação</Label>
                  <div className={`text-[10px] font-bold mt-0.5 ${getStatusClass(projeto.status_aprovacao)}`}>
                    {projeto.status_aprovacao}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-lg">Etapas e Cronograma</CardTitle>
        
        {/* O BOTÃO SÓ APARECE SE O STATUS NÃO FOR CONCLUÍDO */}
        {projeto.status !== 'Concluído' && (
          <Button size="sm" onClick={openCreateEtapa}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Etapa
          </Button>
        )}
      </CardHeader>
        <CardContent className="pt-6">
          {etapas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma etapa definida para este projeto.</p>
          ) : (
            <div className="grid gap-4">
              {etapas.map(et => {
                const isConcluida = parseInt(et.percentual_conclusao) === 100;
                return (
                  <div 
                    key={et.id_etapa} 
                    className={`group border rounded-xl p-4 hover:shadow-md transition-all bg-card border-l-4 ${
                      isConcluida ? "border-l-emerald-500 bg-emerald-50" : "border-l-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 text-base">{et.nome_etapa}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Só mostra os botões de ação se o projeto não estiver concluído */}
                    {projeto.status !== 'Concluído' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEtapa(et)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEtapa(et.id_etapa)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground mb-4">
                      <div>
                        <span className="block text-[10px] uppercase font-medium text-slate-400">Responsável</span>
                        <span className="text-slate-700">{et.nome_responsavel}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-medium text-slate-400">Prazo</span>
                        <span className="text-slate-700">{formatDate(et.data_fim_prevista)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-medium text-slate-400">Status</span>
                        <span className={`status-badge ${isConcluida ? "bg-emerald-100 text-emerald-700 border-emerald-200" : getStatusClass(et.status_etapa)}`}>
                          {isConcluida ? "Concluída" : et.status_etapa}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-medium text-slate-400">Conclusão</span>
                        <span className={isConcluida ? "text-emerald-600 font-bold" : "text-slate-700"}>{et.percentual_conclusao}%</span>
                      </div>
                    </div>
                    <Progress 
                      value={parseInt(et.percentual_conclusao)} 
                      className="h-1.5" 
                      style={{
                        // @ts-ignore
                        "--progress-foreground": isConcluida ? "#10b981" : "#1d4ed8" 
                      }}
                      indicatorClassName={isConcluida ? "bg-emerald-500" : "bg-blue-700"}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4"><CardTitle className="text-lg">Histórico de Decisões</CardTitle></CardHeader>
        <CardContent className="pt-6">
          {decisoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum registro de decisão disponível.</p>
          ) : (
            <div className="space-y-4">
              {decisoes.map((d, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`status-badge ${getStatusClass(d.tipo_decisao)} text-[10px]`}>{d.tipo_decisao}</span>
                      <span className="text-xs font-semibold text-slate-500">{formatDate(d.data_decisao)}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{d.observacoes}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">AUTORIZADO POR: {d.gestor_nome?.toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={etapaDialog} onOpenChange={setEtapaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEtapa ? 'Atualizar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Nome da Etapa</Label><Input value={etapaForm.nome_etapa} onChange={e => setEtapaForm({...etapaForm, nome_etapa: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Início Previsto</Label><Input type="date" value={etapaForm.data_inicio_prevista} onChange={e => setEtapaForm({...etapaForm, data_inicio_prevista: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Fim Previsto</Label><Input type="date" value={etapaForm.data_fim_prevista} onChange={e => setEtapaForm({...etapaForm, data_fim_prevista: e.target.value})} /></div>
            </div>
            <div className="grid gap-2">
              <Label>Responsável</Label>
              <Select value={etapaForm.responsavel_etapa} onValueChange={v => setEtapaForm({...etapaForm, responsavel_etapa: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {usuarios.map(u => <SelectItem key={u.id_user} value={u.id_user.toString()}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editingEtapa && (
              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={etapaForm.status_etapa} onValueChange={v => setEtapaForm({...etapaForm, status_etapa: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>% Conclusão</Label><Input type="number" value={etapaForm.percentual_conclusao} onChange={e => setEtapaForm({...etapaForm, percentual_conclusao: e.target.value})} /></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEtapaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEtapa} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}