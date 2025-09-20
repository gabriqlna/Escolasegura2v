import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmergencyAlertSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { AlertTriangle, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type EmergencyAlert = {
  id: string;
  message: string;
  location: string | null;
  triggeredBy: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

export default function EmergencyPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof insertEmergencyAlertSchema>>({
    resolver: zodResolver(insertEmergencyAlertSchema),
    defaultValues: {
      message: "",
      location: "",
    },
  });

  const { data: activeAlerts = [], isLoading } = useQuery<EmergencyAlert[]>({
    queryKey: ["/api/emergency-alerts"],
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertEmergencyAlertSchema>) =>
      apiRequest("POST", "/api/emergency-alerts", {
        ...data,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Alerta de emergência criado",
        description: "O alerta foi enviado para toda a escola.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar alerta de emergência.",
        variant: "destructive",
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest("PATCH", `/api/emergency-alerts/${alertId}/resolve`, {
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts"] });
      toast({
        title: "Alerta resolvido",
        description: "O alerta de emergência foi marcado como resolvido.",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertEmergencyAlertSchema>) => {
    createAlertMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emergências</h1>
        <p className="text-muted-foreground">
          Sistema de alertas e gerenciamento de emergências escolares.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Situações em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeAlerts.length === 0 ? "OK" : "ALERTA"}
            </div>
            <p className="text-xs text-muted-foreground">
              Status do sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {activeAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Alertas de Emergência Ativos</AlertTitle>
          <AlertDescription className="text-red-700">
            Existem {activeAlerts.length} alerta(s) de emergência ativo(s) que requerem atenção imediata.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Alertas de Emergência</h2>
        {hasPermission(["staff", "admin"]) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                data-testid="button-create-emergency"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Novo Alerta de Emergência
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-red-600">Criar Alerta de Emergência</DialogTitle>
                <DialogDescription>
                  Este alerta será enviado imediatamente para toda a escola. Use apenas para situações reais de emergência.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem de Emergência</FormLabel>
                        <FormControl>
                          <Textarea 
                            data-testid="input-emergency-message"
                            placeholder="Descreva a situação de emergência" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Seja claro e objetivo sobre a natureza da emergência.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-emergency-location"
                            placeholder="Ex: Bloco A, Sala 205" 
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Especifique onde ocorreu a emergência, se aplicável.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Confirme que esta é uma situação real de emergência antes de continuar.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      variant="destructive"
                      data-testid="button-submit-emergency"
                      disabled={createAlertMutation.isPending}
                    >
                      {createAlertMutation.isPending ? "Enviando..." : "Enviar Alerta"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                Nenhuma Emergência Ativa
              </h3>
              <p className="text-muted-foreground text-center">
                O sistema está funcionando normalmente. Não há alertas de emergência ativos no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          activeAlerts.map((alert: EmergencyAlert) => (
            <Card key={alert.id} className="border-red-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-red-700">Alerta de Emergência</CardTitle>
                      <Badge variant="destructive" data-testid={`status-alert-${alert.id}`}>
                        Ativo
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600">
                      Criado em {format(new Date(alert.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      {alert.location && ` • ${alert.location}`}
                    </CardDescription>
                  </div>
                  {hasPermission(["staff", "admin"]) && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-resolve-${alert.id}`}
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Resolver
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 font-medium">{alert.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Emergência</CardTitle>
          <CardDescription>
            Procedimentos padrão em caso de emergência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                Incêndio
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ativar o alarme de incêndio</li>
                <li>• Evacuar o prédio pela rota mais próxima</li>
                <li>• Dirigir-se ao ponto de encontro</li>
                <li>• Aguardar instruções do corpo de bombeiros</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Shield className="mr-2 h-4 w-4 text-blue-500" />
                Segurança
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Trancar portas e janelas</li>
                <li>• Manter silêncio</li>
                <li>• Aguardar instruções da equipe</li>
                <li>• Não sair até receber autorização</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}