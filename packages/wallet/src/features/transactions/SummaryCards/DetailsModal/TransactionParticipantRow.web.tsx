import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Popover } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { isMobileApp } from 'utilities/src/platform'
import { MenuContent } from 'wallet/src/components/menu/MenuContent'
import { MenuContentItem } from 'wallet/src/components/menu/types'
import { InfoRow } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/InfoRow'
import { TransactionParticipantDisplay } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionParticipantDisplay'
import { TransactionParticipantRowProps } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'

export function TransactionParticipantRow({ address, isSend = false }: TransactionParticipantRowProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onCopyAddress = async (): Promise<void> => {
    await setClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
  }

  const options: MenuContentItem[] = [
    {
      label: 'Copy address',
      onPress: onCopyAddress,
      Icon: !isMobileApp ? ExternalLink : undefined,
      iconPlacement: 'left',
      iconTextGap: '$spacing8',
    },
  ]

  return (
    <InfoRow label={isSend ? t('common.text.recipient') : t('common.text.sender')}>
      <Popover hoverable placement="top-end">
        <Popover.Trigger>
          <TransactionParticipantDisplay address={address} />
        </Popover.Trigger>
        <Popover.Content
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          borderColor="$surface3"
          borderRadius="$rounded16"
          borderWidth="$spacing1"
          disableRemoveScroll={false}
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          p="$none"
        >
          <Flex>
            <MenuContent items={options} />
          </Flex>
        </Popover.Content>
      </Popover>
    </InfoRow>
  )
}
