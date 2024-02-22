import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { usePortfolioTokenOptions } from 'wallet/src/components/TokenSelector/hooks'
import {
  SectionHeader,
  TokenSelectorList,
} from 'wallet/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenSection } from 'wallet/src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'wallet/src/components/TokenSelector/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { GqlResult } from 'wallet/src/features/dataApi/types'
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
    () => getTokenOptionsSection(t('Your tokens'), portfolioTokenOptions),
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
  const { data: ipAddressData, isLoading } = useFiatOnRampIpAddressQuery()

  const fiatOnRampEligible = Boolean(ipAddressData?.isBuyAllowed)

  return (
    <Flex>
      <SectionHeader title={t('Your tokens')} />
      <Flex pt="$spacing16" px="$spacing16">
        {isLoading ? (
          <Flex centered row flexDirection="row" gap="$spacing4" mt="$spacing60" p="$spacing4">
            <SpinningLoader color="$neutral3" size={iconSizes.icon64} />
          </Flex>
        ) : (
          <BaseCard.EmptyState
            buttonLabel={fiatOnRampEligible ? t('Buy crypto') : t('Receive tokens')}
            description={
              fiatOnRampEligible
                ? t('Buy crypto with a card or bank to send tokens.')
                : t('Transfer tokens from a centralized exchange or another wallet to send tokens.')
            }
            title={t('No tokens yet')}
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
