import { apiRequest } from './client'

export type HealthResponse = {
  status: string
}

export function getHealth() {
  return apiRequest<HealthResponse>('/health')
}
