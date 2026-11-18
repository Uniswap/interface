import './preview.css'
import { AXE_EXCLUDE, AXE_TAGS, initMyceliumTestI18n } from '@universe/mycelium/testing'
import { createPreview } from 'storybook-presets/preview'

initMyceliumTestI18n()

export default createPreview({ axeTags: AXE_TAGS, axeExclude: AXE_EXCLUDE })
