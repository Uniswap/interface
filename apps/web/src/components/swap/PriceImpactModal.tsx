import { Percent } from '@uniswap/sdk-core'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useFormatter } from 'utils/formatNumbers'

interface PriceImpactModalProps {
  priceImpact: Percent
  onDismiss: () => void
  onContinue: () => void
}

export default function PriceImpactModal({ priceImpact, onDismiss, onContinue }: PriceImpactModalProps) {
  const { formatPercent } = useFormatter()
  const impact = `${formatPercent(priceImpact)}`
  const { t } = useTranslation()

  return (
    <Modal name={ModalName.PriceImpact} isModalOpen onClose={onDismiss} padding={0}>
      <Flex width="100%" px="$spacing24" py="$spacing16" rowGap="$spacing24" backgroundColor="$surface1">
        <GetHelpHeader closeModal={onDismiss} />
        <Flex rowGap="$spacing16" alignItems="center">
          <Flex width="min-content" p="$spacing12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
            <AlertTriangleFilled color="$statusCritical" size="$icon.28" />
          </Flex>
          <Flex alignItems="center" rowGap="$spacing8">
            <Text variant="heading3">{t('common.warning')}</Text>
            <Text variant="body1" color="$neutral2" textAlign="center">
              <Trans
                i18nKey="swap.warning.priceImpact"
                components={{
                  impact: (
                    <Text variant="body1" color="$statusCritical" textAlign="center">
                      {impact}
                    </Text>
                  ),
                }}
              />
            </Text>
          </Flex>
        </Flex>
        <Flex row columnGap="$spacing8">
          <Button onPress={onDismiss} emphasis="secondary">
            {t('common.button.cancel')}
          </Button>
          <Button onPress={onContinue} variant="critical">
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
