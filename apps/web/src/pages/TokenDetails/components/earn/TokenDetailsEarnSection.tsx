import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { type EarnVaultModalInitialView, EarnVaultView } from '~/features/earn/hooks/useEarnVaultModalFlow'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type ModalState = {
  initialView: EarnVaultModalInitialView
}

type TokenDetailsEarnSectionProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnSection({ earnData }: TokenDetailsEarnSectionProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const [modalState, setModalState] = useState<ModalState | null>(null)

  const { earnPosition, earnVault, userHasEarnPosition } = earnData

  const openModal = useCallback((initialView: EarnVaultModalInitialView) => {
    setModalState({ initialView })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalState(null)
  }, [])

  if (!earnVault || !earnPosition || !userHasEarnPosition) {
    return null
  }

  const depositedAmount = convertFiatAmountFormatted(earnPosition.depositedUsd, NumberType.PortfolioBalance)
  const apy = t('explore.earn.apy', { apy: formatPercent(earnPosition.apyPercent) })

  return (
    <>
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
            onPress={() => openModal(EarnVaultView.Vault)}
          >
            <Text variant="body2" color="$neutral2" flex={1} minWidth={0}>
              {t('explore.earn.vault.deposited')}
            </Text>
            <Text variant="body2" color="$neutral1" textAlign="right" whiteSpace="nowrap">
              {depositedAmount}
            </Text>
            <Flex width="$spacing4" height="$spacing4" borderRadius="$roundedFull" backgroundColor="$neutral3" />
            <Text variant="body2" color="$accent1" textAlign="right" whiteSpace="nowrap">
              {apy}
            </Text>
            <RotatableChevron direction="right" color="$neutral2" size="$icon.16" />
          </TouchableArea>
        </Flex>

        <Flex row gap="$spacing8">
          <Button size="small" emphasis="tertiary" onPress={() => openModal(EarnVaultView.WithdrawAmount)}>
            {t('explore.earn.vault.withdraw')}
          </Button>
          <Button size="small" emphasis="secondary" onPress={() => openModal(EarnVaultView.DepositAmount)}>
            {t('explore.earn.vault.deposit')}
          </Button>
        </Flex>
      </Flex>

      <EarnVaultModal
        vault={earnVault}
        prefetchedPosition={earnPosition}
        initialView={modalState?.initialView}
        isOpen={modalState !== null}
        onClose={handleCloseModal}
      />
    </>
  )
}
