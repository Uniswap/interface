import { SendFormScreen } from 'src/app/features/transfer/SendFormScreen/SendFormScreen'
import { SendReviewScreen } from 'src/app/features/transfer/SendReviewScreen/SendReviewScreen'
import {
  TransferContextProvider,
  TransferScreen,
  useTransferContext,
} from 'src/app/features/transfer/TransferContext'
import { Flex } from 'ui/src'

export function TransferFlowScreen(): JSX.Element {
  return (
    <TransferContextProvider>
      <Flex fill p="$spacing16">
        <CurrentScreen />
      </Flex>
    </TransferContextProvider>
  )
}

function CurrentScreen(): JSX.Element {
  const { screen } = useTransferContext()

  switch (screen) {
    case TransferScreen.SendForm:
      return <SendFormScreen />
    case TransferScreen.SendReview:
      return <SendReviewScreen />
    default:
      throw new Error(`Unknown screen: ${screen}`)
  }
}
