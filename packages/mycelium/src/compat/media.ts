/**
 * Responsive media prop → Tailwind variant map, shared by every compat
 * component. Declaration order matches Tamagui's media precedence (weakest
 * first); the same order defines the variants in `compat-animations.css`'s
 * sibling media utilities and is byte-identical to `ui/src/theme/media.ts`.
 */
import type { MediaPropKey } from './props'

export const MEDIA_VARIANT: Record<MediaPropKey, string> = {
  $xxxl: 'media-xxxl',
  $xxl: 'media-xxl',
  $xl: 'media-xl',
  $lg: 'media-lg',
  $md: 'media-md',
  $sm: 'media-sm',
  $xs: 'media-xs',
  $xxs: 'media-xxs',
  $short: 'media-short',
  $midHeight: 'media-mid-height',
  $lgHeight: 'media-lg-height',
}
