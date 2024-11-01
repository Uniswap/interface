import { TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons'
import { zIndices } from 'ui/src/theme'

export function ModalBackButton({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <TouchableArea
      hoverable
      borderRadius="$roundedFull"
      p="$spacing4"
      position="absolute"
      zIndex={zIndices.default}
      onPress={onBack}
    >
      <BackArrow color="$neutral2" size="$icon.24" />
    </TouchableArea>
  )
}
