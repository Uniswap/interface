import { Percent } from '@uniswap/sdk-core'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { Trans } from 'react-i18next'
import { DeprecatedButton, Flex, Text } from 'ui/src'
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

  return (
    <Modal name={ModalName.PriceImpact} isModalOpen onClose={onDismiss} padding={0}>
      <Flex width="100%" px="$spacing24" py="$spacing16" rowGap="$spacing24" backgroundColor="$surface1">
        <GetHelpHeader closeModal={onDismiss} />
        <Flex rowGap="$spacing16" alignItems="center">
          <Flex width="min-content" p="$spacing12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
            <AlertTriangleFilled color="$statusCritical" size="$icon.28" />
          </Flex>
          <Flex alignItems="center" rowGap="$spacing8">
            <Text variant="heading3">
              <Trans i18nKey="common.warning" />
            </Text>
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
          <DeprecatedButton // TODO: Replace with spore version when spore variant of secondary buttton is implemented
            flex={1}
            px={12}
            py={8}
            size="small"
            onPress={onDismiss}
            backgroundColor="$surface3"
            hoverStyle={{
              opacity: 0.9,
              backgroundColor: '$surface3',
            }}
            pressStyle={{
              opacity: 0.7,
              backgroundColor: '$surface3',
            }}
          >
            <Text variant="buttonLabel2">
              <Trans i18nKey="common.button.cancel" />
            </Text>
          </DeprecatedButton>
          <DeprecatedButton // TODO: Replace with spore version when spore variant of critical buttton is implemented
            flex={1}
            px={12}
            py={8}
            size="small"
            backgroundColor="$statusCritical"
            onPress={onContinue}
            hoverStyle={{ opacity: 0.9, backgroundColor: '$statusCritical' }}
            pressStyle={{ opacity: 0.7, backgroundColor: '$statusCritical' }}
          >
            <Text variant="buttonLabel2">
              <Trans i18nKey="common.button.continue" />
            </Text>
          </DeprecatedButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
