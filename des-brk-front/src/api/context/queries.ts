import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../client'
import type { AddContextPayload, ContextItem } from './types'

export async function getContextItems() {
  return apiRequest<ContextItem[]>('/api/v1/context')
}

export async function addContextItem(payload: AddContextPayload) {
  return apiRequest<ContextItem>('/api/v1/context', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function removeContextItem(contextItemId: number) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/context/${contextItemId}`, {
    method: 'DELETE',
  })
}

export function useContextItemsQuery() {
  return useQuery({
    queryKey: ['context-items'],
    queryFn: getContextItems,
  })
}

export function useAddContextItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addContextItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-items'] })
    },
  })
}

export function useRemoveContextItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeContextItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-items'] })
    },
  })
}
