import { Percent } from '@uniswap/sdk-core'
import Modal from 'components/Modal'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useTheme } from 'lib/styled-components'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'
import { Trans } from 'uniswap/src/i18n'
import { useFormatter } from 'utils/formatNumbers'

interface PriceImpactModalProps {
  priceImpact: Percent
  onDismiss: () => void
  onContinue: () => void
}

export default function PriceImpactModal({ priceImpact, onDismiss, onContinue }: PriceImpactModalProps) {
  const theme = useTheme()
  const { formatPercent } = useFormatter()
  const impact = `${formatPercent(priceImpact)}`

  return (
    <Modal isOpen onDismiss={onDismiss}>
      <Flex width="100%" px="$spacing24" py="$spacing16" rowGap="$spacing24" backgroundColor="$surface1">
        <GetHelpHeader closeModal={onDismiss} />
        <Flex rowGap="$spacing16" alignItems="center">
          <Flex width="min-content" p="$spacing12" borderRadius="$rounded12" backgroundColor={theme.critical2}>
            <AlertTriangle color="$statusCritical" size="$icon.28" />
          </Flex>
          <Flex alignItems="center" rowGap="$spacing8">
            <Text variant="heading3">
              <Trans i18nKey="token.safetyLevel.strong.header" />
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
          <Button // TODO: Replace with spore version when spore variant of secondary buttton is implemented
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
            <Text variant="buttonLabel3">
              <Trans i18nKey="common.button.cancel" />
            </Text>
          </Button>
          <Button // TODO: Replace with spore version when spore variant of critical buttton is implemented
            flex={1}
            px={12}
            py={8}
            size="small"
            backgroundColor="$statusCritical"
            onPress={onContinue}
            hoverStyle={{ opacity: 0.9, backgroundColor: '$statusCritical' }}
            pressStyle={{ opacity: 0.7, backgroundColor: '$statusCritical' }}
          >
            <Text variant="buttonLabel3">
              <Trans i18nKey="common.button.continue" />
            </Text>
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
