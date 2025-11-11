import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import permissionService from '../services/permissionService'

export const usePermissions = () => {
  const queryClient = useQueryClient()

  // Get all permissions
  const { data, isLoading, error } = useQuery(
    'permissions',
    () => permissionService.getAllPermissions(),
    {
      refetchOnWindowFocus: false,
    }
  )

  // Update user permissions
  const updateMutation = useMutation(
    ({ userId, permissions }) => permissionService.updateUserPermissions(userId, permissions),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('permissions')
        toast.success('İzinler başarıyla güncellendi')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'İzinler güncellenemedi')
      },
    }
  )

  return {
    users: data?.data?.users || [],
    availablePages: data?.data?.availablePages || [],
    isLoading,
    error,
    updatePermissions: updateMutation.mutate,
    isUpdating: updateMutation.isLoading,
  }
}

