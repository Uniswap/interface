import { InterfaceElementName } from '@uniswap/analytics-events'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ActionTile } from 'components/AccountDrawer/ActionTile'
import IconButton, { IconHoverText, IconWithConfirmTextButton } from 'components/AccountDrawer/IconButton'
import { EmptyWallet } from 'components/AccountDrawer/MiniPortfolio/EmptyWallet'
import { ExtensionDeeplinks } from 'components/AccountDrawer/MiniPortfolio/ExtensionDeeplinks'
import MiniPortfolio from 'components/AccountDrawer/MiniPortfolio/MiniPortfolio'
import { portfolioFadeInAnimation } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Status } from 'components/AccountDrawer/Status'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button/buttons'
import { CreditCardIcon } from 'components/Icons/CreditCard'
import { Power } from 'components/Icons/Power'
import { Settings } from 'components/Icons/Settings'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import Row, { AutoRow } from 'components/deprecated/Row'
import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useDisconnect } from 'hooks/useDisconnect'
import useENSName from 'hooks/useENSName'
import { useIsUniExtensionAvailable } from 'hooks/useUniswapWalletOptions'
import styled from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { ThemedText } from 'theme/components'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { Trans, t } from 'uniswap/src/i18n'
import { isPathBlocked } from 'utils/blockedPaths'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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

const FadeInColumn = styled(Column)`
  ${portfolioFadeInAnimation}
`

const PortfolioDrawerContainer = styled(Column)`
  flex: 1;
`

export default function AuthenticatedHeader({ account, openSettings }: { account: string; openSettings: () => void }) {
  const { disconnect } = useDisconnect()
  const { ENSName } = useENSName(account)
  const navigate = useNavigate()
  const openReceiveModal = useOpenModal({ name: ApplicationModal.RECEIVE_CRYPTO })
  const shouldShowBuyFiatButton = !isPathBlocked('/buy')
  const { formatNumber, formatDelta } = useFormatter()
  const isUniExtensionAvailable = useIsUniExtensionAvailable()
  const { isTestnetModeEnabled } = useEnabledChains()

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()

  const handleDisconnect = useCallback(() => {
    dispatch(setIsTestnetModeEnabled(false))
    disconnect()
  }, [disconnect, dispatch])

  const handleBuyCryptoClick = useCallback(() => {
    accountDrawer.close()
    navigate(`/buy`, { replace: true })
  }, [accountDrawer, navigate])

  const { data: portfolioBalances } = useTokenBalancesQuery({ cacheOnly: !accountDrawer.isOpen })
  const portfolio = portfolioBalances?.portfolios?.[0]
  const totalBalance = portfolio?.tokensTotalDenominatedValue?.value
  // denominated portfolio balance on testnet is always 0
  const isPortfolioZero = !isTestnetModeEnabled && totalBalance === 0
  const absoluteChange = portfolio?.tokensTotalDenominatedValueChange?.absolute?.value
  const percentChange = portfolio?.tokensTotalDenominatedValueChange?.percentage?.value
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { unitag } = useUnitagByAddress(account)
  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')

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
              text="Disconnect"
              dismissOnHoverOut
            />
          </Trace>
        </IconContainer>
      </HeaderWrapper>
      <PortfolioDrawerContainer>
        {totalBalance !== undefined ? (
          <FadeInColumn gap="xs">
            <ThemedText.HeadlineLarge
              fontWeight={535}
              color={isTestnetModeEnabled ? 'neutral3' : 'neutral1'}
              data-testid="portfolio-total-balance"
            >
              {formatNumber({
                input: isTestnetModeEnabled ? null : totalBalance,
                placeholder: '--',
                forceShowCurrencySymbol: true,
                type: NumberType.PortfolioBalance,
              })}
            </ThemedText.HeadlineLarge>
            <AutoRow marginBottom="20px">
              {absoluteChange !== 0 && percentChange && !isTestnetModeEnabled && (
                <>
                  <DeltaArrow delta={absoluteChange} />
                  <ThemedText.BodySecondary>
                    {`${formatNumber({
                      input: Math.abs(absoluteChange as number),
                      type: NumberType.PortfolioBalance,
                    })} (${formatDelta(percentChange)})`}
                  </ThemedText.BodySecondary>
                </>
              )}
            </AutoRow>
          </FadeInColumn>
        ) : (
          <Column gap="xs">
            <LoadingBubble height="44px" width="170px" />
            <LoadingBubble height="16px" width="100px" margin="4px 0 20px 0" />
          </Column>
        )}
        {isUniExtensionAvailable ? (
          <ExtensionDeeplinks account={account} />
        ) : (
          <>
            <Row gap="8px">
              {shouldShowBuyFiatButton && (
                <ActionTile
                  dataTestId="wallet-buy-crypto"
                  Icon={<CreditCardIcon />}
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
              <UNIButton onClick={openClaimModal} size={ButtonSize.medium} emphasis={ButtonEmphasis.medium}>
                <Trans i18nKey="account.authHeader.claimReward" values={{ amount }} />
              </UNIButton>
            )}
          </>
        )}
      </PortfolioDrawerContainer>
    </AuthenticatedHeaderWrapper>
  )
}
