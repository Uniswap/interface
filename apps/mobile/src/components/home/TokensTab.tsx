import { FlashList } from '@shopify/flash-list'
import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { NoTokens } from 'src/components/icons/NoTokens'
import { Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabProps, TAB_STYLES } from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useFiatOnRampEnabled } from 'src/features/experiments/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useSignerAccounts } from 'src/features/wallet/hooks'
import { CurrencyId } from 'src/utils/currencyId'

// ignore ref type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TokensTab = forwardRef<FlashList<any>, TabProps & { isExternalProfile?: boolean }>(
  ({ owner, containerProps, scrollHandler, isExternalProfile = false, headerHeight }, ref) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const tokenDetailsNavigation = useTokenDetailsNavigation()

    const ownerAccount = useSignerAccounts().find((a) => a.address === owner)

    const isFiatOnRampEnabled =
      useFiatOnRampEnabled() && ownerAccount?.type === AccountType.SignerMnemonic

    const onPressToken = (currencyId: CurrencyId): void => {
      tokenDetailsNavigation.navigate(currencyId)
    }

    // when fiat on ramp is enabled for owner account, trigger buy flow
    // otherwise, trigger scan flow
    const onPressAction = (): void => {
      if (isFiatOnRampEnabled) {
        dispatch(openModal({ name: ModalName.FiatOnRamp }))
      } else {
        dispatch(
          openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
        )
      }
    }

    return (
      <Flex grow bg="background0" style={TAB_STYLES.tabListContainer}>
        <TokenBalanceList
          ref={ref}
          containerProps={containerProps}
          empty={
            <BaseCard.EmptyState
              buttonLabel={isFiatOnRampEnabled ? t('Buy crypto') : t('Receive tokens')}
              description={
                isFiatOnRampEnabled
                  ? t('Buy crypto at the lowest rates on Uniswap Wallet, powered by MoonPay.')
                  : t(
                      'Transfer tokens from a centralized exchange or another wallet to get started.'
                    )
              }
              icon={<NoTokens />}
              title={t('No tokens yet')}
              onPress={onPressAction}
            />
          }
          headerHeight={headerHeight}
          isExternalProfile={isExternalProfile}
          owner={owner}
          scrollHandler={scrollHandler}
          onPressToken={onPressToken}
        />
      </Flex>
    )
  }
)
