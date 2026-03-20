import type { DesignItem } from '../designs/types'

export type WorkspaceState = Record<string, unknown>

export type Workspace = {
  id: number
  name: string
  state_json: WorkspaceState | null
  created_at: string
  updated_at: string
}

export type CreateWorkspacePayload = {
  name?: string
}

export type UpdateWorkspaceStatePayload = {
  workspaceId: number
  state: WorkspaceState
}

export type WorkspaceContextItem = {
  id: number
  workspace_id: number
  image_asset_id: number
  created_at: string
  image: DesignItem
}

export type AddWorkspaceContextPayload = {
  workspaceId: number
  image_asset_id: number
}

export type RemoveWorkspaceContextPayload = {
  workspaceId: number
  contextItemId: number
}
