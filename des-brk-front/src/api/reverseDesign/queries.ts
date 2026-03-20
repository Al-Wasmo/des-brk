import { useMutation } from '@tanstack/react-query'

import { apiRequest } from '../client'
import type { ReverseDesignSocketMessage, RunReverseDesignPayload, RunReverseDesignResponse } from './types'

export async function runReverseDesign(payload: RunReverseDesignPayload): Promise<RunReverseDesignResponse> {
  return apiRequest<RunReverseDesignResponse>('/api/v1/reverse-design/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getReverseDesignJobStatus(jobId: string): Promise<ReverseDesignSocketMessage> {
  return apiRequest<ReverseDesignSocketMessage>(`/api/v1/reverse-design/jobs/${jobId}`)
}

export function useRunReverseDesignMutation() {
  return useMutation({
    mutationFn: runReverseDesign,
  })
}
