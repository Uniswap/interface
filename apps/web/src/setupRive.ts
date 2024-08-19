// @ts-ignore this file is here but ts doesn't like it
import riveWASMResource from '@rive-app/canvas/rive.wasm'
import { RuntimeLoader } from '@rive-app/react-canvas'
import { useEffect } from 'react'

// Default export as a React component
export default function SetupRiveComponent() {
  useEffect(() => {
    RuntimeLoader.setWasmUrl(riveWASMResource)
  }, [])

  return null
}
