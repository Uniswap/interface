import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { SendFormScreen } from 'src/app/features/send/SendFormScreen/SendFormScreen'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModal } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { SendContextProvider } from 'wallet/src/features/transactions/contexts/SendContext'

export function SendFlow(): JSX.Element {
  const { t } = useTranslation()
  const { navigateBack, locationState } = useExtensionNavigation()

  return (
    <TransactionModal modalName={ModalName.Send} onClose={() => null}>
      <SendContextProvider prefilledTransactionState={locationState?.initialTransactionState}>
        <Flex fill py="$spacing8">
          <Flex px="$spacing8">
            <ScreenHeader Icon={X} title={t('send.title')} onBackClick={navigateBack} />
          </Flex>
          <Flex fill grow pt="$spacing8" px={SCREEN_ITEM_HORIZONTAL_PAD}>
            <SendFormScreen />
          </Flex>
        </Flex>
      </SendContextProvider>
    </TransactionModal>
  )
}
