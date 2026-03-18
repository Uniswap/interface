import { TradingApi } from '@universe/api'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { zIndexes } from 'ui/src/theme'
import { TransactionDetailsHeaderLogo } from 'uniswap/src/components/activity/details/TransactionDetailsHeaderLogo'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { FORMAT_DATE_TIME_MEDIUM, useFormattedDateTime } from 'uniswap/src/features/language/localizedDayjs'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function TransactionDetailsHeader({
  transactionDetails,
  transactionActions,
  hideTransactionActions = false,
}: {
  transactionDetails: TransactionDetails
  transactionActions: MenuOptionItem[]
  hideTransactionActions?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { value: isContextMenuOpen, setTrue: openContextMenu, setFalse: closeContextMenu } = useBooleanState(false)
  const showTransactionActions = transactionActions.length > 0 && !hideTransactionActions

  const dateString = useFormattedDateTime(dayjs(transactionDetails.addedTime), FORMAT_DATE_TIME_MEDIUM)
  const title = getTransactionSummaryTitle(transactionDetails, t)

  return (
    <Flex centered row justifyContent="space-between">
      <Flex centered row gap="$spacing12" flexShrink={1}>
        <Flex>
          <TransactionDetailsHeaderLogo transactionDetails={transactionDetails} />
        </Flex>
        <Flex flexDirection="column" flexShrink={1}>
          <Flex centered row gap="$spacing4" justifyContent="flex-start">
            {(transactionDetails.routing === TradingApi.Routing.DUTCH_V2 ||
              transactionDetails.routing === TradingApi.Routing.DUTCH_LIMIT) && <UniswapX size="$icon.16" />}
            <Text variant="body2">{title}</Text>
          </Flex>
          <Text color="$neutral2" variant="body4">
            {dateString}
          </Text>
        </Flex>
      </Flex>
      <Flex row centered gap="$spacing8">
        {transactionDetails.status === TransactionStatus.AwaitingAction && (
          <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
        )}
        {showTransactionActions && (
          <ContextMenu
            menuItems={transactionActions}
            triggerMode={ContextMenuTriggerMode.Primary}
            isOpen={isContextMenuOpen}
            closeMenu={closeContextMenu}
            openMenu={openContextMenu}
            adaptToSheet={false}
            zIndex={zIndexes.overlay}
          >
            <Flex borderRadius="$roundedFull" p="$spacing4">
              <Ellipsis color="$neutral2" size="$icon.20" />
            </Flex>
          </ContextMenu>
        )}
      </Flex>
    </Flex>
  )
}
