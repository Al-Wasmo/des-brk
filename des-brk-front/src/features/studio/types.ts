export type StudioPage = 'search' | 'design'

export type AssetTone = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'

export type AssetItem = {
  id: number
  name: string
  fileName: string
  meta: string
  tone: AssetTone
  href: string
  thumbnailUrl: string | null
  localImagePath: string | null
  previewUrl: string | null
}

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
  timeLabel: string
}
