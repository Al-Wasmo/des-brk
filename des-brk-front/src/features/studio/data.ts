import type { AssetItem, AssetTone } from './types'

const tones: AssetTone[] = ['c1', 'c2', 'c3', 'c4', 'c5']

const cardNames = [
  'hero-layout-v2',
  'dashboard-dark',
  'card-component',
  'nav-pattern',
  'modal-design',
  'landing-section',
  'form-ui',
  'grid-layout',
  'sidebar-nav',
  'button-set',
  'typography-scale',
  'color-system',
  'icon-grid',
  'table-view',
  'profile-card',
  'pricing-block',
  'onboarding-flow',
  'empty-state',
  'search-ui',
  'toast-alerts',
  'data-chart',
  'filter-panel',
  'timeline-view',
  'media-card',
]

export function getMockAssets(): AssetItem[] {
  return cardNames.map((name, index) => ({
    id: index + 1,
    name,
    fileName: `${name}.png`,
    meta: 'Design · PNG',
    tone: tones[index % tones.length],
    href: `https://dribbble.com/shots/${24000000 + index}-${name}`,
    thumbnailUrl: null,
    localImagePath: null,
    previewUrl: null,
  }))
}
