import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === 'supervisor' || user.role === 'admin'
          ? '/supervisor/dashboard'
          : '/employee/dashboard';

      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      const session = await login(email, password);
      toast.success('Login realizado com sucesso.');

      const redirectPath =
        session.user.role === 'supervisor' || session.user.role === 'admin'
          ? '/supervisor/dashboard'
          : '/employee/dashboard';

      navigate(redirectPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(58,148,230,0.28)] border border-border/60">
                <img src="/labs.png" alt="Labs" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Reembolso Combustível Labs</h1>
              <p className="text-muted-foreground mt-2">
                Plataforma Labs para gestão de reembolso de combustível
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@crisdu.com.br"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm text-muted-foreground">Lembrar-me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-lg">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-[28px] bg-white/12 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
              <img src="/labs.png" alt="Labs" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white">
              Bem-vindo de volta!
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Gerencie seus reembolsos de forma simples e transparente
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
