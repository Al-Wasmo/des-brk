export type GeneratePromptPayload = {
  message: string
  contextDesignNames: string[]
}

export type GeneratePromptResponse = {
  reply: string
}
