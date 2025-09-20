import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDrillSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Drill = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date;
  type: string;
  createdBy: string;
  createdAt: Date;
};

export default function DrillsPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof insertDrillSchema>>({
    resolver: zodResolver(insertDrillSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "evacuation",
      scheduledDate: new Date(),
    },
  });

  const { data: allDrills = [], isLoading } = useQuery<Drill[]>({
    queryKey: ["/api/drills"],
  });

  const { data: upcomingDrills = [] } = useQuery<Drill[]>({
    queryKey: ["/api/drills/upcoming"],
  });

  const createDrillMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertDrillSchema>) =>
      apiRequest("POST", "/api/drills", {
        ...data,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drills/upcoming"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Simulação agendada",
        description: "A simulação foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar simulação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertDrillSchema>) => {
    createDrillMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fire":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "earthquake":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "evacuation":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fire":
        return "Incêndio";
      case "earthquake":
        return "Terremoto";
      case "evacuation":
        return "Evacuação";
      default:
        return "Outro";
    }
  };

  const isPastDrill = (date: Date) => new Date(date) < new Date();

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
        <h1 className="text-3xl font-bold tracking-tight">Simulações de Emergência</h1>
        <p className="text-muted-foreground">
          Planejamento e execução de exercícios de segurança escolar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Simulações</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDrills.length}</div>
            <p className="text-xs text-muted-foreground">
              Agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Simulações</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDrills.length}</div>
            <p className="text-xs text-muted-foreground">
              Registradas no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Simulações</h2>
        {hasPermission(["staff", "admin"]) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-drill">
                <Plus className="mr-2 h-4 w-4" />
                Agendar Simulação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agendar Nova Simulação</DialogTitle>
                <DialogDescription>
                  Crie uma nova simulação de emergência para treinar a equipe e alunos.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Simulação</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-drill-title"
                            placeholder="Ex: Simulação de Evacuação - Bloco A" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Simulação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-drill-type">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="evacuation">Evacuação</SelectItem>
                            <SelectItem value="fire">Incêndio</SelectItem>
                            <SelectItem value="earthquake">Terremoto</SelectItem>
                            <SelectItem value="security">Segurança</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data e Hora</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                data-testid="button-drill-date"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP 'às' HH:mm", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Agende para uma data futura
                        </FormDescription>
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
                            data-testid="input-drill-description"
                            placeholder="Descreva os objetivos e procedimentos da simulação"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Detalhes sobre a simulação e instruções especiais
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-drill"
                      disabled={createDrillMutation.isPending}
                    >
                      {createDrillMutation.isPending ? "Agendando..." : "Agendar"}
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

      <Card>
        <CardHeader>
          <CardTitle>Próximas Simulações</CardTitle>
          <CardDescription>
            Simulações agendadas para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDrills.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma simulação agendada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDrills.map((drill: Drill) => (
                <div 
                  key={drill.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(drill.type)}
                    <div>
                      <h4 className="font-medium">{drill.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(drill.scheduledDate), "PPP 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    data-testid={`type-drill-${drill.id}`}
                  >
                    {getTypeLabel(drill.type)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Simulações</CardTitle>
          <CardDescription>
            Todas as simulações registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Agendada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDrills.map((drill: Drill) => (
                <TableRow key={drill.id}>
                  <TableCell className="font-medium">{drill.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(drill.type)}
                      <span>{getTypeLabel(drill.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(drill.scheduledDate), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={isPastDrill(drill.scheduledDate) ? "secondary" : "default"}
                      data-testid={`status-drill-${drill.id}`}
                    >
                      {isPastDrill(drill.scheduledDate) ? "Realizada" : "Agendada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {drill.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}