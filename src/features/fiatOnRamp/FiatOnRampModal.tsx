import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import FiatOnRampModalBackground from 'src/assets/backgrounds/fiat-onramp-modal.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import {
  useFiatOnRampWidgetUrlQuery,
  useIsFiatOnRampBuyAllowedQuery,
} from 'src/features/fiatOnRamp/api'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { closeModal, selectFiatOnRampModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

export function FiatOnRampModal() {
  const modalState = useAppSelector(selectFiatOnRampModalState)

  if (!modalState.isOpen) {
    // avoid doing any work until the modal needs to be open
    return null
  }

  return <FiatOnRampModalInner />
}

function FiatOnRampModalInner() {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const dispatch = useAppDispatch()
  const onClose = () => {
    dispatch(closeModal({ name: ModalName.FiatOnRamp }))
  }

  // we can consider adding `ownerAddress` as a prop to this modal in the future
  // for now, always assume the user wants to fund the current account
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { externalTransactionId, dispatchAddTransaction } =
    useFiatOnRampTransactionCreator(activeAccountAddress)

  const {
    data: eligible,
    isLoading: isEligibleLoading,
    isError: isFiatBuyAllowedQueryError,
  } = useIsFiatOnRampBuyAllowedQuery()

  const {
    data: fiatOnRampHostUrl,
    isError: isWidgetUrlQueryError,
    isLoading: isWidgetUrlLoading,
  } = useFiatOnRampWidgetUrlQuery(
    // PERF: could consider skipping this call until eligibility in determined (ux tradeoffs)
    // as-is, avoids waterfalling requests => better ux
    {
      ownerAddress: activeAccountAddress,
      colorCode: theme.colors.accentAction,
      externalTransactionId,
    }
  )

  const onPress = () => {
    if (!fiatOnRampHostUrl) return

    const webBrowserOptions: WebBrowser.WebBrowserOpenOptions = {
      controlsColor: theme.colors.accentAction,
    }
    WebBrowser.openBrowserAsync(fiatOnRampHostUrl, webBrowserOptions)

    dispatchAddTransaction()
    onClose()
  }

  const isLoading = isEligibleLoading || isWidgetUrlLoading
  const buttonEnabled =
    eligible && fiatOnRampHostUrl && !isFiatBuyAllowedQueryError && !isWidgetUrlQueryError

  return (
    <BottomSheetModal disableSwipe name={ModalName.FiatOnRamp} onClose={onClose}>
      <Screen bg="background1" edges={['bottom']} mb="lg" pt="md" px="lg">
        <Flex gap="lg">
          <FiatOnRampModalBackground color={theme.colors.background1} width="100%" />
          <Flex alignItems="center" gap="lg">
            <Flex alignItems="center" gap="sm">
              <Text color="textPrimary" variant="headlineSmall">
                {t('Buy crypto with low fees')}
              </Text>
              <Box alignItems="center">
                <Text color="textSecondary" textAlign="center" variant="bodySmall">
                  {t('Buy crypto at the lowest rates on Uniswap Wallet, powered by Moonpay.')}
                </Text>
              </Box>
            </Flex>
            <Flex width="100%">
              <Button
                fill
                CustomIcon={isLoading ? <SpinningLoader color="textOnBrightPrimary" /> : undefined}
                disabled={!buttonEnabled}
                emphasis={ButtonEmphasis.Primary}
                label={
                  isLoading ? undefined : eligible ? t('Buy Crypto') : t('Not supported in region')
                }
                size={ButtonSize.Medium}
                onPress={onPress}
              />
              {isFiatBuyAllowedQueryError || isWidgetUrlQueryError ? (
                <Text color="textSecondary" textAlign="center" variant="bodyMicro">
                  {t('Something went wrong on our side.')}
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      </Screen>
    </BottomSheetModal>
  )
}
