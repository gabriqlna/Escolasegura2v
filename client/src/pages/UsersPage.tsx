import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, updateUserRole } from '@/lib/firebase';
import { USER_ROLES, type UserRole } from '@shared/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export default function UsersPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has admin permissions
  if (!user || !hasPermission('admin')) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem ver esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: 'Sucesso',
        description: 'Papel do usuário atualizado com sucesso.',
      });
      await loadUsers(); // Reload users
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar papel do usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      // TODO: Implement toggle active status
      console.log('Toggle active status for user:', userId, isActive);
      toast({
        title: 'Info',
        description: 'Funcionalidade em desenvolvimento.',
      });
    } catch (error) {
      console.error('Error toggling user active status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Direção';
      case 'staff':
        return 'Funcionário';
      case 'student':
        return 'Aluno';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-users">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie papéis e permissões dos usuários do sistema
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" data-testid="alert-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {users.map((userData) => (
          <Card key={userData.id} data-testid={`card-user-${userData.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" data-testid={`text-name-${userData.id}`}>
                        {userData.name}
                      </h3>
                      <Badge 
                        variant={getRoleBadgeVariant(userData.role)}
                        data-testid={`badge-role-${userData.id}`}
                      >
                        {getRoleLabel(userData.role)}
                      </Badge>
                      {userData.isActive ? (
                        <Badge variant="outline" className="text-green-600">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          <UserX className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-email-${userData.id}`}>
                      {userData.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Papel:</label>
                    <Select
                      value={userData.role}
                      onValueChange={(value) => handleRoleChange(userData.id, value as UserRole)}
                      data-testid={`select-role-${userData.id}`}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Aluno</SelectItem>
                        <SelectItem value="staff">Funcionário</SelectItem>
                        <SelectItem value="admin">Direção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant={userData.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(userData.id, !userData.isActive)}
                    data-testid={`button-toggle-active-${userData.id}`}
                  >
                    {userData.isActive ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}