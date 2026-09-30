import { UniverseChainId } from '@universe/chains'
import { Flex, Text, View } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useResolveTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolveTokenCategories'
import { RWAIssuerTag } from 'uniswap/src/features/rwa/RWAIssuerTag'
import type { RWAIssuer } from 'uniswap/src/features/rwa/types'
import { selectTokenRowCategoryTag } from 'uniswap/src/features/tokenCategories/selectTokenRowCategoryTag'
import { TokenCategoryTag } from 'uniswap/src/features/tokenCategories/TokenCategoryTag'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { TableRowHoverContext } from '~/components/Table/TableRowHoverContext'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

const TokenDetailsContainer = styled(Flex, {
  base: 'grow-[1] shrink w-[100%] min-w-[0px]',
})

const SYMBOL_SLOT_HEIGHT = 20

interface TokenDescriptionProps {
  name: string
  symbol: string
  address: string
  /** Undefined only for tokens on chains without a UniverseChainId (no network badge / native lookup). */
  chainId: UniverseChainId | undefined
  logoUrl?: string
  /** Chain IDs for this token sorted by volume (desc) for the table's time period. From multichain list data. */
  chainIdsByVolume?: UniverseChainId[]
  /** Chain the explore route is filtered to, if any. Passed from table to avoid useParams in every row. */
  chainFilterId?: UniverseChainId | undefined
  /** BE order; the first one not equal to `scopedCategoryId` becomes the row tag. */
  categoryIds?: string[]
  /** Category the hosting table is filtered to, if any; its own tag is suppressed on the row. */
  scopedCategoryId?: string
  /** Matched RWA issuer slug; adds the issuer tag after the name. */
  issuer?: RWAIssuer
}

export function TokenDescription({
  name,
  symbol,
  address,
  chainId,
  logoUrl,
  chainIdsByVolume = [],
  chainFilterId,
  categoryIds,
  scopedCategoryId,
  issuer,
}: TokenDescriptionProps) {
  const { t } = useTranslation()
  const rowHovered = useContext(TableRowHoverContext)
  const { categories } = useResolveTokenCategories({ categoryIds })
  const categoryTag = useMemo(
    () => selectTokenRowCategoryTag({ categoryIds, categories, scopedCategoryId }),
    [categoryIds, categories, scopedCategoryId],
  )
  // A chain-filtered page's row is that chain's deployment only (its address, link and stats all
  // come from that leg), so it gets the same single-network treatment even for a multichain token.
  const isMultiNetworkRow = chainFilterId === undefined && chainIdsByVolume.length > 1
  /** Omit chain badge on the logo when volume spans multiple networks — row uses NetworkIconList on hover instead. */
  const logoChainId = isMultiNetworkRow ? undefined : chainId
  const isNative = address === NATIVE_CHAIN_ID
  const disableHoverTransition = !isMultiNetworkRow && (isNative || address === ZERO_ADDRESS)

  // The project logo URL returns the WETH logo for native ETH — use useCurrencyInfo to get the correct logo
  const nativeCurrencyInfo = useCurrencyInfo(
    isNative && chainId !== undefined ? buildNativeCurrencyId(chainId) : undefined,
  )
  const resolvedLogoUrl = isNative ? nativeCurrencyInfo?.logoUrl : logoUrl

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start" width="100%">
      <View pr="$spacing4">
        <TokenLogo
          chainId={logoChainId}
          name={name}
          size={iconSizes.icon32}
          symbol={symbol}
          url={resolvedLogoUrl}
          alwaysShowNetworkLogo={chainFilterId !== undefined}
        />
      </View>
      <TokenDetailsContainer>
        <Flex row alignItems="center" gap="$spacing6" minWidth={0}>
          <EllipsisText variant="body2" flexShrink={1} minWidth={0} data-testid={TestID.TokenName}>
            {name}
          </EllipsisText>
          {issuer && (
            <Flex testID={TestID.TokenRowIssuerTag}>
              <RWAIssuerTag issuer={issuer} />
            </Flex>
          )}
          {categoryTag && (
            <Flex testID={TestID.TokenRowCategoryTag}>
              <TokenCategoryTag category={categoryTag} />
            </Flex>
          )}
        </Flex>
        <GroupHoverTransition
          height={SYMBOL_SLOT_HEIGHT}
          showTransition={!disableHoverTransition}
          isHovered={rowHovered}
          defaultContent={
            <Text
              variant="body3"
              $platform-web={{ minWidth: 'fit-content' }}
              color="$neutral2"
              height={SYMBOL_SLOT_HEIGHT}
              width="100%"
            >
              {symbol}
            </Text>
          }
          hoverContent={
            isMultiNetworkRow ? (
              <Flex row height={SYMBOL_SLOT_HEIGHT} alignItems="center" gap="$gap8" minWidth="100%">
                <Text variant="body3" color="$neutral2" numberOfLines={1}>
                  {t('explore.tokens.table.networks', { count: chainIdsByVolume.length })}
                </Text>
                <NetworkIconList chainIds={chainIdsByVolume} size={12} />
              </Flex>
            ) : (
              <CopyHelper
                toCopy={address}
                iconPosition="right"
                iconSize={iconSizes.icon12}
                iconColor="$neutral2"
                color="$neutral2"
                alwaysShowIcon
              >
                <Text variant="body3" color="$neutral2">
                  {shortenAddress({ address, chars: 4, charsEnd: 4 })}
                </Text>
              </CopyHelper>
            )
          }
        />
      </TokenDetailsContainer>
    </Flex>
  )
}

export function getTokenDescriptionColumnSize(isLgBreakpoint: boolean): number {
  return isLgBreakpoint ? 225 : 300
}
