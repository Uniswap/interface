import { ClickableTamaguiStyle } from 'theme/components'
import { Anchor, Flex, Text, styled } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'

export const LoadingRow = styled(Flex, {
  my: '$spacing16',
})

export function ExternalArrowLink({
  href,
  openInNewTab = true,
  children,
}: {
  href: string
  openInNewTab?: boolean
  children: React.ReactNode
}) {
  return (
    <Anchor
      textDecorationLine="none"
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      {...ClickableTamaguiStyle}
    >
      <Flex gap="$gap8" alignItems="center" row>
        <Text variant="buttonLabel3" color="$neutral2">
          {children}
        </Text>
        <Arrow size={iconSizes.icon20} color="$neutral2" />
      </Flex>
    </Anchor>
  )
}
