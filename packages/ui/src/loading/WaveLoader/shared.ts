export const WAVE_WIDTH = 416
export const WAVE_HEIGHT = 180
export const WAVE_DURATION = 2000
export const WAVE_DURATION_COMPACT = 3500

export const WAVE_PATH_DEFAULT = 'M 0 80 Q 104 10, 208 80 T 416 80'
export const WAVE_PATH_COMPACT = 'M 0 100 Q 52 5, 104 100 T 208 100 T 312 100 T 416 100'
export const WAVE_COMPACT_HEIGHT_THRESHOLD = 140

export const WAVE_TILE_COUNT = 4

export type WaveLoaderVariant = 'default' | 'compact'

export type ResolvedWaveLoader = {
  duration: number
  path: string
}

export function resolveWaveLoader(height: number, variant?: WaveLoaderVariant): ResolvedWaveLoader {
  const isCompact = (variant ?? (height < WAVE_COMPACT_HEIGHT_THRESHOLD ? 'compact' : 'default')) === 'compact'
  return {
    duration: isCompact ? WAVE_DURATION_COMPACT : WAVE_DURATION,
    path: isCompact ? WAVE_PATH_COMPACT : WAVE_PATH_DEFAULT,
  }
}
