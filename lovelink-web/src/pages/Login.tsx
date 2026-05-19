import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi, secretariasApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Loader2 } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [perfil, setPerfil] = useState('');
  const [idSecretaria, setIdSecretaria] = useState('');
  const [secretarias, setSecretarias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Cor principal do seu Dashboard
  const primaryColor = '#1B2232';

  useEffect(() => {
    if (isRegister) {
      secretariasApi.list().then(res => setSecretarias(res.data)).catch(() => {});
    }
  }, [isRegister]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(email, senha);
      login(data.user);
      toast.success(`Bem-vindo(a), ${data.user.nome}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({
        nome, email, senha, perfil,
        id_secretaria: idSecretaria ? parseInt(idSecretaria) : null,
      });
      toast.success('Cadastro realizado! Faça login.');
      setIsRegister(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background font-sans">
      {/* CSS para a animação de piscar (Glow) */}
      <style>{`
        @keyframes border-glow {
          0% { box-shadow: 0 0 5px rgba(27, 34, 50, 0.2); border-color: rgba(27, 34, 50, 0.3); }
          50% { box-shadow: 0 0 20px rgba(27, 34, 50, 0.6); border-color: rgba(27, 34, 50, 1); }
          100% { box-shadow: 0 0 5px rgba(27, 34, 50, 0.2); border-color: rgba(27, 34, 50, 0.3); }
        }
        .animate-glow {
          animation: border-glow 2.5s infinite ease-in-out;
          border: 1px solid;
        }
      `}</style>

      {/* LADO ESQUERDO: IMAGEM E LOGO */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <img 
          src="/img_login.jpg" 
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 z-0" 
        />
        <div 
          className="absolute inset-0 z-10" 
          style={{ background: `linear-gradient(to top, ${primaryColor}, transparent)` }}
        />
        
        <div className="relative z-20 flex items-center gap-4 font-bold">
          <div className="bg-white p-2.5 rounded-xl shadow-2xl">
            <Building2 className="h-10 w-10" style={{ color: primaryColor }} />
          </div>
          <span className="drop-shadow-md tracking-tighter text-4xl uppercase font-black">
            SALA DE SITUAÇÃO
          </span>
        </div>

        <div className="relative z-20 mt-auto mb-16"> {/* mt-auto empurra para baixo, mb-16 afasta do rodapé */}
  <h2 className="text-3xl font-bold leading-tight drop-shadow-lg text-white">
    Gestão Estratégica <br /> 
    <span className="opacity-50 font-light italic text-base">Monitoramento em tempo real</span>
  </h2>
</div>

<div className="relative z-20 text-sm opacity-40">
  © 2026 Sistema de Gestão Municipal
</div>
        
        
      </div>

      {/* LADO DIREITO: FORMULÁRIO COM EFEITO PISCANDO */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] p-8 rounded-3xl bg-card animate-glow space-y-8">
          
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: primaryColor }}>
              {isRegister ? 'Criar uma conta' : 'Conecte-se à sua conta'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRegister ? 'Preencha os campos para solicitar acesso.' : 'Identifique-se para acessar as informações.'}
            </p>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5">
            {isRegister && (
              <div className="space-y-1.5 text-left">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)} required className="h-11 shadow-sm" />
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <Label htmlFor="email">E-mail </Label>
              <Input id="email" type="email" placeholder="nome@prefeitura.gov.br" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 shadow-sm" />
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required className="h-11 shadow-sm" />
            </div>

            {isRegister && (
              <>
                <div className="space-y-1.5 text-left">
                  <Label>Perfil de Acesso</Label>
                  <Select value={perfil} onValueChange={setPerfil}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefeita">Gestora (Prefeita)</SelectItem>
                      <SelectItem value="secretario">Secretário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {perfil === 'secretario' && (
                  <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-1">
                    <Label>Secretaria Responsável</Label>
                    <Select value={idSecretaria} onValueChange={setIdSecretaria}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Escolha a pasta" /></SelectTrigger>
                      <SelectContent>
                        {secretarias.map(s => (
                          <SelectItem key={s.id_sec} value={s.id_sec.toString()}>
                            {s.sigla} - {s.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <Button 
              className="w-full h-12 text-white font-bold text-lg shadow-xl transition-all hover:brightness-125 active:scale-95" 
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegister ? 'Cadastre-se' : 'Entrar no Sistema')}
            </Button>
          </form>

          <div className="text-center pt-2">
            <button 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-sm font-medium hover:underline underline-offset-4"
              style={{ color: primaryColor }}
            >
              {isRegister ? '← Voltar para o Login' : 'Ainda não tem acesso? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}