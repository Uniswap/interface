import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ClipboardPaste, AnimatedClipboardPaste] = createIcon({
  name: 'ClipboardPaste',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 16 16" {...props}>
      <Path
        d="M13.3332 5.33333V12C13.3332 13.3333 12.6665 14 11.3332 14H4.6665C3.33317 14 2.6665 13.3333 2.6665 12V5.33333C2.6665 4.172 3.16777 3.518 4.17643 3.37134C4.2571 3.35934 4.33317 3.42599 4.33317 3.50732V3.66602C4.33317 4.87935 5.11984 5.66602 6.33317 5.66602H9.66651C10.8798 5.66602 11.6665 4.87935 11.6665 3.66602V3.50732C11.6665 3.42599 11.7432 3.35934 11.8232 3.37134C12.8319 3.518 13.3332 4.172 13.3332 5.33333ZM6.33317 4.66667H9.66651C10.3332 4.66667 10.6665 4.33333 10.6665 3.66667V3C10.6665 2.33333 10.3332 2 9.66651 2H6.33317C5.6665 2 5.33317 2.33333 5.33317 3V3.66667C5.33317 4.33333 5.6665 4.66667 6.33317 4.66667Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
