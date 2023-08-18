import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { UNISWAP_HELP_CENTER_WALLET_URL } from 'src/constants/urls'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { opacify } from 'src/utils/colors'
import { openUri } from 'src/utils/linking'
import BookIcon from 'ui/src/assets/icons/book.svg'
import DollarSign from 'ui/src/assets/icons/dollar.svg'
import PaperStackIcon from 'ui/src/assets/icons/paper-stack.svg'
import ScanIcon from 'ui/src/assets/icons/scan-receive.svg'
import { colors, iconSizes } from 'ui/src/theme'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

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
  Learn = 'Learn',
  Scan = 'Scan',
}

export function WalletEmptyState(): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()
  const isViewOnly = activeAccount?.type === AccountType.Readonly

  const options: { [key in ActionOption]: ActionCardItem } = useMemo(
    () => ({
      [ActionOption.Buy]: {
        title: t('Buy Crypto'),
        badgeText: t('Popular'),
        blurb: t('You’ll need ETH to get started. Buy with a card or bank.'),
        elementName: ElementName.EmptyStateBuy,
        icon: (
          <IconContainer
            backgroundColor={colors.green200}
            icon={
              <IconContainer
                backgroundColor={colors.green200}
                icon={
                  <DollarSign
                    color={colors.green200}
                    height={iconSizes.icon20}
                    width={iconSizes.icon20}
                  />
                }
              />
            }
          />
        ),
        onPress: () => dispatch(openModal({ name: ModalName.FiatOnRamp })),
      },
      [ActionOption.Scan]: {
        title: t('Receive funds'),
        blurb: t('Transfer tokens from another wallet or crypto exchange.'),
        elementName: ElementName.EmptyStateReceive,
        icon: (
          <IconContainer
            backgroundColor={colors.gold300}
            icon={
              <IconContainer
                backgroundColor={colors.gold300}
                icon={
                  <ScanIcon
                    color={colors.gold300}
                    height={iconSizes.icon16}
                    width={iconSizes.icon16}
                  />
                }
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
      [ActionOption.Learn]: {
        title: t('Get started with Uniswap Wallet'),
        blurb: isViewOnly
          ? t('Explore and learn the essentials of what’s possible.')
          : t('Explore and learn the essentials of your new wallet.'),
        elementName: ElementName.EmptyStateGetStarted,
        icon: (
          <IconContainer
            backgroundColor={colors.blue300}
            icon={
              <BookIcon
                color={theme.colors.DEP_blue300}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            }
          />
        ),
        onPress: () => openUri(UNISWAP_HELP_CENTER_WALLET_URL),
      },
      [ActionOption.Import]: {
        title: t('Import wallet'),
        blurb: t(`Enter this wallet's recovery phrase to begin swapping and sending.`),
        elementName: ElementName.EmptyStateImport,
        icon: (
          <IconContainer
            backgroundColor={colors.violet400}
            icon={
              <PaperStackIcon
                color={colors.violet400}
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            }
          />
        ),
        onPress: () => dispatch(dispatch(openModal({ name: ModalName.AccountSwitcher }))),
      },
    }),
    [dispatch, isViewOnly, t, theme.colors]
  )

  // Order options based on view only status
  const sortedOptions = isViewOnly
    ? [options.Import, options.Learn, options.Scan]
    : [...(!isViewOnly ? [options.Buy] : []), options.Scan, options.Learn]

  return (
    <Flex gap="spacing8">
      {sortedOptions.map((option) => (
        <ActionCard key={option.title} {...option} />
      ))}
    </Flex>
  )
}

const ActionCard = ({
  title,
  blurb,
  onPress,
  icon,
  badgeText,
  elementName,
}: ActionCardItem): JSX.Element => (
  <Trace logPress element={elementName}>
    <TouchableArea backgroundColor="surface2" borderRadius="rounded20" onPress={onPress}>
      <Flex centered row p="spacing16">
        {icon}
        <Flex flexShrink={1} gap="spacing4">
          <Flex row alignItems="center" gap="spacing8">
            <Text variant="subheadSmall">{title}</Text>
            {badgeText && (
              <Flex
                centered
                backgroundColor="DEP_magentaDark"
                borderRadius="rounded8"
                px="spacing8"
                py="spacing4">
                <Text color="accent1" variant="buttonLabelMicro">
                  {badgeText}
                </Text>
              </Flex>
            )}
          </Flex>
          <Text color="neutral2" variant="bodySmall">
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
    borderRadius="roundedFull"
    height={iconSizes.icon36}
    style={{ backgroundColor: opacify(10, backgroundColor) }}
    width={iconSizes.icon36}>
    {icon}
  </Flex>
)
