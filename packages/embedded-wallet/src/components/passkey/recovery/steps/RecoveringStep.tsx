import type { TFunction } from 'i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function RecoveringStep({ t, message }: { t: TFunction; message?: string }): JSX.Element {
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <Flex gap="$gap24" alignItems="center" py="$spacing32">
        <SpinningLoader size={32} />
        <Text variant="body2" color="$neutral2" textAlign="center">
          {message ?? t('account.passkey.recovery.recovering')}
        </Text>
      </Flex>
    </Trace>
  )
}
