/* eslint-disable react/forbid-elements */
import { useIsPrimaryAppInstance } from 'src/store/storeSynchronization'

// This is a dev-only component that renders a small green/red dot in the bottom right corner of the screen
// to indicate whether the current app instance is the primary one.
export default function PrimaryAppInstanceDebugger(): JSX.Element | null {
  const isPrimaryAppInstance = useIsPrimaryAppInstance()

  return (
    // biome-ignore  lint/correctness/noRestrictedElements: needed here
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        borderRadius: '5px',
        width: '5px',
        height: '5px',
        zIndex: Number.MAX_SAFE_INTEGER,
        background: isPrimaryAppInstance ? 'green' : 'red',
        color: 'white',
      }}
      title={`IsPrimaryAppInstance: ${isPrimaryAppInstance}`}
    />
  )
}
