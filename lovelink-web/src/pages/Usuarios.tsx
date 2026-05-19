import { useEffect, useState } from 'react';
import { usersApi, authApi, secretariasApi } from '@/services/api'; // Importado secretariasApi
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, User, Mail, ShieldCheck, Settings, Building2 } from 'lucide-react';

// Sub-componentes
const ColumnGroup = ({ title, children, color, icon, width = "flex-1" }: any) => (
  <div className={`flex flex-col bg-card rounded-2xl overflow-hidden shadow-md border border-border/50 ${width} min-w-[200px]`}>
    <div className={`${color} py-4 px-4 text-white flex items-center justify-center gap-2 font-bold text-xs tracking-widest uppercase text-center`}>
      {icon} {title}
    </div>
    <div className="flex flex-col flex-1 divide-y divide-border/40 bg-white/40">
      {children}
    </div>
  </div>
);

const Cell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`h-[55px] flex items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground leading-snug ${className}`}>
    {children}
  </div>
);

export default function Usuarios() {
  const [items, setItems] = useState<any[]>([]);
  const [secretarias, setSecretarias] = useState<any[]>([]); // Estado para as secretarias
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  
  // Adicionado id_secretaria ao form
  const [form, setForm] = useState({ 
    nome: '', 
    email: '', 
    senha: '', 
    perfil: '', 
    id_secretaria: '' 
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, secRes] = await Promise.all([
        usersApi.list(),
        secretariasApi.list()
      ]);
      setItems(usersRes.data);
      setSecretarias(secRes.data);
    } catch { 
      toast.error('Erro ao carregar dados.'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', email: '', senha: '', perfil: '', id_secretaria: '' });
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const { data } = await usersApi.getById(id);
      setEditing(data);
      setForm({ 
        nome: data.nome, 
        email: data.email, 
        senha: '', 
        perfil: data.perfil,
        id_secretaria: data.id_secretaria?.toString() || '' 
      });
      setDialogOpen(true);
    } catch { toast.error('Erro ao carregar usuário.'); }
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.perfil || !form.id_secretaria) {
      toast.error('Preencha todos os campos, incluindo a secretaria.');
      return;
    }

    setSaving(true);
    try {
      const payload = { 
        ...form, 
        id_secretaria: Number(form.id_secretaria) 
      };

      if (editing) {
        if (!payload.senha) delete payload.senha;
        await usersApi.update(editing.id_user, payload);
        toast.success('Usuário atualizado!');
      } else {
        if (!form.senha.trim()) { 
          toast.error('Senha é obrigatória.'); 
          setSaving(false); 
          return; 
        }
        await authApi.register(payload);
        toast.success('Usuário cadastrado!');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.delete(deleteId);
      toast.success('Usuário excluído!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    } finally { setDeleteId(null); }
  };

  const filtered = items.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Função para encontrar o nome da secretaria pelo ID para exibir na tabela
  const getSecretariaNome = (id: number) => {
    const sec = secretarias.find(s => s.id_sec === id);
    return sec ? sec.sigla : 'Não informada';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-8 p-2">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="page-subtitle text-base text-muted-foreground">Gerenciamento de acessos e permissões do sistema</p>
        </div>
        <Button onClick={openCreate} className="gap-2 h-11 px-6 shadow-md transition-all hover:scale-105">
          <Plus className="h-5 w-5" /> Novo Usuário
        </Button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="border-accent/20 bg-accent/5 p-6 rounded-2xl border shadow-sm">
        <div className="max-w-md space-y-3">
          <Label className="text-sm uppercase font-bold tracking-wider text-muted-foreground">Filtro de Pesquisa</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
            <Input 
              placeholder="Digite o nome ou e-mail..." 
              className="pl-12 h-11 bg-background" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="flex gap-4 min-w-full px-1">
          <ColumnGroup title="Nome Completo" icon={<User className="h-4 w-4"/>} color="bg-slate-600" width="flex-[2]">
            {filtered.map((u) => (
              <Cell key={u.id_user} className="font-bold text-slate-900">
                {u.nome}
              </Cell>
            ))}
          </ColumnGroup>

          <ColumnGroup title="Secretaria" icon={<Building2 className="h-4 w-4"/>} color="bg-emerald-600" width="flex-1">
            {filtered.map((u) => (
              <Cell key={u.id_user}>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-100 text-xs font-bold">
                  {getSecretariaNome(u.id_secretaria)}
                </span>
              </Cell>
            ))}
          </ColumnGroup>

          <ColumnGroup title="Perfil" icon={<ShieldCheck className="h-4 w-4"/>} color="bg-blue-600" width="flex-1">
            {filtered.map((u) => (
              <Cell key={u.id_user}>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  u.perfil === 'prefeita' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {u.perfil === 'prefeita' ? 'Gestora' : 'Secretário'}
                </span>
              </Cell>
            ))}
          </ColumnGroup>

          <ColumnGroup title="Ações" icon={<Settings className="h-4 w-4"/>} color="bg-slate-700" width="min-w-[150px]">
            {filtered.map((u) => (
              <Cell key={u.id_user} className="gap-3">
                <Button variant="outline" size="icon" onClick={() => openEdit(u.id_user)} className="h-10 w-10 rounded-full text-blue-600 border-blue-100"><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setDeleteId(u.id_user)} className="h-10 w-10 rounded-full text-destructive border-red-100"><Trash2 className="h-4 w-4" /></Button>
              </Cell>
            ))}
          </ColumnGroup>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>Preencha os dados de acesso e lotação do colaborador.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={form.perfil} onValueChange={v => setForm({...form, perfil: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prefeita">Gestora</SelectItem>
                    <SelectItem value="secretario">Secretário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Secretaria</Label>
                <Select value={form.id_secretaria} onValueChange={v => setForm({...form, id_secretaria: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {secretarias.map((sec) => (
                      <SelectItem key={sec.id_sec} value={sec.id_sec.toString()}>
                        {sec.sigla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha {editing && "(deixe em branco para manter)"}</Label>
              <Input id="senha" type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}