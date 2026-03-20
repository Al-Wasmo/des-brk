import { useMutation } from '@tanstack/react-query'

import { apiRequest } from '../client'
import type { GenerateDesignSocketMessage, RunGenerateDesignPayload, RunGenerateDesignResponse } from './types'

export async function runGenerateDesign(payload: RunGenerateDesignPayload): Promise<RunGenerateDesignResponse> {
  return apiRequest<RunGenerateDesignResponse>('/api/v1/generate-design/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getGenerateDesignJobStatus(jobId: string): Promise<GenerateDesignSocketMessage> {
  return apiRequest<GenerateDesignSocketMessage>(`/api/v1/generate-design/jobs/${jobId}`)
}

export function useRunGenerateDesignMutation() {
  return useMutation({
    mutationFn: runGenerateDesign,
  })
}
