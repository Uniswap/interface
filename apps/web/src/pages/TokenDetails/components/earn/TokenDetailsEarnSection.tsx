import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type TokenDetailsEarnSectionProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnSection({ earnData }: TokenDetailsEarnSectionProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const { closeModal, openDepositModal, openModal, openWithdrawModal, selectedVaultState } = useEarnVaultModalState()
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldAutoOpenModal = searchParams.get(EARN_VAULT_MODAL_QUERY_PARAM) === EARN_VAULT_MODAL_QUERY_VALUE

  const { earnPosition, earnVault, userHasEarnPosition } = earnData

  // Auto-open the modal when deep-linked via ?modal=earn-vault (e.g., from the extension's
  // earn positions list). Waits for `earnVault` to load before opening, then strips the param
  // so refresh/back-nav doesn't re-trigger.
  useEffect(() => {
    if (!shouldAutoOpenModal || !earnVault) {
      return
    }
    openModal(earnVault)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(EARN_VAULT_MODAL_QUERY_PARAM)
        return next
      },
      { replace: true },
    )
  }, [shouldAutoOpenModal, earnVault, openModal, setSearchParams])

  if (!earnVault) {
    return null
  }

  return (
    <>
      {earnPosition && userHasEarnPosition && (
        <Flex gap="$spacing12" width="100%">
          <Flex gap="$spacing8" width="100%">
            <Text variant="body1" color="$neutral1">
              {t('explore.earn.title')}
            </Text>

            <TouchableArea
              row
              alignItems="center"
              gap="$spacing8"
              width="100%"
              py="$spacing4"
              borderRadius="$rounded8"
              hoverStyle={{ backgroundColor: '$surface2' }}
              onPress={() => openModal(earnVault)}
            >
              <Text variant="body2" color="$neutral2" flex={1} minWidth={0}>
                {t('explore.earn.vault.deposited')}
              </Text>
              <Text variant="body2" color="$neutral1" textAlign="right" whiteSpace="nowrap">
                {convertFiatAmountFormatted(earnPosition.depositedUsd, NumberType.PortfolioBalance)}
              </Text>
              <Flex width="$spacing4" height="$spacing4" borderRadius="$roundedFull" backgroundColor="$neutral3" />
              <Text variant="body2" color="$accent1" textAlign="right" whiteSpace="nowrap">
                {t('explore.earn.apy', { apy: formatPercent(earnPosition.apyPercent) })}
              </Text>
              <RotatableChevron direction="right" color="$neutral2" size="$icon.16" />
            </TouchableArea>
          </Flex>

          <Flex row gap="$spacing8">
            <Button size="small" emphasis="tertiary" onPress={() => openWithdrawModal(earnVault)}>
              {t('explore.earn.vault.withdraw')}
            </Button>
            <Button size="small" emphasis="secondary" onPress={() => openDepositModal(earnVault)}>
              {t('explore.earn.vault.deposit')}
            </Button>
          </Flex>
        </Flex>
      )}

      <EarnVaultModal
        vault={selectedVaultState?.vault ?? null}
        prefetchedPosition={selectedVaultState ? earnPosition : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
      />
    </>
  )
}
