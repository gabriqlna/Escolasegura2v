import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserReports, useAllReports, useUpdateReportStatus } from '@/hooks/useReports';
import ReportForm from '@/components/reports/ReportForm';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Plus, AlertTriangle, Clock, CheckCircle, XCircle, Lock } from 'lucide-react';
import { Link } from 'wouter';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('new');
  const { user, hasPermission } = useAuth();
  
  // Fetch reports data
  const { data: userReports = [], isLoading: userReportsLoading } = useUserReports();
  const { data: allReports = [], isLoading: allReportsLoading } = useAllReports();
  const updateReportStatus = useUpdateReportStatus();


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" />Analisando</Badge>;
      case 'resolved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Resolvido</Badge>;
      default:
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Indefinido</Badge>;
    }
  };

  const getTypeLabel = (category: string) => {
    const types: Record<string, string> = {
      bullying: 'Bullying',
      fight: 'Briga/Agressão',
      theft: 'Furto/Roubo',
      vandalism: 'Vandalismo',
      drugs: 'Drogas',
      weapons: 'Armas',
      other: 'Outros',
    };
    return types[category] || category;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não disponível';
    
    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleReportSuccess = () => {
    setActiveTab('history');
  };
  
  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      await updateReportStatus.mutateAsync({ reportId, status: newStatus });
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Sistema de Denúncias</h1>
            <p className="text-muted-foreground">
              Reporte incidentes e acompanhe o status das suas denúncias
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="gap-2" data-testid="tab-new-report">
            <Plus className="h-4 w-4" />
            Nova Denúncia
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="tab-my-reports">
            <History className="h-4 w-4" />
            Minhas Denúncias
          </TabsTrigger>
          {hasPermission(['admin']) && (
            <TabsTrigger value="all" className="gap-2" data-testid="tab-all-reports">
              <AlertTriangle className="h-4 w-4" />
              Todas as Denúncias
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <ReportForm onSuccess={handleReportSuccess} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card data-testid="card-my-reports">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Minhas Denúncias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userReportsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Carregando suas denúncias...</p>
                </div>
              ) : userReports.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma denúncia encontrada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você ainda não fez nenhuma denúncia.
                  </p>
                  <Button onClick={() => setActiveTab('new')} data-testid="button-create-first-report">
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Primeira Denúncia
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`report-item-${report.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{getTypeLabel(report.category)}</Badge>
                          {getStatusBadge(report.status)}
                          {report.isAnonymous && (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Anônimo
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(report.timestamp)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                        {report.location && (
                          <p className="text-xs text-muted-foreground">
                            📍 {report.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasPermission(['admin']) && (
          <TabsContent value="all" className="mt-6">
            <Card data-testid="card-all-reports">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Todas as Denúncias
                  <Badge variant="secondary">{allReports.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Painel administrativo para acompanhar todas as denúncias da escola
                </p>
              </CardHeader>
              <CardContent>
                {allReportsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Carregando todas as denúncias...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`admin-report-item-${report.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{getTypeLabel(report.category)}</Badge>
                          {getStatusBadge(report.status)}
                          {report.isAnonymous && (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Anônimo
                            </Badge>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>{formatDate(report.timestamp)}</div>
                          <div className="mt-1">
                            {report.isAnonymous ? 'Anônimo' : 'Usuário identificado'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                        {report.location && (
                          <p className="text-xs text-muted-foreground">
                            📍 {report.location}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" data-testid={`button-view-${report.id}`}>
                          Ver Detalhes
                        </Button>
                        {report.status === 'pending' && (
                          <Button 
                            size="sm" 
                            data-testid={`button-review-${report.id}`}
                            onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                            disabled={updateReportStatus.isPending}
                          >
                            Marcar como Analisado
                          </Button>
                        )}
                        {report.status === 'reviewed' && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            data-testid={`button-resolve-${report.id}`}
                            onClick={() => handleStatusUpdate(report.id, 'resolved')}
                            disabled={updateReportStatus.isPending}
                          >
                            Marcar como Resolvido
                          </Button>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}