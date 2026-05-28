import { RuntimeLoader } from '@rive-app/react-canvas'
import { useEffect } from 'react'

// Default export as a React component
export default function SetupRiveComponent() {
  useEffect(() => {
    RuntimeLoader.setWasmUrl('/rive/rive.wasm')
  }, [])

  return null
}
