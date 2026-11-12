import '../src/global.css'
import '../src/tailwind.css'
import '../src/polyfills'
import { AXE_TAGS } from '@universe/mycelium/testing'
import { createPreview } from 'storybook-presets/preview'

export default createPreview({ axeTags: AXE_TAGS })
