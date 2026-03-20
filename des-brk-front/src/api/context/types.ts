import type { DesignItem } from '../designs/types'

export type ContextItem = {
  id: number
  image_asset_id: number
  created_at: string
  image: DesignItem
}

export type AddContextPayload = {
  image_asset_id: number
}
