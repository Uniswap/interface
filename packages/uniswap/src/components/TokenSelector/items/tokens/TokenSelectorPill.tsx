import { ReactNode } from 'react'
import { TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { Pill } from 'uniswap/src/components/pill/Pill'

type TokenSelectorPillProps = {
  icon: ReactNode
  label: Maybe<string>
  testID: string
  onPress: () => void
}

/** Pill shared by the native token-selector rows (suggested currencies and stocks). */
export function TokenSelectorPill({ icon, label, testID, onPress }: TokenSelectorPillProps): JSX.Element {
  const colors = useSporeColors()
  const media = useMedia()

  return (
    <TouchableArea hoverable borderRadius="$roundedFull" testID={testID} onPress={onPress}>
      <Pill
        borderColor="$surface3Solid"
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        foregroundColor={colors.neutral1.val}
        icon={icon}
        label={label}
        pl="$spacing4"
        pr="$spacing12"
        py="$spacing4"
        textVariant={media.xxs ? 'buttonLabel2' : 'buttonLabel1'}
      />
    </TouchableArea>
  )
}
