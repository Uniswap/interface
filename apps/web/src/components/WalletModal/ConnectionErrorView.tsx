import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Button, Flex, styled } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

const Wrapper = styled(Flex, {
  row: false,
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  p: '$spacing24',
  '$platform-web': {
    flexFlow: 'column nowrap',
  },
})

const AlertTriangleIcon = styled(AlertTriangle, {
  width: 48,
  height: 48,
  strokeWidth: 1.5,
  m: '$spacing36',
  color: '$statusCritical',
})

export default function ConnectionErrorView() {
  const { connectWallet, isConnecting, variables, reset, error } = useConnectWallet()

  const retry = useEvent(() => {
    const lastWallet = variables?.wallet
    reset()

    if (lastWallet) {
      connectWallet({ wallet: lastWallet })
    }
  })

  return !isConnecting && error ? (
    <Modal name={ModalName.ConnectionError} isModalOpen={Boolean(error)} onClose={reset} padding={0}>
      <Wrapper>
        <AlertTriangleIcon />
        <ThemedText.HeadlineSmall marginBottom="8px">
          <Trans i18nKey="common.errorConnecting.error" />
        </ThemedText.HeadlineSmall>
        <ThemedText.BodyPrimary fontSize={16} marginBottom={24} lineHeight="24px" textAlign="center">
          <Trans i18nKey="wallet.connectionFailed.message" />
        </ThemedText.BodyPrimary>
        <Button emphasis="primary" variant="branded" size="large" onPress={retry}>
          <Trans i18nKey="common.tryAgain.error" />
        </Button>
        <Flex row>
          <Button
            emphasis="text-only"
            variant="branded"
            width="fit-content"
            p="$none"
            mt="$spacing20"
            // Reset connection to prevent being stuck in an error state
            onPress={reset}
          >
            <Trans i18nKey="common.close" />
          </Button>
        </Flex>
      </Wrapper>
    </Modal>
  ) : null
}
