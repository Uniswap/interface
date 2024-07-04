// @ts-ignore this file is here but ts doesn't like it
import riveWASMResource from '@rive-app/canvas/rive.wasm'
import { RuntimeLoader } from '@rive-app/react-canvas'

RuntimeLoader.setWasmUrl(riveWASMResource)
