import { ReactNode } from 'react'
import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface MultichainOptionRowProps {
  chainId: UniverseChainId
  rightContent: ReactNode
  onPress?: () => void
  testID?: string
  /** Web-only: render as an anchor tag */
  href?: string
  tag?: string
  target?: string
  rel?: string
}

/**
 * A single row in the multichain explorer/address dropdown.
 * Shows a chain logo, chain name, and a right-side action slot.
 * When `onPress` is provided, the entire row is tappable.
 */
export function MultichainOptionRow({
  chainId,
  rightContent,
  onPress,
  testID,
  href,
  tag,
  target,
  rel,
}: MultichainOptionRowProps): JSX.Element {
  const chainName = getChainInfo(chainId).label
  const media = useMedia()
  const isMobileLayout = media.md
  const logoSize = isMobileLayout ? iconSizes.icon28 : iconSizes.icon20
  const logoBorderRadius = isMobileLayout ? 8 : undefined

  const content = (
    <Flex
      row
      alignItems="center"
      borderRadius="$rounded16"
      gap="$spacing8"
      px="$spacing8"
      py="$spacing8"
      width="100%"
      $md={{ gap: '$spacing12', px: 0, height: '$spacing48' }}
    >
      <NetworkLogo borderRadius={logoBorderRadius} chainId={chainId} size={logoSize} />
      <Text color="$neutral1" flex={1} numberOfLines={1} variant={isMobileLayout ? 'body1' : 'body2'}>
        {chainName}
      </Text>
      {rightContent}
    </Flex>
  )

  if (onPress || href) {
    return (
      <TouchableArea
        $platform-web={{ textDecorationLine: 'none' }}
        href={href}
        tag={tag}
        target={target}
        rel={rel}
        testID={testID}
        onPress={
          onPress
            ? (e): void => {
                // Prevent the <a> tag's default navigation when onPress handles it
                if (href && 'preventDefault' in e) {
                  e.preventDefault()
                }
                onPress()
              }
            : undefined
        }
      >
        {content}
      </TouchableArea>
    )
  }

  return content
}
