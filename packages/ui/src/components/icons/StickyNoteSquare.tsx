import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [StickyNoteSquare, AnimatedStickyNoteSquare] = createIcon({
  name: 'StickyNoteSquare',
  getIcon: (props) => (
    <Svg fill="currentColor" viewBox="0 0 16 16" {...props}>
      <Path
        d="M14 4.24666V8.56665C14 8.71332 13.9866 8.86 13.9533 9H11.2533C10.0066 9 9 10.0067 9 11.2533V13.9534C8.86 13.9867 8.7134 14 8.56673 14H4.25326C2.74659 14 2 13.2467 2 11.7467V4.24666C2 2.74666 2.74659 2 4.25326 2H11.7467C13.2534 2 14 2.74666 14 4.24666ZM10 11.2533V13.48C10.06 13.44 10.1067 13.3933 10.16 13.34L13.34 10.16C13.3933 10.1067 13.44 10.06 13.48 10H11.2533C10.5599 10 10 10.56 10 11.2533Z"
        fill={'currentColor' ?? '#FC74FE'}
      />
    </Svg>
  ),
  defaultFill: '#FC74FE',
})
