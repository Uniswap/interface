import { TouchableArea, zIndexes } from '@universe/mycelium'
import { BackArrow } from '@universe/mycelium/icons/BackArrow'

export function ModalBackButton({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <TouchableArea
      hoverable
      borderRadius="$roundedFull"
      p="$spacing4"
      position="absolute"
      zIndex={zIndexes.default}
      onPress={onBack}
    >
      <BackArrow color="$neutral2" size="$icon.24" />
    </TouchableArea>
  )
}
