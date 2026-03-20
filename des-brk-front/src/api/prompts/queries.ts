import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '../client'
import type { PromptPreset, SavePromptPayload } from './types'

export async function getPromptPresets() {
  return apiRequest<PromptPreset[]>('/api/v1/prompts')
}

export async function savePromptPreset(payload: SavePromptPayload) {
  return apiRequest<PromptPreset>('/api/v1/prompts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deletePromptPreset(promptId: number) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/prompts/${promptId}`, {
    method: 'DELETE',
  })
}

export function usePromptPresetsQuery() {
  return useQuery({
    queryKey: ['prompt-presets'],
    queryFn: getPromptPresets,
  })
}

export function useSavePromptPresetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: savePromptPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-presets'] })
    },
  })
}

export function useDeletePromptPresetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePromptPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-presets'] })
    },
  })
}
