import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, SegmentedControl, Text, TouchableArea } from 'ui/src'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { BalanceTab } from '~/features/earn/BalanceTab'
import { DetailsTab } from '~/features/earn/DetailsTab'
import type { EarnVaultTab } from '~/features/earn/hooks/useEarnVaultModalFlow'

interface EarnVaultOverviewProps {
  accountDrawerOpen: () => void
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  hasPosition: boolean
  isConnected: boolean
  onClose: () => void
  onDeposit: () => void
  onWithdraw: () => void
  position: EarnPositionInfo | undefined
  selectedTab: EarnVaultTab
  setSelectedTab: (tab: EarnVaultTab) => void
  symbol: string
  vault: EarnVaultInfo
}

export function EarnVaultOverview({
  accountDrawerOpen,
  currencyInfo,
  hasPosition,
  isConnected,
  onClose,
  onDeposit,
  onWithdraw,
  position,
  selectedTab,
  setSelectedTab,
  symbol,
  vault,
}: EarnVaultOverviewProps): JSX.Element {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency

  return (
    <>
      <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing12">
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing4"
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded12"
          backgroundColor="$surface1"
          px="$spacing8"
          py="$spacing4"
          hoverStyle={{ backgroundColor: '$surface2' }}
          onPress={() => {
            // TODO(CONS-1781): wire Help button to the correct support article.
          }}
        >
          <MessageQuestion color="$neutral1" size="$icon.16" />
          <Text variant="buttonLabel4" color="$neutral1">
            {t('common.help')}
          </Text>
        </TouchableArea>
        <ModalCloseIcon onClose={onClose} />
      </Flex>

      <Flex alignItems="center" gap="$spacing8" pt="$spacing4">
        <TokenLogo
          url={currencyInfo?.logoUrl}
          size={iconSizes.icon48}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
          hideNetworkLogo
        />
        <Flex alignItems="center" gap="$spacing2">
          <Text variant="heading3" color="$neutral1">
            {t('explore.earn.vault.title', { symbol })}
          </Text>
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('explore.earn.vault.subtitle', { symbol })}
          </Text>
        </Flex>
      </Flex>

      {hasPosition && (
        <SegmentedControl<EarnVaultTab>
          size="large"
          fullWidth
          options={[
            { value: 'balance', displayText: t('explore.earn.vault.balance.tab') },
            { value: 'details', displayText: t('explore.earn.vault.details.tab') },
          ]}
          selectedOption={selectedTab}
          onSelectOption={setSelectedTab}
        />
      )}

      {position && selectedTab === 'balance' ? (
        <BalanceTab position={position} onDeposit={onDeposit} onWithdraw={onWithdraw} />
      ) : (
        <DetailsTab
          vault={vault}
          hasPosition={hasPosition}
          isConnected={isConnected}
          onDeposit={onDeposit}
          onConnectWallet={accountDrawerOpen}
        />
      )}
    </>
  )
}
