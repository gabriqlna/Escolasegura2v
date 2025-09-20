import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { addDocument } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Send, Lock } from 'lucide-react';

const reportSchema = z.object({
  type: z.enum(['bullying', 'fight', 'theft', 'vandalism', 'other'], {
    required_error: 'Selecione o tipo de ocorrência',
  }),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  location: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  onSuccess?: () => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      isAnonymous: false,
    },
  });

  const watchedType = watch('type');
  const watchedIsAnonymous = watch('isAnonymous');

  const reportTypes = {
    bullying: 'Bullying',
    fight: 'Briga/Agressão',
    theft: 'Furto/Roubo',
    vandalism: 'Vandalismo',
    other: 'Outros',
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const reportData = {
        type: data.type,
        description: data.description,
        location: data.location || '',
        isAnonymous: data.isAnonymous,
        reporterId: data.isAnonymous ? null : user.id,
        status: 'pending',
      };

      await addDocument('reports', reportData);
      
      setSuccess(true);
      reset();
      
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error submitting report:', error);
      setError('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'bullying':
        return 'Intimidação, humilhação ou agressão psicológica';
      case 'fight':
        return 'Confronto físico ou agressão entre pessoas';
      case 'theft':
        return 'Subtração de objetos ou pertences';
      case 'vandalism':
        return 'Danos ao patrimônio ou instalações';
      case 'other':
        return 'Outras situações que comprometem a segurança';
      default:
        return '';
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto" data-testid="card-report-success">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit mx-auto">
              <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Denúncia Enviada com Sucesso!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {watchedIsAnonymous 
                  ? 'Sua denúncia anônima foi registrada e será analisada pela direção.'
                  : 'Sua denúncia foi registrada e você pode acompanhar o status no histórico.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="card-report-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Reportar Incidente
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use este formulário para reportar qualquer situação que comprometa a segurança na escola.
          Sua denúncia será tratada com seriedade e confidencialidade.
        </p>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6" data-testid="alert-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="anonymous" className="text-sm font-medium">
                  Denúncia Anônima
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sua identidade será mantida em sigilo
                </p>
              </div>
            </div>
            <Switch
              id="anonymous"
              checked={watchedIsAnonymous}
              onCheckedChange={(checked) => setValue('isAnonymous', checked)}
              data-testid="switch-anonymous"
            />
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Ocorrência *</Label>
            <Select onValueChange={(value) => setValue('type', value as any)}>
              <SelectTrigger data-testid="select-type">
                <SelectValue placeholder="Selecione o tipo de ocorrência" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {watchedType && (
              <p className="text-xs text-muted-foreground">
                {getTypeDescription(watchedType)}
              </p>
            )}
            {errors.type && (
              <p className="text-sm text-destructive" data-testid="error-type">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Local (Opcional)</Label>
            <Input
              id="location"
              type="text"
              placeholder="Ex: Pátio, Sala 12, Corredor do 2º andar..."
              data-testid="input-location"
              {...register('location')}
            />
            <p className="text-xs text-muted-foreground">
              Informe onde ocorreu o incidente para facilitar a investigação
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada *</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente o que aconteceu, quando, quem estava envolvido..."
              className="min-h-[120px]"
              data-testid="textarea-description"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive" data-testid="error-description">
                {errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Quanto mais detalhes você fornecer, melhor poderemos investigar e resolver a situação
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              {watchedIsAnonymous ? 'Proteção de Anonimato' : 'Proteção de Dados'}
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {watchedIsAnonymous 
                ? 'Sua identidade será completamente protegida. Nenhuma informação pessoal será associada a esta denúncia.'
                : 'Suas informações pessoais serão mantidas em sigilo e usadas apenas para investigação e contato se necessário.'
              }
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="button-submit-report"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {watchedIsAnonymous ? 'Enviar Anonimamente' : 'Enviar Denúncia'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}