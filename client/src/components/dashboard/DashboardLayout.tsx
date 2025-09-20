import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { USER_ROLES } from '@shared/schema';
import { 
  Home,
  AlertTriangle,
  Shield,
  Map,
  Camera,
  Bell,
  Phone,
  Users,
  FileText,
  CheckSquare,
  Calendar,
  BookOpen,
  Settings,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, hasPermission } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    {
      title: 'Principal',
      items: [
        { title: 'Dashboard', url: '/', icon: Home, roles: ['student', 'staff', 'admin'] },
        { title: 'Denunciar', url: '/reports', icon: AlertTriangle, roles: ['student', 'staff', 'admin'] },
        { title: 'Anti-Bullying', url: '/bullying', icon: Shield, roles: ['student', 'staff', 'admin'] },
        { title: 'Emergência', url: '/emergency', icon: AlertCircle, roles: ['student', 'staff', 'admin'] },
      ]
    },
    {
      title: 'Informações',
      items: [
        { title: 'Avisos Urgentes', url: '/notices', icon: Bell, roles: ['student', 'staff', 'admin'] },
        { title: 'Plano Evacuação', url: '/evacuation', icon: Map, roles: ['student', 'staff', 'admin'] },
        { title: 'Campanhas', url: '/campaigns', icon: BookOpen, roles: ['student', 'staff', 'admin'] },
        { title: 'Contatos Úteis', url: '/contacts', icon: Phone, roles: ['student', 'staff', 'admin'] },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { title: 'Visitantes', url: '/visitors', icon: Users, roles: ['staff', 'admin'] },
        { title: 'Ocorrências', url: '/occurrences', icon: FileText, roles: ['staff', 'admin'] },
        { title: 'Vigilância', url: '/surveillance', icon: Camera, roles: ['staff', 'admin'] },
        { title: 'Checklist', url: '/checklist', icon: CheckSquare, roles: ['staff', 'admin'] },
        { title: 'Simulados', url: '/drills', icon: Calendar, roles: ['staff', 'admin'] },
      ]
    },
    {
      title: 'Administração',
      items: [
        { title: 'Gerenciar Usuários', url: '/users', icon: Users, roles: ['admin'] },
        { title: 'Relatórios', url: '/admin/reports', icon: FileText, roles: ['admin'] },
      ]
    },
  ];

  const filteredNavigation = navigationItems.map(section => ({
    ...section,
    items: section.items.filter(item => 
      hasPermission(item.roles as any)
    )
  })).filter(section => section.items.length > 0);

  const sidebarStyle = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Escola Segura</h2>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role === USER_ROLES.ADMIN ? 'Direção' : 
                   user?.role === USER_ROLES.STAFF ? 'Funcionário' : 'Aluno'}
                </p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 overflow-auto">
            {filteredNavigation.map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          
          <SidebarFooter className="border-t p-4">
            <div className="space-y-2">
              <div className="text-sm">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            
            <div className="flex items-center gap-4">
              {/* Emergency button - always visible */}
              <Link href="/emergency">
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="gap-2"
                  data-testid="button-emergency-header"
                >
                  <AlertCircle className="h-4 w-4" />
                  Emergência
                </Button>
              </Link>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}