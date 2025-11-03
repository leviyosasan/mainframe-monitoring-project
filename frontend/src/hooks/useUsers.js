import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import userService from '../services/userService'

export const useUsers = (page = 1, limit = 10) => {
  const queryClient = useQueryClient()

  // Get all users
  const { data, isLoading, error } = useQuery(
    ['users', page, limit],
    () => userService.getAllUsers(page, limit),
    {
      keepPreviousData: true,
    }
  )

  // Create user
  const createMutation = useMutation(
    (userData) => userService.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('Kullanıcı başarıyla oluşturuldu')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Kullanıcı oluşturulamadı')
      },
    }
  )

  // Update user
  const updateMutation = useMutation(
    ({ userId, data }) => userService.updateUser(userId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('Kullanıcı başarıyla güncellendi')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Kullanıcı güncellenemedi')
      },
    }
  )

  // Delete user
  const deleteMutation = useMutation(
    (userId) => userService.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('Kullanıcı başarıyla silindi')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Kullanıcı silinemedi')
      },
    }
  )

  return {
    users: data?.data?.users || [],
    pagination: data?.data?.pagination,
    isLoading,
    error,
    createUser: createMutation.mutate,
    isCreating: createMutation.isLoading,
    updateUser: updateMutation.mutate,
    isUpdating: updateMutation.isLoading,
    deleteUser: deleteMutation.mutate,
    isDeleting: deleteMutation.isLoading,
  }
}

export const useUser = (userId) => {
  return useQuery(
    ['user', userId],
    () => userService.getUserById(userId),
    {
      enabled: !!userId,
    }
  )
}

