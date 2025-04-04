import { NetworkStatus } from '@apollo/client'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ActionTile } from 'components/AccountDrawer/ActionTile'
import IconButton, { IconHoverText, IconWithConfirmTextButton } from 'components/AccountDrawer/IconButton'
import { EmptyWallet } from 'components/AccountDrawer/MiniPortfolio/EmptyWallet'
import { ExtensionDeeplinks } from 'components/AccountDrawer/MiniPortfolio/ExtensionDeeplinks'
import MiniPortfolio from 'components/AccountDrawer/MiniPortfolio/MiniPortfolio'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Status } from 'components/AccountDrawer/Status'
import { ButtonEmphasis, ThemeButton } from 'components/Button/DeprecatedWebButtons'
import { Power } from 'components/Icons/Power'
import { Settings } from 'components/Icons/Settings'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import { useDisconnect } from 'hooks/useDisconnect'
import { useIsUniExtensionAvailable } from 'hooks/useUniswapWalletOptions'
import styled from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { Bank } from 'ui/src/components/icons/Bank'
import { Flex } from 'ui/src/components/layout'
import { Shine } from 'ui/src/loading/Shine'
import AnimatedNumber, {
  BALANCE_CHANGE_INDICATION_DURATION,
} from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { disconnectWallet } from 'uniswap/src/data/rest/embeddedWallet'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { useENSName } from 'uniswap/src/features/ens/api'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import i18next from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import { isPathBlocked } from 'utils/blockedPaths'

const AuthenticatedHeaderWrapper = styled.div<{ isUniExtensionAvailable?: boolean }>`
  padding: ${({ isUniExtensionAvailable }) => (isUniExtensionAvailable ? 16 : 20)}px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`

const WalletButton = styled(ThemeButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
`

const UNIButton = styled(WalletButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
`

const IconContainer = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const HeaderWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const PortfolioDrawerContainer = styled(Column)`
  flex: 1;
`

export default function AuthenticatedHeader({ account, openSettings }: { account: string; openSettings: () => void }) {
  const { disconnect } = useDisconnect()
  const { data: ENSName } = useENSName(account)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const openReceiveModal = useOpenModal({ name: ApplicationModal.RECEIVE_CRYPTO })
  const shouldShowBuyFiatButton = !isPathBlocked('/buy')
  const isUniExtensionAvailable = useIsUniExtensionAvailable()
  const { isTestnetModeEnabled } = useEnabledChains()
  const connectedWithEmbeddedWallet =
    useAccount().connector?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
  const isRightToLeft = i18next.dir() === 'rtl'

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()

  const handleDisconnect = useCallback(() => {
    if (connectedWithEmbeddedWallet) {
      disconnectWallet()
    }
    dispatch(setIsTestnetModeEnabled(false))
    disconnect()
  }, [connectedWithEmbeddedWallet, disconnect, dispatch])

  const handleBuyCryptoClick = useCallback(() => {
    accountDrawer.close()
    navigate(`/buy`, { replace: true })
  }, [accountDrawer, navigate])

  const { data, networkStatus, loading } = usePortfolioTotalValue({
    address: account,
  })

  const { percentChange, absoluteChangeUSD, balanceUSD } = data || {}

  const isLoading = loading && !data
  const isWarmLoading = !!data && networkStatus === NetworkStatus.loading

  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const totalFormattedValue = convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance)

  // denominated portfolio balance on testnet is always 0
  const isPortfolioZero = !isTestnetModeEnabled && balanceUSD === 0
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { unitag } = useUnitagByAddress(account)
  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')

  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && currencyComponents.symbolAtFront

  return (
    <AuthenticatedHeaderWrapper isUniExtensionAvailable={isUniExtensionAvailable}>
      <TestnetModeBanner mt={isUniExtensionAvailable ? -16 : -20} mx={-24} mb="$spacing16" />
      <HeaderWrapper>
        <Status account={account} ensUsername={ENSName} uniswapUsername={unitag?.username} />
        <IconContainer>
          <IconButton
            hideHorizontal={showDisconnectConfirm}
            data-testid="wallet-settings"
            onClick={openSettings}
            Icon={Settings}
          />
          <Trace logPress element={InterfaceElementName.DISCONNECT_WALLET_BUTTON}>
            <IconWithConfirmTextButton
              data-testid="wallet-disconnect"
              onConfirm={handleDisconnect}
              onShowConfirm={setShowDisconnectConfirm}
              Icon={Power}
              text={t('common.button.disconnect')}
              dismissOnHoverOut
            />
          </Trace>
        </IconContainer>
      </HeaderWrapper>
      <PortfolioDrawerContainer>
        <Flex gap="$spacing4" mb="$spacing16" data-testid="portfolio-total-balance">
          <AnimatedNumber
            balance={balanceUSD}
            isRightToLeft={isRightToLeft}
            colorIndicationDuration={BALANCE_CHANGE_INDICATION_DURATION}
            loading={isLoading}
            loadingPlaceholderText="000000.00"
            shouldFadeDecimals={shouldFadePortfolioDecimals}
            value={totalFormattedValue}
            warmLoading={isWarmLoading}
          />
          <Shine disabled={!isWarmLoading}>
            <RelativeChange
              absoluteChange={absoluteChangeUSD}
              arrowSize="$icon.16"
              change={percentChange}
              loading={isLoading}
              negativeChangeColor={isWarmLoading ? '$neutral2' : '$statusCritical'}
              positiveChangeColor={isWarmLoading ? '$neutral2' : '$statusSuccess'}
              variant="body3"
            />
          </Shine>
        </Flex>
        {isUniExtensionAvailable ? (
          <ExtensionDeeplinks account={account} />
        ) : (
          <>
            <Row gap="8px">
              {shouldShowBuyFiatButton && (
                <ActionTile
                  dataTestId="wallet-buy-crypto"
                  Icon={<Bank size={24} />}
                  name={t('common.buy.label')}
                  onClick={handleBuyCryptoClick}
                  errorMessage={t('common.restricted.region')}
                  errorTooltip={t('moonpay.restricted.region')}
                />
              )}
              <ActionTile
                dataTestId="wallet-recieve-crypto"
                Icon={<ArrowDownCircleFilled size={24} />}
                name={t('common.receive')}
                onClick={openReceiveModal}
              />
            </Row>
            {isPortfolioZero ? (
              <EmptyWallet handleBuyCryptoClick={handleBuyCryptoClick} handleReceiveCryptoClick={openReceiveModal} />
            ) : (
              <MiniPortfolio account={account} />
            )}
            {isUnclaimed && (
              <UNIButton onClick={openClaimModal} emphasis={ButtonEmphasis.medium}>
                <Trans i18nKey="account.authHeader.claimReward" values={{ amount }} />
              </UNIButton>
            )}
          </>
        )}
      </PortfolioDrawerContainer>
    </AuthenticatedHeaderWrapper>
  )
}
