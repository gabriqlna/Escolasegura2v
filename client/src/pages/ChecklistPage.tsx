import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChecklistItemSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, CheckCircle, Circle, Clock, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type ChecklistItem = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  createdAt: Date;
};

export default function ChecklistPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof insertChecklistItemSchema>>({
    resolver: zodResolver(insertChecklistItemSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const { data: checklistItems = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/checklist"],
  });

  const createItemMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertChecklistItemSchema>) =>
      apiRequest("POST", "/api/checklist", {
        ...data,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Item adicionado",
        description: "Item de checklist criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar item de checklist.",
        variant: "destructive",
      });
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      apiRequest("PATCH", `/api/checklist/${id}`, {
        isCompleted,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      toast({
        title: "Item atualizado",
        description: "Status do item foi alterado.",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertChecklistItemSchema>) => {
    createItemMutation.mutate(data);
  };

  const handleToggleItem = (item: ChecklistItem) => {
    toggleItemMutation.mutate({
      id: item.id,
      isCompleted: !item.isCompleted
    });
  };

  const completedItems = checklistItems.filter((item: ChecklistItem) => item.isCompleted);
  const pendingItems = checklistItems.filter((item: ChecklistItem) => !item.isCompleted);
  const completionRate = checklistItems.length > 0 
    ? Math.round((completedItems.length / checklistItems.length) * 100) 
    : 0;

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
        <h1 className="text-3xl font-bold tracking-tight">Checklist de Segurança</h1>
        <p className="text-muted-foreground">
          Lista de verificação para garantir que todos os protocolos de segurança estejam sendo seguidos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conclusão</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Itens completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedItems.length}</div>
            <p className="text-xs text-muted-foreground">
              De {checklistItems.length} itens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando verificação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checklistItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Itens de segurança
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Itens de Verificação</h2>
        {hasPermission(["staff", "admin"]) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-checklist-item">
                <Plus className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Item ao Checklist</DialogTitle>
                <DialogDescription>
                  Crie um novo item de verificação de segurança.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Item</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-checklist-title"
                            placeholder="Ex: Verificar extintores de incêndio" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            data-testid="input-checklist-description"
                            placeholder="Descreva detalhes sobre a verificação"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Instruções detalhadas sobre como realizar a verificação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-checklist-item"
                      disabled={createItemMutation.isPending}
                    >
                      {createItemMutation.isPending ? "Adicionando..." : "Adicionar"}
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

      {checklistItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum item de checklist
            </h3>
            <p className="text-muted-foreground text-center">
              Adicione itens de verificação para garantir a segurança da escola.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Itens Pendentes
                </CardTitle>
                <CardDescription>
                  Itens que ainda precisam ser verificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingItems.map((item: ChecklistItem) => (
                    <div 
                      key={item.id} 
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={item.isCompleted}
                        onCheckedChange={() => handleToggleItem(item)}
                        disabled={toggleItemMutation.isPending}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Criado em {format(new Date(item.createdAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" data-testid={`status-${item.id}`}>
                        Pendente
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {completedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Itens Completados
                </CardTitle>
                <CardDescription>
                  Itens que já foram verificados e aprovados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedItems.map((item: ChecklistItem) => (
                    <div 
                      key={item.id} 
                      className="flex items-start space-x-3 p-3 border rounded-lg bg-green-50 border-green-200"
                    >
                      <Checkbox
                        checked={item.isCompleted}
                        onCheckedChange={() => handleToggleItem(item)}
                        disabled={toggleItemMutation.isPending}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium line-through text-green-700">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-green-600 line-through">
                            {item.description}
                          </p>
                        )}
                        <div className="text-xs text-green-600">
                          <p>Criado em {format(new Date(item.createdAt), "dd/MM/yyyy")}</p>
                          {item.completedAt && (
                            <p>Completado em {format(new Date(item.completedAt), "dd/MM/yyyy 'às' HH:mm")}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800" data-testid={`status-${item.id}`}>
                        Completado
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}