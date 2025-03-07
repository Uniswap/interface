import { ClickableTamaguiStyle } from 'theme/components'
import { Anchor, Flex, Text, styled } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { TextVariantTokens, fonts, iconSizes } from 'ui/src/theme'

const LOADER_PADDING = 2
export function TextLoader({ variant, width }: { variant: TextVariantTokens; width: number }) {
  const height = fonts[variant].lineHeight

  return (
    <Flex
      backgroundColor="$surface3"
      borderRadius="$rounded6"
      width={width}
      height={height - LOADER_PADDING * 2}
      my={LOADER_PADDING}
    />
  )
}

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
