import { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea, iconSizes } from '@universe/mycelium'
import { ArrowDownArrowUp } from '@universe/mycelium/icons/ArrowDownArrowUp'
import { styled } from '@universe/mycelium/styled'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { getHeaderTitleVariant } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { getTokenDetailsURL } from '~/data/util'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from '~/theme/components/styles'

// `transition-opacity`, not `all`: `all` animates theme tokens and flashes on a light/dark toggle.
const StyledLink = styled(Link, {
  platform: 'web',
  base: 'flex min-w-0 shrink no-underline cursor-pointer transition-opacity duration-100 hover:opacity-80 active:opacity-60',
})

export function PoolDetailsTitle({
  baseToken,
  quoteToken,
  chainId,
  toggleReversed,
  isCompact,
  poolAddress,
}: {
  baseToken?: ParsedToken
  quoteToken?: ParsedToken
  chainId?: UniverseChainId
  toggleReversed: React.DispatchWithoutAction
  isCompact: boolean
  poolAddress?: string
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const { defaultChainId } = useEnabledChains()
  const titleVariant = getHeaderTitleVariant({ isCompact, media })
  return (
    <Flex row gap="$spacing12" alignItems="center" minWidth={0} shrink>
      <Flex row minWidth={0} shrink>
        <StyledLink
          to={getTokenDetailsURL({
            address: baseToken?.address,
            chainId: chainId ?? defaultChainId,
          })}
        >
          <Text
            variant={titleVariant}
            transition={HEADER_TRANSITION}
            minWidth={0}
            flexShrink={1}
            {...EllipsisTamaguiStyle}
          >
            {baseToken?.symbol} /{' '}
          </Text>
        </StyledLink>
        <StyledLink
          to={getTokenDetailsURL({
            address: quoteToken?.address,
            chainId: chainId ?? defaultChainId,
          })}
        >
          <Text
            variant={titleVariant}
            transition={HEADER_TRANSITION}
            minWidth={0}
            flexShrink={1}
            {...EllipsisTamaguiStyle}
          >
            {quoteToken?.symbol}
          </Text>
        </StyledLink>
      </Flex>
      {/* Mobile: copy the pool address next to the name (desktop copies it on the second row). */}
      {media.md && poolAddress && (
        <Flex alignSelf="center">
          <CopyHelper
            toCopy={poolAddress}
            iconSize={iconSizes.icon16}
            iconColor="$neutral2"
            testID={TestID.PoolDetailsCopyAddressButton}
            ariaLabel={t('common.copy.address')}
          />
        </Flex>
      )}
      <TouchableArea
        hoverable
        {...ClickableTamaguiStyle}
        onPress={toggleReversed}
        testID="toggle-tokens-reverse-arrows"
      >
        <ArrowDownArrowUp size="$icon.20" color="$neutral2" />
      </TouchableArea>
    </Flex>
  )
}
