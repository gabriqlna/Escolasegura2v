import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, updateDocument } from '@/lib/firebase';

export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  location?: string;
  isAnonymous: boolean;
  reporterId?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  timestamp: any;
  createdAt?: any;
}

// Hook to get user's reports
export const useUserReports = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reports', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const reports = await getDocuments('reports', [
        { field: 'reporterId', operator: '==', value: user.id }
      ], 'timestamp');
      
      return reports as Report[];
    },
    enabled: !!user,
  });
};

// Hook to get all reports (admin only)
export const useAllReports = () => {
  const { user, hasPermission } = useAuth();
  
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const reports = await getDocuments('reports', undefined, 'timestamp');
      return reports as Report[];
    },
    enabled: !!user && hasPermission('admin'),
  });
};

// Hook to update report status
export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      await updateDocument('reports', reportId, { status });
    },
    onSuccess: () => {
      // Invalidate reports queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};