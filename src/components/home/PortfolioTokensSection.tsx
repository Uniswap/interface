import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loading } from 'src/components/loading'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { WalletConnectModalState } from 'src/components/WalletConnect/constants'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'

export function PortfolioTokensSection({ count, owner }: { count?: number; owner: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigation = useHomeStackNavigation()

  const onPressToken = (currency: Currency) =>
    navigation.navigate(Screens.TokenDetails, { currencyId: currencyId(currency) })

  // TODO: remove when buy flow ready
  const onPressScan = () => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: WalletConnectModalState.ScanQr })
    )
  }

  return (
    <BaseCard.Container>
      <Suspense
        fallback={
          <>
            <BaseCard.Header
              title={t('Tokens')}
              onPress={() => navigation.navigate(Screens.PortfolioTokens, { owner })}
            />
            <Loading showSeparator repeat={4} type="token" />
          </>
        }>
        <TokenBalanceList
          count={count}
          empty={
            <BaseCard.EmptyState
              additionalButtonLabel={t('Transfer')}
              buttonLabel={t('Scan')}
              description={t(
                'Fund your wallet by buying tokens with a credit card or transferring from an exchange.'
              )}
              title={t('Add tokens')}
              onPress={onPressScan}
              onPressAdditional={onPressScan}
            />
          }
          owner={owner}
          view={ViewType.Flat}
          onPressToken={onPressToken}
        />
      </Suspense>
    </BaseCard.Container>
  )
}
