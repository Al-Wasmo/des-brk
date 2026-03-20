export type DesignSearchParams = {
  topic: string
}

export type DesignItem = {
  id: number
  topic: string
  name: string
  href: string
  thumbnail_url: string | null
  local_image_path: string | null
  created_at: string
}

export type DesignSearchResponse = {
  topic: string
  count: number
  items: DesignItem[]
}
