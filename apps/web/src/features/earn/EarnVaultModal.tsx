import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, SegmentedControl, Text, TouchableArea } from 'ui/src'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { findMockEarnPosition } from '~/features/earn/_fixtures/positions'
import type { MockEarnVault } from '~/features/earn/_fixtures/vaults'
import { MOCK_USDC_BALANCE } from '~/features/earn/_fixtures/walletBalances'
import { BalanceTab } from '~/features/earn/BalanceTab'
import { DepositAmountView } from '~/features/earn/DepositAmountView'
import { DepositReviewView } from '~/features/earn/DepositReviewView'
import { DetailsTab } from '~/features/earn/DetailsTab'
import { DEFAULT_WITHDRAW_CHAIN_ID, WithdrawAmountView } from '~/features/earn/WithdrawAmountView'
import { WithdrawReviewView } from '~/features/earn/WithdrawReviewView'

interface EarnVaultModalProps {
  vault: MockEarnVault | null
  isOpen: boolean
  onClose: () => void
}

type EarnVaultTab = 'balance' | 'details'
type FlowView = 'vault' | 'deposit-amount' | 'deposit-review' | 'withdraw-amount' | 'withdraw-review'

// Single Modal hosts the entire vault → {deposit,withdraw}-{amount,review} flow so the
// backdrop never unmounts between transitions, avoiding a visible overlay flicker.
export function EarnVaultModal({ vault, isOpen, onClose }: EarnVaultModalProps) {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(vault?.currencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''

  const position = findMockEarnPosition(vault?.id)
  const hasPosition = position !== undefined

  const [selectedTab, setSelectedTab] = useState<EarnVaultTab>(hasPosition ? 'balance' : 'details')
  const [flowView, setFlowView] = useState<FlowView>('vault')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawChainId, setWithdrawChainId] = useState<UniverseChainId>(DEFAULT_WITHDRAW_CHAIN_ID)

  // Reset tab + flow view when the modal target changes so each vault opens fresh.
  useEffect(() => {
    if (isOpen) {
      setSelectedTab(hasPosition ? 'balance' : 'details')
      setFlowView('vault')
      setDepositAmount('')
      setWithdrawAmount('')
      setWithdrawChainId(DEFAULT_WITHDRAW_CHAIN_ID)
    }
  }, [isOpen, vault?.id, hasPosition])

  const handleClose = useCallback(() => {
    setFlowView('vault')
    setDepositAmount('')
    setWithdrawAmount('')
    setWithdrawChainId(DEFAULT_WITHDRAW_CHAIN_ID)
    onClose()
  }, [onClose])

  const handleDeposit = useCallback(() => setFlowView('deposit-amount'), [])
  const handleBackToVault = useCallback(() => {
    setDepositAmount('')
    setFlowView('vault')
  }, [])
  const handleReview = useCallback((submittedAmount: string) => {
    setDepositAmount(submittedAmount)
    setFlowView('deposit-review')
  }, [])
  const handleBackToAmount = useCallback(() => setFlowView('deposit-amount'), [])

  const handleWithdraw = useCallback(() => setFlowView('withdraw-amount'), [])
  const handleBackFromWithdrawAmount = useCallback(() => {
    setWithdrawAmount('')
    setFlowView('vault')
  }, [])
  const handleWithdrawReview = useCallback(({ amount, chainId }: { amount: string; chainId: UniverseChainId }) => {
    setWithdrawAmount(amount)
    setWithdrawChainId(chainId)
    setFlowView('withdraw-review')
  }, [])
  const handleBackToWithdrawAmount = useCallback(() => setFlowView('withdraw-amount'), [])

  return (
    <Modal
      name={ModalName.EarnVault}
      isModalOpen={isOpen}
      maxWidth={420}
      padding="$spacing16"
      gap="$spacing16"
      backgroundColor="$surface1"
      onClose={handleClose}
    >
      {vault && flowView === 'vault' && (
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
            <ModalCloseIcon onClose={handleClose} />
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

          {hasPosition && selectedTab === 'balance' ? (
            <BalanceTab position={position} onDeposit={handleDeposit} onWithdraw={handleWithdraw} />
          ) : (
            <DetailsTab vault={vault} hasPosition={hasPosition} onDeposit={handleDeposit} />
          )}
        </>
      )}

      {vault && flowView === 'deposit-amount' && (
        <DepositAmountView
          vault={vault}
          availableBalance={MOCK_USDC_BALANCE}
          initialAmount={depositAmount}
          onBack={handleBackToVault}
          onClose={handleClose}
          onReview={handleReview}
        />
      )}

      {vault && flowView === 'deposit-review' && (
        <DepositReviewView
          vault={vault}
          amount={depositAmount}
          onBack={handleBackToAmount}
          onClose={handleClose}
          onDeposit={handleClose}
        />
      )}

      {vault && position && flowView === 'withdraw-amount' && (
        <WithdrawAmountView
          vault={vault}
          availableBalance={position.depositedUsd}
          initialAmount={withdrawAmount}
          initialChainId={withdrawChainId}
          onBack={handleBackFromWithdrawAmount}
          onClose={handleClose}
          onReview={handleWithdrawReview}
        />
      )}

      {vault && flowView === 'withdraw-review' && (
        <WithdrawReviewView
          vault={vault}
          amount={withdrawAmount}
          chainId={withdrawChainId}
          onBack={handleBackToWithdrawAmount}
          onClose={handleClose}
          onWithdraw={handleClose}
        />
      )}
    </Modal>
  )
}
