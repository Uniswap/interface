import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { Route } from 'react-native-tab-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import DollarIcon from 'src/assets/icons/dollar-sign.svg'
import ReceiveArrow from 'src/assets/icons/receive-arrow.svg'
import SendIcon from 'src/assets/icons/send.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Flex } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import TabbedScrollScreen, {
  TabViewScrollProps,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { useFiatOnRampEnabled } from 'src/features/experiments/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'

const CONTENT_HEADER_HEIGHT_ESTIMATE = 186

export function HomeScreen() {
  // imports test account for easy development/testing
  useTestAccount()
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()

  const contentHeader = useMemo(
    () => (
      <Flex bg="backgroundBranded" gap="xmd" pb="md" px="lg">
        <AccountHeader />
        <PortfolioBalance owner={activeAccount.address} />
        <QuickActions />
      </Flex>
    ),
    [activeAccount.address]
  )

  const renderTab = useMemo(() => {
    return (
      route: Route,
      scrollProps: TabViewScrollProps,
      loadingContainerStyle: ViewStyle,
      setNftsTabReloadFn: (fn: () => void) => void
    ) => {
      switch (route?.key) {
        case SectionName.HomeNFTsTab:
          return (
            <NftsTab
              loadingContainerStyle={loadingContainerStyle}
              owner={activeAccount.address ?? ''}
              setReloadFn={setNftsTabReloadFn}
              tabViewScrollProps={scrollProps}
            />
          )
        case SectionName.HomeTokensTab:
          return (
            <TokensTab
              loadingContainerStyle={loadingContainerStyle}
              owner={activeAccount.address}
              tabViewScrollProps={scrollProps}
            />
          )
      }
      return null
    }
  }, [activeAccount.address])

  return (
    <TabbedScrollScreen
      contentHeader={contentHeader}
      headerHeightEstimate={CONTENT_HEADER_HEIGHT_ESTIMATE}
      osStatusBarBgColor="backgroundBranded"
      renderTab={renderTab}
      tabs={[
        { key: SectionName.HomeTokensTab, title: t('Tokens') },
        { key: SectionName.HomeNFTsTab, title: t('NFTs') },
      ]}
    />
  )
}

function QuickActions() {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()

  const { t } = useTranslation()

  const onPressBuy = () => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  const onPressReceive = () => {
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const onPressSend = useCallback(() => {
    dispatch(openModal({ name: ModalName.Send }))
  }, [dispatch])

  // hide fiat onramp banner when active account isn't a signer account.
  const fiatOnRampShown =
    useFiatOnRampEnabled() && activeAccount.type === AccountType.SignerMnemonic

  return (
    <Flex centered row gap="xs">
      <ActionButton
        Icon={SendIcon}
        label={t('Send')}
        name={ElementName.Send}
        onPress={onPressSend}
      />
      {fiatOnRampShown && (
        <ActionButton
          Icon={DollarIcon}
          label={t('Buy')}
          name={ElementName.Buy}
          onPress={onPressBuy}
        />
      )}
      <ActionButton
        Icon={ReceiveArrow}
        label={t('Receive')}
        name={ElementName.Receive}
        onPress={onPressReceive}
      />
    </Flex>
  )
}

function ActionButton({
  name,
  label,
  Icon,
  onPress,
}: {
  name: ElementName
  label: string
  Icon: React.FC<SvgProps>
  onPress: () => void
}) {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor={isDarkMode ? 'backgroundBranded' : 'background0'}
      borderColor="brandedAccentSoft"
      borderRadius="lg"
      borderWidth={1}
      flex={1}
      name={name}
      padding="sm"
      shadowColor={isDarkMode ? 'black' : 'brandedAccentSoft'}
      shadowOffset={SHADOW_OFFSET_SMALL}
      shadowOpacity={0.4}
      shadowRadius={6}
      onPress={onPress}>
      <Flex centered row gap="xxs">
        <Icon
          color={theme.colors.magentaVibrant}
          height={theme.iconSizes.md}
          strokeWidth={2}
          width={theme.iconSizes.md}
        />
        <Text color="accentAction" variant="buttonLabelMedium">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
