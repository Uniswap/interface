import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, View } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { CopyHelper } from '~/theme/components/CopyHelper'
import type { TokenStat } from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

const TokenDetailsContainer = styled(Flex, {
  flex: 1,
  minWidth: 0,
  width: '100%',
  variants: {
    multichainUx: {
      true: {
        flexDirection: 'column',
      },
      false: {
        flexDirection: 'row',
        gap: '$gap8',
        alignItems: 'center',
        justifyContent: 'flex-start',
      },
    },
  } as const,
})

const SYMBOL_SLOT_HEIGHT = 20

interface TokenDescriptionProps {
  token: TokenStat
  /** Chain IDs for this token sorted by volume (desc) for the table's time period. From multichain list data. */
  chainIdsByVolume?: UniverseChainId[]
  /** Current explore chain filter from route (e.g. "ethereum"). Passed from table to avoid useParams in every row. */
  chainFilter?: string | undefined
}

export function TokenDescription({ token, chainIdsByVolume = [], chainFilter }: TokenDescriptionProps) {
  const { t } = useTranslation()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const isMultiNetworkRow = multichainTokenUxEnabled && chainIdsByVolume.length > 1
  /** Omit chain badge on the logo when volume spans multiple networks — row uses NetworkIconList on hover instead. */
  const logoChainId = isMultiNetworkRow ? undefined : getChainIdFromChainUrlParam(token.chain.toLowerCase())
  const logoSize = multichainTokenUxEnabled ? iconSizes.icon32 : iconSizes.icon24
  const isNative = token.address === NATIVE_CHAIN_ID
  const disableHoverTransition = chainIdsByVolume.length === 1 && (isNative || token.address === ZERO_ADDRESS)

  // token.logo returns the WETH logo URL for native ETH — use useCurrencyInfo to get the correct logo
  const chainId = getChainIdFromChainUrlParam(token.chain.toLowerCase()) ?? UniverseChainId.Mainnet
  const nativeCurrencyInfo = useCurrencyInfo(isNative ? buildNativeCurrencyId(chainId) : undefined)
  const logoUrl = isNative ? nativeCurrencyInfo?.logoUrl : token.logo

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start" width="100%">
      <View pr="$spacing4">
        <TokenLogo
          chainId={logoChainId}
          name={token.name}
          size={logoSize}
          symbol={token.symbol}
          url={logoUrl}
          alwaysShowNetworkLogo={multichainTokenUxEnabled && !!chainFilter}
        />
      </View>
      <TokenDetailsContainer multichainUx={multichainTokenUxEnabled}>
        <EllipsisText variant={multichainTokenUxEnabled ? 'body2' : undefined} data-testid={TestID.TokenName}>
          {token.name ?? token.project?.name}
        </EllipsisText>
        {multichainTokenUxEnabled ? (
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
                {token.symbol}
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
                  toCopy={token.address}
                  iconPosition="right"
                  iconSize={iconSizes.icon12}
                  iconColor="$neutral2"
                  color="$neutral2"
                  alwaysShowIcon
                >
                  <Text variant="body3" color="$neutral2">
                    {shortenAddress({ address: token.address, chars: 4, charsEnd: 4 })}
                  </Text>
                </CopyHelper>
              )
            }
          />
        ) : (
          <TableText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
            {token.symbol}
          </TableText>
        )}
      </TokenDetailsContainer>
    </Flex>
  )
}

export function getTokenDescriptionColumnSize(isLgBreakpoint: boolean, multichainTokenUxEnabled: boolean): number {
  if (!isLgBreakpoint) {
    return 300
  }
  return multichainTokenUxEnabled ? 225 : 150
}
