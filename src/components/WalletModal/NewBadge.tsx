import { BadgeVariant, SmallBadge } from 'components/Badge'
import { ThemedText } from 'theme'

export default function NewBadge() {
  return (
    <SmallBadge variant={BadgeVariant.BRANDED}>
      <ThemedText.UtilityBadge>NEW</ThemedText.UtilityBadge>
    </SmallBadge>
  )
}
