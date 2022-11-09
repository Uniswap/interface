import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { Route } from 'react-native-tab-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import SendIcon from 'src/assets/icons/send.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Arrow } from 'src/components/icons/Arrow'
import { Flex } from 'src/components/layout'
import TabbedScrollScreen, {
  TabViewScrollProps,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
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
      <Flex bg="background0" gap="sm" pb="md">
        <AccountHeader />
        <Flex gap="sm" px="lg">
          <PortfolioBalance owner={activeAccount.address} />
          <Flex pt="xxs">
            <QuickActions />
          </Flex>
        </Flex>
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
      renderTab={renderTab}
      tabs={[
        { key: SectionName.HomeTokensTab, title: t('Tokens') },
        { key: SectionName.HomeNFTsTab, title: t('NFTs') },
      ]}
    />
  )
}

function QuickActions() {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const onPressReceive = () => {
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const onPressSend = useCallback(() => {
    dispatch(openModal({ name: ModalName.Send }))
  }, [dispatch])

  return (
    <Flex centered row gap="xs">
      <Button
        fill
        CustomIcon={
          <SendIcon color={theme.colors.userThemeColor} height={20} strokeWidth={2} width={20} />
        }
        allowFontScaling={false}
        emphasis={ButtonEmphasis.Tertiary}
        label={t('Send')}
        name={ElementName.Send}
        size={ButtonSize.Medium}
        onPress={onPressSend}
      />
      <Button
        fill
        CustomIcon={
          <Arrow color={theme.colors.userThemeColor} direction="s" size={theme.iconSizes.md} />
        }
        allowFontScaling={false}
        emphasis={ButtonEmphasis.Tertiary}
        label={t('Receive')}
        name={ElementName.Receive}
        size={ButtonSize.Medium}
        onPress={onPressReceive}
      />
    </Flex>
  )
}
