import { TouchableArea } from '@universe/mycelium'
import { Ellipsis } from '@universe/mycelium/icons/Ellipsis'

export function DappEllipsisDropdownIcon(): JSX.Element {
  return (
    <TouchableArea borderRadius="$roundedFull" hoverStyle={{ backgroundColor: '$surface2Hovered' }} p="$spacing8">
      <Ellipsis color="$neutral2" size="$icon.16" />
    </TouchableArea>
  )
}
