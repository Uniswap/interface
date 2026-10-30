/**
 * The compat `FlexLoader`, which replaced the legacy Tamagui `FlexLoader` from `ui/src`.
 *
 * Platform-neutral throughout: the component composes `FlexCompat` by its
 * BASE specifier, so Metro resolves the flex compat's `.native.tsx` leg and
 * vite its `.web.tsx` leg — no legs of its own to keep in sync.
 */
export { FlexLoaderCompat } from './FlexLoaderCompat'
export type { FlexLoaderProps } from './props'
