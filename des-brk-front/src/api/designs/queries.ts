import { useMutation } from '@tanstack/react-query'

import { apiRequest } from '../client'
import type { DesignSearchParams, DesignSearchResponse } from './types'

export async function searchDesigns(params: DesignSearchParams): Promise<DesignSearchResponse> {
  return apiRequest<DesignSearchResponse>('/api/v1/images/search', {
    method: 'POST',
    body: JSON.stringify({
      topic: params.topic,
    }),
  })
}

export function useSearchDesignsMutation() {
  return useMutation({
    mutationFn: searchDesigns,
  })
}
