import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, BookOpen, Users, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type Campaign = {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
};

export default function CampaignsPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const form = useForm<z.infer<typeof insertCampaignSchema>>({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
    },
  });

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertCampaignSchema>) =>
      apiRequest("POST", "/api/campaigns", {
        ...data,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Campanha criada",
        description: "A campanha educativa foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar campanha.",
        variant: "destructive",
      });
    },
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/campaigns/${id}`, {
        isActive,
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campanha atualizada",
        description: "O status da campanha foi alterado.",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertCampaignSchema>) => {
    createCampaignMutation.mutate(data);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "digital_safety":
        return "Segurança Digital";
      case "traffic_education":
        return "Educação no Trânsito";
      case "general":
        return "Geral";
      default:
        return "Outro";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "digital_safety":
        return "bg-blue-100 text-blue-800";
      case "traffic_education":
        return "bg-green-100 text-green-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Campanhas Educativas</h1>
        <p className="text-muted-foreground">
          Conteúdo educativo sobre segurança, cidadania e bem-estar para a comunidade escolar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c: Campaign) => c.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Em exibição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              Campanhas criadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campanhas</h2>
        {hasPermission(["staff", "admin"]) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-campaign">
                <Plus className="mr-2 h-4 w-4" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha Educativa</DialogTitle>
                <DialogDescription>
                  Crie conteúdo educativo para informar e conscientizar a comunidade escolar.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Campanha</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-campaign-title"
                            placeholder="Ex: Uso Responsável da Internet" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-campaign-category">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">Geral</SelectItem>
                            <SelectItem value="digital_safety">Segurança Digital</SelectItem>
                            <SelectItem value="traffic_education">Educação no Trânsito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conteúdo</FormLabel>
                        <FormControl>
                          <Textarea 
                            data-testid="input-campaign-content"
                            placeholder="Descreva o conteúdo da campanha educativa"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Texto informativo e educativo sobre o tema escolhido
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-campaign"
                      disabled={createCampaignMutation.isPending}
                    >
                      {createCampaignMutation.isPending ? "Criando..." : "Criar Campanha"}
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign: Campaign) => (
          <Card key={campaign.id} className={campaign.isActive ? "border-green-200" : "border-gray-200"}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={getCategoryColor(campaign.category)}
                      data-testid={`category-${campaign.id}`}
                    >
                      {getCategoryLabel(campaign.category)}
                    </Badge>
                    <Badge 
                      variant={campaign.isActive ? "default" : "secondary"}
                      data-testid={`status-${campaign.id}`}
                    >
                      {campaign.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{campaign.title}</CardTitle>
                  <CardDescription>
                    Criada em {format(new Date(campaign.createdAt), "dd/MM/yyyy")}
                  </CardDescription>
                </div>
                {hasPermission(["staff", "admin"]) && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-toggle-${campaign.id}`}
                      onClick={() => toggleCampaignMutation.mutate({
                        id: campaign.id,
                        isActive: !campaign.isActive
                      })}
                      disabled={toggleCampaignMutation.isPending}
                    >
                      {campaign.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {campaign.content}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 p-0 h-auto font-normal"
                onClick={() => setSelectedCampaign(campaign)}
                data-testid={`button-view-${campaign.id}`}
              >
                Ler mais →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-muted-foreground text-center">
              Crie campanhas educativas para informar e conscientizar a comunidade escolar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de visualização detalhada */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(selectedCampaign?.category || "")}>
                {getCategoryLabel(selectedCampaign?.category || "")}
              </Badge>
              <Badge variant={selectedCampaign?.isActive ? "default" : "secondary"}>
                {selectedCampaign?.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <DialogTitle>{selectedCampaign?.title}</DialogTitle>
            <DialogDescription>
              Criada em {selectedCampaign && format(new Date(selectedCampaign.createdAt), "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {selectedCampaign?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}