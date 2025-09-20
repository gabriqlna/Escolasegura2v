import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { USER_ROLES } from '@shared/schema';
import { 
  AlertTriangle, 
  Shield, 
  Bell, 
  Users, 
  FileText, 
  CheckSquare,
  Calendar,
  TrendingUp,
  Activity,
  Eye,
  Phone
} from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();

  // Mock data - TODO: replace with real data from API
  const mockStats = {
    totalReports: 12,
    pendingReports: 3,
    activeVisitors: 5,
    completedChecklist: 8,
    totalChecklistItems: 12,
    upcomingDrills: 2,
    activeNotices: 1,
  };

  const quickActions = [
    {
      title: 'Reportar Incidente',
      description: 'Enviar nova denúncia',
      icon: AlertTriangle,
      href: '/reports',
      variant: 'default' as const,
      roles: ['student', 'staff', 'admin'],
    },
    {
      title: 'Canal Anti-Bullying',
      description: 'Relatar anonimamente',
      icon: Shield,
      href: '/bullying',
      variant: 'secondary' as const,
      roles: ['student', 'staff', 'admin'],
    },
    {
      title: 'Registrar Visitante',
      description: 'Novo check-in',
      icon: Users,
      href: '/visitors',
      variant: 'outline' as const,
      roles: ['staff', 'admin'],
    },
    {
      title: 'Adicionar Ocorrência',
      description: 'Registrar evento',
      icon: FileText,
      href: '/occurrences',
      variant: 'outline' as const,
      roles: ['staff', 'admin'],
    },
  ];

  const filteredQuickActions = quickActions.filter(action =>
    hasPermission(action.roles as any)
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-welcome">
          Bem-vindo, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Sistema de Segurança Escolar - {' '}
          <Badge variant="secondary" className="capitalize">
            {user?.role === USER_ROLES.ADMIN ? 'Direção' : 
             user?.role === USER_ROLES.STAFF ? 'Funcionário' : 'Aluno'}
          </Badge>
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-reports">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.pendingReports} pendentes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-visitors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeVisitors}</div>
            <p className="text-xs text-muted-foreground">
              no campus agora
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-checklist-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checklist Segurança</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.completedChecklist}/{mockStats.totalChecklistItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mockStats.completedChecklist / mockStats.totalChecklistItems) * 100)}% completo
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-drills">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Simulados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.upcomingDrills}</div>
            <p className="text-xs text-muted-foreground">
              nesta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {filteredQuickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-center gap-2 w-full hover-elevate"
                  data-testid={`button-${action.title.toLowerCase().replace(/\\s+/g, '-')}`}
                >
                  <action.icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Notices */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Notices */}
        {mockStats.activeNotices > 0 && (
          <Card className="border-orange-200 dark:border-orange-800" data-testid="card-active-notices">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Bell className="h-5 w-5" />
                Avisos Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock notice - TODO: replace with real data */}
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <p className="text-sm font-medium">Simulado de evacuação</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Amanhã às 10h - Todos devem participar
                  </p>
                </div>
                <Link href="/notices">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todos os avisos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card data-testid="card-system-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Câmeras de Vigilância</span>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sistema de Notificações</span>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conexões de Emergência</span>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Disponível
                </Badge>
              </div>
              <Link href="/contacts">
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Phone className="h-4 w-4 mr-2" />
                  Contatos de Emergência
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}