import { useTranslation } from 'react-i18next'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { DeprecatedButton } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export function ReceiveButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  const openReceiveModal = useOpenReceiveModal()

  return (
    <Trace logPress element={ElementName.Receive}>
      <DeprecatedButton
        size="medium"
        theme="secondary"
        width="100%"
        onPress={() => {
          openReceiveModal()
          onPress?.()
        }}
      >
        {t('common.receive')}
      </DeprecatedButton>
    </Trace>
  )
}
