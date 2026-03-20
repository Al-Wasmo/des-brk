import { useMutation } from '@tanstack/react-query'

import type { GeneratePromptPayload, GeneratePromptResponse } from './types'

export async function generatePrompt(_payload: GeneratePromptPayload): Promise<GeneratePromptResponse> {
  throw new Error('generatePrompt is not implemented yet')
}

export function useGeneratePrompt() {
  return useMutation({
    mutationFn: generatePrompt,
  })
}
