import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../client'
import type {
  AddWorkspaceContextPayload,
  CreateWorkspacePayload,
  RemoveWorkspaceContextPayload,
  UpdateWorkspaceStatePayload,
  Workspace,
  WorkspaceContextItem,
} from './types'

export async function getWorkspaces() {
  return apiRequest<Workspace[]>('/api/v1/workspaces')
}

export async function createWorkspace(payload: CreateWorkspacePayload) {
  return apiRequest<Workspace>('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteWorkspace(workspaceId: number) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/workspaces/${workspaceId}`, {
    method: 'DELETE',
  })
}

export async function updateWorkspaceState(payload: UpdateWorkspaceStatePayload) {
  return apiRequest<Workspace>(`/api/v1/workspaces/${payload.workspaceId}/state`, {
    method: 'PATCH',
    body: JSON.stringify({ state: payload.state }),
  })
}

export async function getWorkspaceContextItems(workspaceId: number) {
  return apiRequest<WorkspaceContextItem[]>(`/api/v1/workspaces/${workspaceId}/context`)
}

export async function addWorkspaceContextItem(payload: AddWorkspaceContextPayload) {
  return apiRequest<WorkspaceContextItem>(`/api/v1/workspaces/${payload.workspaceId}/context`, {
    method: 'POST',
    body: JSON.stringify({
      image_asset_id: payload.image_asset_id,
    }),
  })
}

export async function removeWorkspaceContextItem(payload: RemoveWorkspaceContextPayload) {
  return apiRequest<{ deleted: boolean }>(
    `/api/v1/workspaces/${payload.workspaceId}/context/${payload.contextItemId}`,
    {
      method: 'DELETE',
    },
  )
}

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  })
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: (created) => {
      queryClient.setQueryData<Workspace[]>(['workspaces'], (prev) => {
        const next = prev ? [...prev] : []
        return [created, ...next.filter((item) => item.id !== created.id)]
      })
    },
  })
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-context-items'] })
    },
  })
}

export function useUpdateWorkspaceStateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkspaceState,
    onSuccess: (updated) => {
      queryClient.setQueryData<Workspace[]>(['workspaces'], (prev) => {
        if (!prev) {
          return [updated]
        }
        return prev.map((item) => (item.id === updated.id ? updated : item))
      })
    },
  })
}

export function useWorkspaceContextItemsQuery(workspaceId: number | null) {
  return useQuery({
    queryKey: ['workspace-context-items', workspaceId],
    queryFn: () => getWorkspaceContextItems(workspaceId as number),
    enabled: typeof workspaceId === 'number',
  })
}

export function useAddWorkspaceContextItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addWorkspaceContextItem,
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-context-items', created.workspace_id],
      })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useRemoveWorkspaceContextItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeWorkspaceContextItem,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-context-items', variables.workspaceId],
      })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
