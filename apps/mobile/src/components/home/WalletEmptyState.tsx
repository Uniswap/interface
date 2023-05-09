import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import BookIcon from 'src/assets/icons/book.svg'
import DollarSign from 'src/assets/icons/dollar.svg'
import ScanIcon from 'src/assets/icons/scan-receive.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import { UNISWAP_HELP_CENTER_WALLET_URL } from 'src/constants/urls'
import { useFiatOnRampEnabled } from 'src/features/experiments/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
import { opacify } from 'src/utils/colors'
import { openUri } from 'src/utils/linking'
import { colors } from 'ui/src/theme/color'

interface ActionCardItem {
  title: string
  blurb: string
  icon: JSX.Element
  onPress: () => void
  badgeText?: string
}

export function WalletEmptyState(): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()
  const isFiatOnRampEnabled =
    useFiatOnRampEnabled() && activeAccount?.type === AccountType.SignerMnemonic

  const onPressBuy = (): void => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  const onPressReceive = (): void => {
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const onPressGetStarted = (): void => {
    openUri(UNISWAP_HELP_CENTER_WALLET_URL)
  }

  return (
    <Flex gap="spacing8">
      {isFiatOnRampEnabled && (
        <ActionCard
          badgeText={t('Popular')}
          blurb={t('You’ll need ETH to get started. Buy with a card or bank.')}
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
          title={t('Buy Crypto')}
          onPress={onPressBuy}
        />
      )}
      <ActionCard
        blurb={t('Transfer tokens from another wallet or crypto exchange.')}
        icon={
          <IconContainer
            backgroundColor={colors.gold300}
            icon={
              <ScanIcon color={colors.gold300} height={iconSizes.icon16} width={iconSizes.icon16} />
            }
          />
        }
        title={t('Receive funds')}
        onPress={onPressReceive}
      />
      <ActionCard
        blurb={t('Explore and learn the essentials of your new wallet.')}
        icon={
          <IconContainer
            backgroundColor={theme.colors.accentActive}
            icon={
              <BookIcon
                color={theme.colors.blue300}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            }
          />
        }
        title={t('Get started with Uniswap Wallet')}
        onPress={onPressGetStarted}
      />
    </Flex>
  )
}

const ActionCard = ({ title, blurb, onPress, icon, badgeText }: ActionCardItem): JSX.Element => (
  <TouchableArea backgroundColor="background2" borderRadius="rounded20" onPress={onPress}>
    <Flex centered row p="spacing16">
      {icon}
      <Flex flexShrink={1} gap="spacing4">
        <Flex row alignItems="center" gap="spacing8">
          <Text variant="subheadSmall">{title}</Text>
          {badgeText && (
            <Flex
              centered
              backgroundColor="magentaDark"
              borderRadius="rounded8"
              px="spacing8"
              py="spacing4">
              <Text color="magentaVibrant" variant="buttonLabelMicro">
                {badgeText}
              </Text>
            </Flex>
          )}
        </Flex>
        <Text color="textSecondary" variant="bodySmall">
          {blurb}
        </Text>
      </Flex>
    </Flex>
  </TouchableArea>
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
