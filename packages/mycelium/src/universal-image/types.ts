import type { JSX } from 'react'
import type { ImageRequireSource, StyleProp, ViewStyle } from 'react-native'

/** Dimension value compatible with both web CSS and React Native */
export type UniversalImageStyleDimensionValue = number | `${number}%` | 'auto' | undefined

export interface UniversalImageStyle {
  backgroundColor?: string
  borderRadius?: number
  /** Inert on web; kept for surface compatibility (see the svg-container note in UniversalImage.tsx). */
  verticalAlign?: string
  zIndex?: number
  transition?: string
  width?: UniversalImageStyleDimensionValue
  height?: UniversalImageStyleDimensionValue
}

export enum UniversalImageResizeMode {
  Center = 'center',
  Contain = 'contain',
  Cover = 'cover',
  Stretch = 'stretch',
}

export interface UniversalImageStyleProps {
  image?: UniversalImageStyle // ImageStyle
  loadingContainer?: StyleProp<ViewStyle>
}

interface SharedImageSizeProps {
  width?: number
  height?: number
  aspectRatio?: number
}

export type UniversalImageSize = SharedImageSizeProps & {
  resizeMode?: UniversalImageResizeMode
}

// Top level props

export type UniversalImageProps = {
  /**
   * Text alternative: what the image conveys, e.g. the token symbol for a logo.
   * Required so a missing description is a type error rather than a silent gap;
   * pass `""` when the image is purely visual and its meaning is in adjacent text.
   */
  alt: string
  uri?: string | ImageRequireSource
  size: UniversalImageSize
  fallback?: JSX.Element
  style?: UniversalImageStyleProps
  testID?: string
  allowLocalUri?: boolean
  autoplay?: boolean
  onLoad?: () => void
  onError?: () => void
  /** Cross-fade duration in ms when the URI changes. Default 200. Set to 0 to skip the
   * dual-bitmap cross-fade on memory-sensitive surfaces (e.g. NFT grids). */
  transitionMs?: number
  /** Native loading-queue hint. `'low'` lets higher-priority images preempt. */
  priority?: 'low' | 'normal' | 'high'
}

export interface PlainImageProps {
  uri: string
  /** Resolved text alternative; empty for a decorative image. */
  alt: string
  size: SharedImageSizeProps
  fallback?: JSX.Element
  style?: UniversalImageStyle
  resizeMode?: UniversalImageResizeMode
  testID?: string
  onLoad?: () => void
  onError?: () => void
  autoplay?: boolean
  /** Cross-fade duration in ms when the URI changes. Default 200. Set to 0 to skip the
   * dual-bitmap cross-fade entirely on memory-sensitive surfaces (e.g. NFT grids). */
  transitionMs?: number
  /** Native loading-queue hint. `'low'` lets higher-priority images preempt. */
  priority?: 'low' | 'normal' | 'high'
}

export type PlainImageExpoProps = PlainImageProps & {
  cacheInMemory?: boolean
}

export interface RequireImageProps {
  uri: ImageRequireSource
  /** Resolved text alternative; empty for a decorative image. */
  alt: string
  size: SharedImageSizeProps
  fallback?: JSX.Element
  style?: UniversalImageStyle
  onError?: () => void
}

export type SvgImageProps = {
  uri: string
  /** Resolved text alternative; empty for a decorative image. */
  alt: string
  size: SharedImageSizeProps
  autoplay: boolean
  fallback?: JSX.Element
  style?: UniversalImageStyle
  resizeMode?: UniversalImageResizeMode
  onError?: () => void
}
