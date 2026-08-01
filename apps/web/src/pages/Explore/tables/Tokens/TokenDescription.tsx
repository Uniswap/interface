import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, View } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

const TokenDetailsContainer = styled(Flex, {
  flex: 1,
  minWidth: 0,
  width: '100%',
})

const SYMBOL_SLOT_HEIGHT = 20

interface TokenDescriptionProps {
  name: string
  symbol: string
  address: string
  chainId: UniverseChainId
  logoUrl?: string
  /** Chain IDs for this token sorted by volume (desc) for the table's time period. From multichain list data. */
  chainIdsByVolume?: UniverseChainId[]
  /** Current explore chain filter from route (e.g. "ethereum"). Passed from table to avoid useParams in every row. */
  chainFilter?: string | undefined
}

export function TokenDescription({
  name,
  symbol,
  address,
  chainId,
  logoUrl,
  chainIdsByVolume = [],
  chainFilter,
}: TokenDescriptionProps) {
  const { t } = useTranslation()
  const isMultiNetworkRow = chainIdsByVolume.length > 1
  /** Omit chain badge on the logo when volume spans multiple networks — row uses NetworkIconList on hover instead. */
  const logoChainId = isMultiNetworkRow ? undefined : chainId
  const isNative = address === NATIVE_CHAIN_ID
  const disableHoverTransition = chainIdsByVolume.length === 1 && (isNative || address === ZERO_ADDRESS)

  // The project logo URL returns the WETH logo for native ETH — use useCurrencyInfo to get the correct logo
  const nativeCurrencyInfo = useCurrencyInfo(isNative ? buildNativeCurrencyId(chainId) : undefined)
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
          alwaysShowNetworkLogo={!!chainFilter}
        />
      </View>
      <TokenDetailsContainer>
        <EllipsisText variant="body2" data-testid={TestID.TokenName}>
          {name}
        </EllipsisText>
        <GroupHoverTransition
          height={SYMBOL_SLOT_HEIGHT}
          showTransition={!disableHoverTransition}
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
            chainIdsByVolume.length > 1 ? (
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
