export type PromptPreset = {
  id: number
  title: string
  prompt: string
  created_at: string
  updated_at: string
}

export type SavePromptPayload = {
  prompt: string
  title?: string
}
