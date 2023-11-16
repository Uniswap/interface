import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import Trace from 'src/components/Trace/Trace'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import PaperStackIcon from 'ui/src/assets/icons/paper-stack.svg'
import { colors as rawColors, iconSizes } from 'ui/src/theme'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { opacify } from 'wallet/src/utils/colors'

interface ActionCardItem {
  title: string
  blurb: string
  icon: JSX.Element
  onPress: () => void
  elementName: ElementName
  badgeText?: string
}

enum ActionOption {
  Buy = 'Buy',
  Import = 'Import',
  Receive = 'Receive',
}

export function WalletEmptyState(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()
  const isViewOnly = activeAccount?.type === AccountType.Readonly

  const options: { [key in ActionOption]: ActionCardItem } = useMemo(
    () => ({
      [ActionOption.Buy]: {
        title: t('Buy crypto'),
        blurb: t('You’ll need ETH to get started. Buy with a card or bank.'),
        elementName: ElementName.EmptyStateBuy,
        icon: (
          <IconContainer
            backgroundColor={rawColors.green200}
            icon={
              <IconContainer
                backgroundColor={rawColors.green200}
                icon={<Icons.Buy color={rawColors.green200} size="$icon.20" />}
              />
            }
          />
        ),
        onPress: () => dispatch(openModal({ name: ModalName.FiatOnRamp })),
      },
      [ActionOption.Receive]: {
        title: t('Receive funds'),
        blurb: t('Transfer tokens from another wallet or crypto exchange.'),
        elementName: ElementName.EmptyStateReceive,
        icon: (
          <IconContainer
            backgroundColor={rawColors.gold300}
            icon={
              <IconContainer
                backgroundColor={rawColors.gold300}
                icon={<Icons.ArrowDownCircleFilled color={rawColors.gold300} size="$icon.20" />}
              />
            }
          />
        ),
        onPress: () =>
          dispatch(
            openModal({
              name: ModalName.WalletConnectScan,
              initialState: ScannerModalState.WalletQr,
            })
          ),
      },
      [ActionOption.Import]: {
        title: t('Import wallet'),
        blurb: t(`Enter this wallet’s recovery phrase to begin swapping and sending.`),
        elementName: ElementName.EmptyStateImport,
        icon: (
          <IconContainer
            backgroundColor={rawColors.violet400}
            icon={
              <PaperStackIcon
                color={rawColors.violet400}
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            }
          />
        ),
        onPress: () => dispatch(openModal({ name: ModalName.AccountSwitcher })),
      },
    }),
    [dispatch, t]
  )

  // Order options based on view only status
  const sortedOptions = isViewOnly ? [options.Import] : [options.Buy, options.Receive]

  return (
    <Flex gap="$spacing8">
      {sortedOptions.map((option) => (
        <ActionCard key={option.title} {...option} />
      ))}
    </Flex>
  )
}

const ActionCard = ({ title, blurb, onPress, icon, elementName }: ActionCardItem): JSX.Element => (
  <Trace logPress element={elementName}>
    <TouchableArea backgroundColor="$surface2" borderRadius="$rounded20" onPress={onPress}>
      <Flex centered row gap="$spacing16" p="$spacing16">
        {icon}
        <Flex shrink gap="$spacing4" width="100%">
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="subheading2">{title}</Text>
          </Flex>
          <Text color="$neutral2" variant="body2">
            {blurb}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  </Trace>
)

const IconContainer = ({
  backgroundColor,
  icon,
}: {
  backgroundColor: string
  icon: JSX.Element
}): JSX.Element => (
  <Flex
    centered
    borderRadius="$roundedFull"
    height={iconSizes.icon36}
    style={{ backgroundColor: opacify(10, backgroundColor) }}
    width={iconSizes.icon36}>
    {icon}
  </Flex>
)
