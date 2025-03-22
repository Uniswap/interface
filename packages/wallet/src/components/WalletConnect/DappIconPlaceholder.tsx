import { memo } from 'react'
import { Flex, Text, useColorSchemeFromSeed } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function UnmemoizedDappIconPlaceholder({ name, iconSize }: { name?: string; iconSize: number }): JSX.Element {
  const { foreground: textColor, background: backgroundColor } = useColorSchemeFromSeed(name ?? '')

  return (
    <Flex
      centered
      fill
      row
      backgroundColor={backgroundColor}
      borderRadius="$roundedFull"
      maxHeight={iconSize}
      testID="dapp-icon-placeholder"
      width={iconSize}
      aspectRatio={1}
    >
      <Text color={textColor} textAlign="center" variant={iconSize >= iconSizes.icon40 ? 'subheading1' : 'body2'}>
        {name && name.length > 0 ? name.charAt(0) : ' '}
      </Text>
    </Flex>
  )
}

export const DappIconPlaceholder = memo(UnmemoizedDappIconPlaceholder)
