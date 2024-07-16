import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { SendFormScreen } from 'src/app/features/transfer/SendFormScreen/SendFormScreen'
import { TransferContextProvider } from 'src/app/features/transfer/TransferContext'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { X } from 'ui/src/components/icons'

export function TransferFlowScreen(): JSX.Element {
  const { t } = useTranslation()
  const { navigateBack, locationState } = useExtensionNavigation()

  return (
    <TransferContextProvider prefilledTransactionState={locationState?.initialTransactionState}>
      <Flex fill py="$spacing8">
        <Flex px="$spacing8">
          <ScreenHeader Icon={X} title={t('send.title')} onBackClick={navigateBack} />
        </Flex>
        <Flex fill grow pt="$spacing8" px={SCREEN_ITEM_HORIZONTAL_PAD}>
          <SendFormScreen />
        </Flex>
      </Flex>
    </TransferContextProvider>
  )
}
