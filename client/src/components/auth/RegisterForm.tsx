import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES, type UserRole } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'staff', 'admin'] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export default function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { initializeUser } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await signUp(data.email, data.password, data.name);
      
      // Initialize user document in Firestore
      await initializeUser(userCredential.user, {
        name: data.name,
        role: data.role as UserRole,
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'student':
        return 'Aluno - Pode reportar incidents e ver informações de segurança';
      case 'staff':
        return 'Funcionário - Acesso completo a registros e gerenciamento';
      case 'admin':
        return 'Direção - Acesso total incluindo administração de usuários';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-register">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cadastre-se no sistema de segurança escolar
        </p>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4" data-testid="alert-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              data-testid="input-name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive" data-testid="error-name">
                {errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@escola.com"
              data-testid="input-email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive" data-testid="error-email">
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select onValueChange={(value) => setValue('role', value as UserRole)} defaultValue="student">
              <SelectTrigger data-testid="select-role">
                <SelectValue placeholder="Selecione seu tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Aluno</SelectItem>
                <SelectItem value="staff">Funcionário</SelectItem>
                <SelectItem value="admin">Direção</SelectItem>
              </SelectContent>
            </Select>
            {watchedRole && (
              <p className="text-xs text-muted-foreground">
                {getRoleDescription(watchedRole)}
              </p>
            )}
            {errors.role && (
              <p className="text-sm text-destructive" data-testid="error-role">
                {errors.role.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                data-testid="input-password"
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive" data-testid="error-password">
                {errors.password.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                data-testid="input-confirm-password"
                {...register('confirmPassword')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive" data-testid="error-confirm-password">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="button-register"
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
        
        {onLoginClick && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem conta?{' '}
              <button
                type="button"
                className="text-primary hover:underline font-normal"
                onClick={onLoginClick}
                data-testid="button-login-link"
              >
                Entre aqui
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}