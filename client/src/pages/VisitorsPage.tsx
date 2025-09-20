import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitorSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { UserPlus, LogOut, Users, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type Visitor = {
  id: string;
  name: string;
  document: string;
  purpose: string;
  entryTime: Date;
  exitTime: Date | null;
  registeredBy: string;
};

export default function VisitorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof insertVisitorSchema>>({
    resolver: zodResolver(insertVisitorSchema),
    defaultValues: {
      name: "",
      document: "",
      purpose: "",
    },
  });

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors"],
  });

  const { data: activeVisitors = [] } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors/active"],
  });

  const addVisitorMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertVisitorSchema>) =>
      apiRequest("POST", "/api/visitors", {
        ...data,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/active"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Visitante registrado",
        description: "O visitante foi registrado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao registrar visitante.",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (visitorId: string) =>
      apiRequest("PATCH", `/api/visitors/${visitorId}/checkout`, {
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/active"] });
      toast({
        title: "Check-out realizado",
        description: "O visitante foi registrado como saído.",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertVisitorSchema>) => {
    addVisitorMutation.mutate(data);
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
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Visitantes</h1>
        <p className="text-muted-foreground">
          Controle de entrada e saída de visitantes na escola.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVisitors.length}</div>
            <p className="text-xs text-muted-foreground">
              Atualmente na escola
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoje</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitors.filter((v: Visitor) => 
                new Date(v.entryTime).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Visitantes registrados hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Visitantes Ativos</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-visitor">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Novo Visitante</DialogTitle>
              <DialogDescription>
                Preencha as informações do visitante para realizar o check-in.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-visitor-name"
                          placeholder="Nome do visitante" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-visitor-document"
                          placeholder="CPF, RG ou outro documento" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propósito da Visita</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="input-visitor-purpose"
                          placeholder="Descreva o motivo da visita"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ex: Reunião com professor, entrega de documentos, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    data-testid="button-submit-visitor"
                    disabled={addVisitorMutation.isPending}
                  >
                    {addVisitorMutation.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitantes Ativos na Escola</CardTitle>
          <CardDescription>
            Visitantes que realizaram check-in e ainda não saíram
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeVisitors.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum visitante ativo no momento</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Propósito</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeVisitors.map((visitor: Visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.name}</TableCell>
                    <TableCell>{visitor.document}</TableCell>
                    <TableCell>{visitor.purpose}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(visitor.entryTime), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-checkout-${visitor.id}`}
                        onClick={() => checkoutMutation.mutate(visitor.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        <LogOut className="mr-1 h-3 w-3" />
                        Check-out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Visitantes</CardTitle>
          <CardDescription>
            Todos os visitantes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Propósito</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((visitor: Visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell className="font-medium">{visitor.name}</TableCell>
                  <TableCell>{visitor.document}</TableCell>
                  <TableCell>{visitor.purpose}</TableCell>
                  <TableCell>
                    {format(new Date(visitor.entryTime), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {visitor.exitTime 
                      ? format(new Date(visitor.exitTime), "dd/MM/yyyy HH:mm")
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={visitor.exitTime ? "secondary" : "default"}
                      data-testid={`status-visitor-${visitor.id}`}
                    >
                      {visitor.exitTime ? "Saiu" : "Na escola"}
                    </Badge>
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