import { StrictMode } from 'react'

// TODO(EXT-1229): We had to remove `React.StrictMode` because it's not
// currently supported by Reanimated Web. We should consider re-enabling
// once Reanimated fixes this.
export function OptionalStrictMode(props: { children: React.ReactNode }): JSX.Element {
  return process.env.ENABLE_STRICT_MODE ? <StrictMode>{props.children}</StrictMode> : <>{props.children}</>
}
