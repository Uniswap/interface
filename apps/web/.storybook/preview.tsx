import '../src/global.css'
import '../src/tailwind.css'
import '../src/polyfills'
import { AXE_EXCLUDE, AXE_TAGS } from '@universe/mycelium/testing'
import { createPreview } from 'storybook-presets/preview'

export default createPreview({ axeTags: AXE_TAGS, axeExclude: AXE_EXCLUDE })
