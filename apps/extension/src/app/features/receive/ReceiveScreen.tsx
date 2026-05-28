import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { ReceiveQRCode } from 'uniswap/src/components/ReceiveQRCode/ReceiveQRCode'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function ReceiveScreen(): JSX.Element {
  const { t } = useTranslation()
  const { navigateBack } = useExtensionNavigation()
  const activeAddress = useActiveAccountAddressWithThrow()

  return (
    <Trace logImpression modal={ModalName.ReceiveCryptoModal}>
      <Flex fill py="$spacing8">
        <Flex px="$spacing8">
          <ScreenHeader Icon={X} title={t('home.label.receive')} onBackClick={navigateBack} />
        </Flex>
        <Flex fill grow pt="$spacing12" px={SCREEN_ITEM_HORIZONTAL_PAD} testID="wallet-qr-code">
          <ReceiveQRCode address={activeAddress} />
        </Flex>
      </Flex>
    </Trace>
  )
}
