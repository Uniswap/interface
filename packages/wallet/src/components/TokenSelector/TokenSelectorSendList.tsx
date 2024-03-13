import { skipToken } from '@reduxjs/toolkit/dist/query'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, isWeb } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { GqlResult } from 'uniswap/src/data/types'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import {
  SectionHeader,
  TokenSelectorList,
} from 'wallet/src/components/TokenSelector/TokenSelectorList'
import { usePortfolioTokenOptions } from 'wallet/src/components/TokenSelector/hooks'
import { OnSelectCurrency, TokenSection } from 'wallet/src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'wallet/src/components/TokenSelector/utils'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { ChainId } from 'wallet/src/constants/chains'
import { useFiatOnRampIpAddressQuery } from 'wallet/src/features/fiatOnRamp/api'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useTokenSectionsForSend(chainFilter: ChainId | null): GqlResult<TokenSection[]> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const loading = portfolioTokenOptionsLoading
  const error = !portfolioTokenOptions && portfolioTokenOptionsError

  const sections = useMemo(
    () => getTokenOptionsSection(t('tokens.selector.section.yours'), portfolioTokenOptions),
    [portfolioTokenOptions, t]
  )

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchPortfolioTokenOptions,
    }),
    [error, loading, refetchPortfolioTokenOptions, sections]
  )
}

function EmptyList({ onEmptyActionPress }: { onEmptyActionPress: () => void }): JSX.Element {
  const { t } = useTranslation()

  const { data: ipAddressData, isLoading } = useFiatOnRampIpAddressQuery(
    // TODO(EXT-669): re-enable this once we have an onramp for the Extension.
    isWeb ? skipToken : undefined
  )

  const fiatOnRampEligible = Boolean(ipAddressData?.isBuyAllowed)

  return (
    <Flex>
      <SectionHeader title={t('tokens.selector.section.yours')} />
      <Flex pt="$spacing16" px="$spacing16">
        {isLoading ? (
          <Flex centered row flexDirection="row" gap="$spacing4" mt="$spacing60" p="$spacing4">
            <SpinningLoader color="$neutral3" size={iconSizes.icon64} />
          </Flex>
        ) : (
          <BaseCard.EmptyState
            buttonLabel={
              fiatOnRampEligible
                ? t('tokens.selector.empty.buy.title')
                : t('tokens.selector.empty.receive.title')
            }
            description={
              fiatOnRampEligible
                ? t('tokens.selector.empty.buy.message')
                : t('tokens.selector.empty.receive.message')
            }
            title={t('tokens.selector.empty.title')}
            onPress={onEmptyActionPress}
          />
        )}
      </Flex>
    </Flex>
  )
}

function _TokenSelectorSendList({
  onSelectCurrency,
  chainFilter,
  onEmptyActionPress,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: ChainId | null
  onEmptyActionPress: () => void
}): JSX.Element {
  const { data: sections, loading, error, refetch } = useTokenSectionsForSend(chainFilter)
  const emptyElement = useMemo(
    () => <EmptyList onEmptyActionPress={onEmptyActionPress} />,
    [onEmptyActionPress]
  )

  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={false}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSendList = memo(_TokenSelectorSendList)
