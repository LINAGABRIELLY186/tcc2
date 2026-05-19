import { useEffect, useState } from 'react';
import { secretariasApi, usersApi } from '@/services/api'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, Building2, Tag, Settings, Users, Mail } from 'lucide-react';

interface Secretaria {
  id_sec: number;
  nome: string;
  sigla: string;
  email_contato?: string;
}

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  id_secretaria?: number; 
}

const ColumnGroup = ({ title, children, color, icon, width = "flex-1" }: any) => (
  <div className={`flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border/40 ${width} min-w-[150px]`}>
    <div className={`${color} py-3 px-4 text-white flex items-center justify-center gap-2 font-bold text-[10px] tracking-widest uppercase text-center`}>
      {icon} {title}
    </div>
    <div className="flex flex-col flex-1 divide-y divide-border/30 bg-white/40">
      {children}
    </div>
  </div>
);

const Cell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`h-[55px] flex items-center justify-center px-4 text-center text-sm font-medium text-muted-foreground leading-tight ${className}`}>
    {children}
  </div>
);

export default function Secretarias() {
  const [items, setItems] = useState<Secretaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Secretaria | null>(null);
  const [form, setForm] = useState({ nome: '', sigla: '', email_contato: '' });
  const [saving, setSaving] = useState(false);

  // Estados para o Modal de Usuários
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [selectedSec, setSelectedSec] = useState<Secretaria | null>(null);
  const [usersList, setUsersList] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await secretariasApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch { 
      toast.error('Erro ao carregar secretarias.'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleViewUsers = async (sec: Secretaria) => {
    setSelectedSec(sec);
    setUsersModalOpen(true);
    setLoadingUsers(true);
    try {
      const { data } = await usersApi.list(); 
      // Filtro manual para não precisar alterar o arquivo api.ts
      const filtrados = data.filter((u: Usuario) => u.id_secretaria === sec.id_sec);
      setUsersList(filtrados);
    } catch {
      toast.error('Erro ao buscar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', sigla: '', email_contato: '' });
    setDialogOpen(true);
  };

  const openEdit = async (sec: Secretaria) => {
    setEditing(sec);
    setForm({ 
      nome: sec.nome, 
      sigla: sec.sigla, 
      email_contato: sec.email_contato || '' 
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.sigla.trim()) {
      toast.error('Nome e sigla são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await secretariasApi.update(editing.id_sec, form);
        toast.success('Secretaria atualizada!');
      } else {
        await secretariasApi.create(form);
        toast.success('Secretaria cadastrada!');
      }
      setDialogOpen(false);
      fetchData();
    } catch { 
      toast.error('Erro ao salvar secretaria.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await secretariasApi.delete(deleteId);
      toast.success('Secretaria excluída!');
      fetchData();
    } catch { 
      toast.error('Erro ao excluir.'); 
    } finally { 
      setDeleteId(null); 
    }
  };

  const filtered = items.filter(s =>
    s.nome?.toLowerCase().includes(search.toLowerCase()) ||
    s.sigla?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title text-3xl font-bold tracking-tight">Secretarias</h1>
          <p className="page-subtitle text-sm text-muted-foreground">Gestão das unidades administrativas.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 h-10 px-5 font-bold shadow-sm">
          <Plus className="h-4 w-4" /> Nova Secretaria
        </Button>
      </div>

      <div className="border-accent/10 bg-accent/5 p-4 rounded-xl border shadow-sm">
        <div className="max-w-md space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Localizar Unidade</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input 
              className="w-full pl-9 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Buscar por nome ou sigla..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="flex gap-3 min-w-full px-1">
          <ColumnGroup title="Sigla" icon={<Tag className="h-3 w-3"/>} color="bg-slate-600" width="w-[110px]">
            {filtered.map((s) => (
              <Cell key={s.id_sec}>
                <span className="inline-flex items-center justify-center h-7 w-16 rounded bg-slate-100 text-slate-800 text-[10px] font-black border border-slate-200">
                  {s.sigla}
                </span>
              </Cell>
            ))}
          </ColumnGroup>

          <ColumnGroup title="Nome da Secretaria" icon={<Building2 className="h-3 w-3"/>} color="bg-indigo-600" width="flex-[3]">
            {filtered.map((s) => (
              <Cell key={s.id_sec} className="font-bold text-slate-900 justify-start text-left text-sm">
                {s.nome}
              </Cell>
            ))}
          </ColumnGroup>

          <ColumnGroup title="Ações" icon={<Settings className="h-3 w-3"/>} color="bg-slate-800" width="w-[170px]">
            {filtered.map((s) => (
              <Cell key={s.id_sec} className="gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleViewUsers(s)}
                  className="h-9 w-9 rounded-full text-emerald-600 hover:bg-emerald-50 border-emerald-100 shadow-sm"
                  title="Ver Usuários"
                >
                  <Users className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => openEdit(s)} 
                  className="h-9 w-9 rounded-full text-blue-600 hover:bg-blue-50 border-blue-100 shadow-sm"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setDeleteId(s.id_sec)} 
                  className="h-9 w-9 rounded-full text-destructive hover:bg-red-50 border-red-100 shadow-sm"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Cell>
            ))}
          </ColumnGroup>
        </div>
      </div>

      {/* MODAL DE USUÁRIOS */}
      <Dialog open={usersModalOpen} onOpenChange={setUsersModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Integrantes: {selectedSec?.sigla}
            </DialogTitle>
            <DialogDescription>Usuários cadastrados nesta unidade administrativa.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingUsers ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Buscando na base de dados...</p>
              </div>
            ) : usersList.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {usersList.map(user => (
                  <div key={user.id_usuario} className="p-3 border rounded-xl bg-slate-50/50 flex flex-col shadow-sm">
                    <span className="font-bold text-sm text-slate-800">{user.nome}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" /> {user.email}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
                <p className="text-sm">Nenhum usuário encontrado para esta secretaria.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setUsersModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CADASTRO / EDIÇÃO (COM E-MAIL) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Secretaria' : 'Nova Secretaria'}</DialogTitle>
            <DialogDescription>Atualize o nome, sigla e e-mail oficial.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider">Nome da Secretaria</Label>
              <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Ex: Secretaria de Saúde" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider">Sigla</Label>
              <Input value={form.sigla} onChange={e => setForm({...form, sigla: e.target.value.toUpperCase()})} maxLength={10} placeholder="Ex: SEMUSA" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider">E-mail de Contato</Label>
              <Input value={form.email_contato} onChange={e => setForm({...form, email_contato: e.target.value})} placeholder="email@secretaria.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DE EXCLUSÃO */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente excluir?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá permanentemente a secretaria do sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 border-none">Sim, Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}