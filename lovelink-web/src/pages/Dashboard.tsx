import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { projetosApi, secretariasApi, usersApi, decisoesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Building2, Users, FileCheck, Clock, CheckCircle2, AlertCircle, TrendingUp, Moon, Sun } from 'lucide-react';
import { getStatusClass } from '@/lib/helpers';
import {
  PieChart, Pie, Cell as RechartsCell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';

const CHART_COLORS = [
  'hsl(215, 80%, 42%)',   // primary
  'hsl(168, 60%, 42%)',   // accent
  'hsl(38, 92%, 50%)',    // warning
  'hsl(0, 72%, 51%)',     // destructive
  'hsl(145, 63%, 42%)',   // success
  'hsl(270, 60%, 55%)',   // purple
];

// --- COMPONENTES DE DESIGN (ESTILO COLUNAS) ---
const ColumnGroup = ({ title, children, color, icon, width = "min-w-[150px]" }: any) => (
  <div className={`flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 ${width}`}>
    <div className={`${color} py-3 px-2 text-white flex items-center justify-center gap-1.5 font-bold text-[10px] tracking-widest uppercase text-center`}>
      {icon} {title}
    </div>
    <div className="flex flex-col flex-1 divide-y divide-border/40 bg-white/50">{children}</div>
  </div>
);

const TableCellDesign = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`h-[60px] flex items-center justify-center px-3 text-center text-xs text-muted-foreground text-slate-600 dark:text-slate-200 leading-tight ${className}`}>
    {children}
  </div>
);

export function ModeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Efeito para aplicar a classe 'dark' no HTML
  useEffect(() => {
    const html = window.document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Carregar preferência salva
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDark(true);
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full w-10 h-10 bg-background border-border shadow-sm transition-all hover:bg-accent"
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700 transition-all" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}

export default function Dashboard() {
  const { user, isPrefeita } = useAuth();
  const [stats, setStats] = useState({ projetos: 0, secretarias: 0, usuarios: 0, decisoes: 0 });
  const [projetos, setProjetos] = useState<any[]>([]);
  const [secretarias, setSecretarias] = useState<any[]>([]);
  const [decisoes, setDecisoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'orcamento' | 'decisoes'>('status');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, secRes, usrRes, decRes] = await Promise.all([
          projetosApi.list(),
          secretariasApi.list(),
          isPrefeita ? usersApi.list() : Promise.resolve({ data: [] }),
          isPrefeita ? decisoesApi.listAll() : Promise.resolve({ data: [] }),
        ]);

        const allProjets = projRes.data;
        let filteredProjetos = allProjets;

        // Lógica de Filtro para Secretário (Dono ou Parceiro)
        if (!isPrefeita && user?.id_secretaria) {
          const mySecId = Number(user.id_secretaria);
          filteredProjetos = allProjets.filter((p: any) => 
            Number(p.id_secretaria) === mySecId || 
            Number(p.id_secretaria_parceira) === mySecId
          );
        }

        setProjetos(filteredProjetos);
        setSecretarias(secRes.data);
        setDecisoes(decRes.data);
        setStats({
          projetos: filteredProjetos.length,
          secretarias: secRes.data.length,
          usuarios: usrRes.data.length,
          decisoes: decRes.data.length,
        });
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isPrefeita, user]);

  // Cálculos para Gráficos
  const pendentes = projetos.filter(p => p.status_aprovacao === 'Pendente Aprovação').length;
  const aprovados = projetos.filter(p => p.status_aprovacao === 'Aprovado').length;
  const emExecucao = projetos.filter(p => p.status === 'Em Execução').length;

  const statusCounts: Record<string, number> = {};
  projetos.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const aprovacaoCounts: Record<string, number> = {};
  projetos.forEach(p => { aprovacaoCounts[p.status_aprovacao] = (aprovacaoCounts[p.status_aprovacao] || 0) + 1; });
  const aprovacaoPieData = Object.entries(aprovacaoCounts).map(([name, value]) => ({ name, value }));

  // Dados por Secretaria (Apenas relevante para a Prefeita)
  const secMap: Record<string, number> = {};
  projetos.forEach(p => {
    const sigla = p.secretaria_sigla || 'N/A';
    secMap[sigla] = (secMap[sigla] || 0) + 1;
  });
  const projetosPorSecretaria = Object.entries(secMap).map(([secretaria, total]) => ({ secretaria, total })).sort((a, b) => b.total - a.total);

  const custoMap: Record<string, number> = {};
  projetos.forEach(p => {
    const sigla = p.secretaria_sigla || 'N/A';
    custoMap[sigla] = (custoMap[sigla] || 0) + Number(p.custo_previsto || 0);
  });
  const custoPorSecretaria = Object.entries(custoMap).map(([secretaria, custo]) => ({ secretaria, custo: Math.round(custo) })).sort((a, b) => b.custo - a.custo);

  const totalCusto = projetos.reduce((sum, p) => sum + Number(p.custo_previsto || 0), 0);

  // Timeline de Decisões
  const decByMonth: Record<string, number> = {};
  decisoes.forEach((d: any) => {
    const date = d.data_decisao || d.created_at;
    if (date) {
      const month = new Date(date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      decByMonth[month] = (decByMonth[month] || 0) + 1;
    }
  });
  const decisoesTimeline = Object.entries(decByMonth).map(([mes, total]) => ({ mes, total }));

  // Stacked Bar (Status por Sec)
  const statusPerSec: Record<string, Record<string, number>> = {};
  const allStatuses = new Set<string>();
  projetos.forEach(p => {
    const sigla = p.secretaria_sigla || 'N/A';
    if (!statusPerSec[sigla]) statusPerSec[sigla] = {};
    statusPerSec[sigla][p.status] = (statusPerSec[sigla][p.status] || 0) + 1;
    allStatuses.add(p.status);
  });
  const stackedBarData = Object.entries(statusPerSec).map(([secretaria, statuses]) => ({ secretaria, ...statuses }));

  const statCards = isPrefeita
    ? [
        { label: 'Total de Projetos', value: stats.projetos, icon: FolderKanban, color: 'bg-primary/10 text-primary' },
        { label: 'Secretarias', value: stats.secretarias, icon: Building2, color: 'bg-accent/10 text-accent' },
        { label: 'Usuários', value: stats.usuarios, icon: Users, color: 'bg-info/10 text-info' },
        { label: 'Decisões', value: stats.decisoes, icon: FileCheck, color: 'bg-warning/10 text-warning' },
      ]
    : [
        { label: 'Meus Projetos', value: stats.projetos, icon: FolderKanban, color: 'bg-primary/10 text-primary' },
        { label: 'Pendentes', value: pendentes, icon: Clock, color: 'bg-warning/10 text-warning' },
        { label: 'Aprovados', value: aprovados, icon: CheckCircle2, color: 'bg-accent/10 text-accent' },
        { label: 'Em Execução', value: emExecucao, icon: AlertCircle, color: 'bg-info/10 text-info' },
      ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-muted-foreground">{payload[0].value} projeto(s)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      
    <div className="page-header flex justify-between items-start">
      <div>
        <h1 className="page-title">
          {isPrefeita ? 'Sala de Situação - PAINEL GERAL' : 'Sala de Situação - PAINEL DA SECRETARIA'} 
        </h1>
        <p className="page-subtitle">
          Bem-vindo(a), {user?.nome}. {isPrefeita ? 'Visão geral em tempo real de todos os projetos.' : 'Acompanhe os projetos da sua secretaria.'}
        </p>
      </div>
      <div className="shrink-0">
        <ModeToggle />
      </div>
    </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-4">
              <div className={`stat-card-icon ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
        
      {/* Investimento Total - Visível para todos (Filtrado automaticamente) */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="flex items-center justify-center gap-4 py-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">
                {isPrefeita ? 'Investimento Total Previsto (Município)' : 'Orçamento Total dos Projetos'}
              </p>
              <p className="text-3xl font-bold font-heading text-primary leading-tight">
                {totalCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Abas - Apenas para a Prefeita */}
      {isPrefeita && (
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {(['status', 'orcamento', 'decisoes'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              className="px-6 py-2 h-auto" 
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'status' && 'Status / Aprovação'}
              {tab === 'orcamento' && 'Orçamento / Secretarias'}
              {tab === 'decisoes' && 'Decisões / Detalhamento'}
            </Button>
          ))}
        </div>
      )}

      {/* Seção de Gráficos Adaptativa */}
      {projetos.length > 0 ? (
        <>
          {/* Gráficos de Pizza - Aparecem para Prefeita (na aba Status) ou para Secretário (Sempre) */}
          {(activeTab === 'status' || !isPrefeita) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Projetos por Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {statusPieData.map((_, i) => (<RechartsCell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                      </Pie>
                      <Tooltip content={<CustomTooltipPie />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Projetos por Aprovação</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={aprovacaoPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {aprovacaoPieData.map((_, i) => (<RechartsCell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />))}
                      </Pie>
                      <Tooltip content={<CustomTooltipPie />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Abas exclusivas da Prefeita */}
          {isPrefeita && activeTab === 'orcamento' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Projetos por Secretaria</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={projetosPorSecretaria} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="secretaria" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="total" fill="hsl(215, 80%, 42%)" radius={[0, 6, 6, 0]} name="Projetos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Orçamento por Secretaria (R$)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={custoPorSecretaria} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="secretaria" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="custo" fill="hsl(168, 60%, 42%)" radius={[0, 6, 6, 0]} name="Orçamento" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {isPrefeita && activeTab === 'decisoes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Status por Secretaria</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stackedBarData} margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="secretaria" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      {Array.from(allStatuses).map((status, i) => (
                        <Bar key={status} dataKey={status} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]}
                          radius={i === allStatuses.size - 1 ? [4, 4, 0, 0] : undefined} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {decisoesTimeline.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Decisões ao Longo do Tempo</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={decisoesTimeline}>
                        <defs>
                          <linearGradient id="gradientDecisoes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(215, 80%, 42%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(215, 80%, 42%)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="total" stroke="hsl(215, 80%, 42%)" fill="url(#gradientDecisoes)" strokeWidth={2} name="Decisões" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tabela de Projetos - Visível para todos */}
          {/* Tabela de Projetos - DESIGN MODERNO */}
          {(activeTab === 'status' || !isPrefeita) && (
            <div className="space-y-4 mb-10">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Projetos Recentes</h3>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Últimos 5 registros
                </div>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max px-1">
                  
                  {/* Coluna: Nome */}
                  <ColumnGroup title="Projeto" icon={<FolderKanban className="h-3 w-3"/>} color="bg-purple-500" width="min-w-[280px]">
                    {projetos.slice(0, 5).map((p, i) => (
                      <TableCellDesign key={i} className="font-bold text-slate-800 justify-start text-left">
                        {p.nome}
                      </TableCellDesign>
                    ))}
                  </ColumnGroup>

                  {/* Coluna: Secretaria (Só aparece para Prefeita) */}
                  {isPrefeita && (
                    <ColumnGroup title="Secretaria" icon={<Building2 className="h-3 w-3"/>} color="bg-blue-500" width="min-w-[150px]">
                      {projetos.slice(0, 5).map((p, i) => (
                        <TableCellDesign key={i} className="font-bold text-foreground">
                          {p.secretaria_sigla}
                        </TableCellDesign>
                      ))}
                    </ColumnGroup>
                  )}

                  {/* Coluna: Responsável */}
                  <ColumnGroup title="Responsável" icon={<Users className="h-3 w-3"/>} color="bg-slate-500" width="min-w-[180px]">
                    {projetos.slice(0, 5).map((p, i) => (
                      <TableCellDesign key={i}>
                        {p.responsavel_nome}
                      </TableCellDesign>
                    ))}
                  </ColumnGroup>

                  {/* Coluna: Status */}
                  <ColumnGroup title="Status" icon={<AlertCircle className="h-3 w-3"/>} color="bg-sky-500" width="min-w-[150px]">
                    {projetos.slice(0, 5).map((p, i) => (
                      <TableCellDesign key={i}>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${getStatusClass(p.status)}`}>
                          {p.status}
                        </span>
                      </TableCellDesign>
                    ))}
                  </ColumnGroup>

                  {/* Coluna: Aprovação */}
                  <ColumnGroup title="Aprovação" icon={<CheckCircle2 className="h-3 w-3"/>} color="bg-cyan-500" width="min-w-[180px]">
                    {projetos.slice(0, 5).map((p, i) => (
                      <TableCellDesign key={i}>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${getStatusClass(p.status_aprovacao)}`}>
                          {p.status_aprovacao}
                        </span>
                      </TableCellDesign>
                    ))}
                  </ColumnGroup>

                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">Nenhum projeto encontrado para esta visão.</p>
        </div>
      )}
    </div>
  );
}