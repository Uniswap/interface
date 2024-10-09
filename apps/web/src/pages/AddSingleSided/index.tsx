import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@ubeswap/analytics-events'
import { Currency, CurrencyAmount, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, Percent } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { isSupportedChain } from 'constants/chains'
import { parseUnits } from 'ethers/lib/utils'
import { Trans } from 'i18n'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { BodyWrapper } from 'pages/AppBody'
import { PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'

import { ExternalLink } from 'theme/components'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonText } from '../../components/Button'
import { YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import Row, { RowBetween } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { useStablecoinValue } from '../../hooks/useStablecoinPrice'
import { Field } from '../../state/mint/v3/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { Dots } from '../Pool/styled'
import { Review } from './Review'
import { DynamicSection, MediumOnly, ResponsiveTwoColumns, ScrollablePage, Wrapper } from './styled'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

const StyledBodyWrapper = styled(BodyWrapper)`
  padding: 0;
  width: 100%;
  max-width: 600px;
`

export default function AddSingleSidedWrapper() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <AddSingleSided />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function AddSingleSided() {
  const navigate = useNavigate()
  const { currencyIdA, currencyIdB } = useParams<{
    currencyIdA?: string
    currencyIdB?: string
  }>()
  const { account, chainId, provider } = useWeb3React()
  const theme = useTheme()

  const toggleWalletDrawer = useToggleAccountDrawer() // toggle wallet when disconnected
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  const hasExistingPosition = false

  const [depositAmount, setDepositAmount] = useState('')

  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const baseBalance = useCurrencyBalance(account, baseCurrency)

  const currencyCELO = useCurrency('0x471EcE3750Da237f93B8E339c536989b8978a438')
  const currencyUBE = useCurrency('0x71e26d0E519D14591b9dE9a0fE9513A398101490')
  const currencyCUSD = useCurrency('0x765DE816845861e75A25fCA122bb6898B8B1282a')
  const currencyUSDT = useCurrency('0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e')

  const firstCurrencies = [currencyCELO, currencyCUSD, currencyUSDT]
  const secondCurrencies = useMemo(() => {
    if (baseCurrency) {
      if (baseCurrency.symbol === currencyCELO?.symbol) {
        return [currencyUBE, currencyCUSD, currencyUSDT]
      }
      if (baseCurrency.symbol === currencyUSDT?.symbol) {
        return [currencyCELO]
      }
      if (baseCurrency.symbol === currencyCUSD?.symbol) {
        return [currencyCELO]
      }
    }
    return []
  }, [baseCurrency, currencyCELO, currencyCUSD, currencyUSDT, currencyUBE])

  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  const depositInputDisabled = false

  const depositCurrencyAmount =
    baseCurrency && depositAmount
      ? CurrencyAmount.fromRawAmount(baseCurrency, parseUnits(depositAmount, baseCurrency.decimals).toString())
      : undefined

  let errorMessage: ReactNode | undefined
  if (!account) {
    errorMessage = <Trans>Connect wallet</Trans>
  }

  if (!depositCurrencyAmount && !depositInputDisabled) {
    errorMessage = errorMessage ?? <Trans>Enter an amount</Trans>
  }

  if (depositCurrencyAmount && baseBalance?.lessThan(depositCurrencyAmount)) {
    errorMessage = <Trans>Insufficient {{ symbol: baseCurrency?.symbol }} balance</Trans>
  }

  const isValid = !errorMessage

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(baseBalance),
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    depositCurrencyAmount,
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  async function onAdd() {
    if (!chainId || !provider || !account) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }
  }

  const handleCurrencySelect = useCallback((firstCurrency?: Currency, secondCurrency?: Currency): Currency[] => {
    if (firstCurrency) {
      if (['CELO', 'cUSD', 'USDT'].includes(firstCurrency.symbol || '')) {
        if (secondCurrency) {
          if (firstCurrency.symbol == 'CELO') {
            if (['UBE', 'cUSD', 'USDT'].includes(secondCurrency.symbol || '')) {
              return [firstCurrency, secondCurrency]
            }
          }
          if (firstCurrency.symbol == 'cUSD' && secondCurrency.symbol == 'CELO') {
            return [firstCurrency, secondCurrency]
          }
          if (firstCurrency.symbol == 'USDT' && secondCurrency.symbol == 'CELO') {
            return [firstCurrency, secondCurrency]
          }
        }
        return [firstCurrency]
      } else {
        return []
      }
    } else {
      return []
    }
  }, [])

  const handleCurrencyASelect = useCallback(
    (firstCurrency: Currency) => {
      const cs = handleCurrencySelect(firstCurrency, quoteCurrency)
      navigate(`/add/single/` + cs.map((c) => c.wrapped.address).join('/'))
    },
    [handleCurrencySelect, quoteCurrency, navigate]
  )

  const handleCurrencyBSelect = useCallback(
    (secondCurrency: Currency) => {
      const cs = handleCurrencySelect(baseCurrency, secondCurrency)
      navigate(`/add/single/` + cs.map((c) => c.wrapped.address).join('/'))
    },
    [handleCurrencySelect, baseCurrency, navigate]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      setDepositAmount('')
      // dont jump to pool page if creating
      navigate('/pools')
    }
    setTxHash('')
  }, [navigate, setDepositAmount, txHash])

  const clearAll = useCallback(() => {
    setDepositAmount('')
    navigate(`/add/single`)
  }, [navigate, setDepositAmount])

  const showApprovalA = approvalA !== ApprovalState.APPROVED && !!depositCurrencyAmount

  const pendingText = `Supplying ${baseCurrency?.symbol}`

  const Buttons = () =>
    !account ? (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
        properties={{ received_swap_quote: false }}
        element={InterfaceElementName.CONNECT_WALLET_BUTTON}
      >
        <ButtonLight onClick={toggleWalletDrawer} $borderRadius="12px" padding="12px">
          <Trans>Connect wallet</Trans>
        </ButtonLight>
      </TraceEvent>
    ) : (
      <AutoColumn gap="md">
        {(approvalA === ApprovalState.NOT_APPROVED || approvalA === ApprovalState.PENDING) && isValid && (
          <RowBetween>
            {showApprovalA && (
              <ButtonPrimary onClick={approveACallback} disabled={approvalA === ApprovalState.PENDING} width="100%">
                {approvalA === ApprovalState.PENDING ? (
                  <Dots>
                    <Trans>Approving {{ amount: baseCurrency?.symbol }}</Trans>
                  </Dots>
                ) : (
                  <Trans>Approve {{ amount: baseCurrency?.symbol }}</Trans>
                )}
              </ButtonPrimary>
            )}
          </RowBetween>
        )}
        <ButtonError
          onClick={() => {
            setShowConfirm(true)
          }}
          disabled={!isValid || (approvalA !== ApprovalState.APPROVED && !depositInputDisabled)}
          error={!isValid && !!depositCurrencyAmount}
        >
          <Text fontWeight={535}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </AutoColumn>
    )

  const usdcValueCurrencyA = useStablecoinValue(depositCurrencyAmount)
  const currencyAFiat = useMemo(
    () => ({
      data: usdcValueCurrencyA ? parseFloat(usdcValueCurrencyA.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyA]
  )

  return (
    <>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          reviewContent={() => (
            <ConfirmationModalContent
              title={<Trans>Add Single TokenLiquidity</Trans>}
              onDismiss={handleDismissConfirmation}
              topContent={() => <Review parsedAmounts={{}} outOfRange={false} ticksAtLimit={{}} />}
              bottomContent={() => (
                <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                  <Text fontWeight={535} fontSize={20}>
                    <Trans>Add</Trans>
                  </Text>
                </ButtonPrimary>
              )}
            />
          )}
          pendingText={pendingText}
        />
        <StyledBodyWrapper>
          <AddRemoveTabs
            creating={false}
            adding={true}
            singleSided={true}
            autoSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={!hasExistingPosition}
          >
            {!hasExistingPosition && (
              <Row justify="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
                <MediumOnly>
                  <ButtonText onClick={clearAll}>
                    <ThemedText.DeprecatedBlue fontSize="12px">
                      <Trans>Clear all</Trans>
                    </ThemedText.DeprecatedBlue>
                  </ButtonText>
                </MediumOnly>
              </Row>
            )}
          </AddRemoveTabs>
          <Wrapper>
            <ResponsiveTwoColumns wide={!hasExistingPosition}>
              <AutoColumn gap="lg">
                {!hasExistingPosition && (
                  <>
                    <AutoColumn gap="md">
                      <RowBetween paddingBottom="20px">
                        <ThemedText.DeprecatedLabel>
                          <Trans>Select tokens</Trans>
                        </ThemedText.DeprecatedLabel>
                      </RowBetween>
                      <RowBetween gap="md">
                        <CurrencyInputPanel
                          currencies={firstCurrencies}
                          value={depositAmount}
                          onUserInput={setDepositAmount}
                          hideInput
                          onMax={() => {
                            setDepositAmount(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                          }}
                          onCurrencySelect={handleCurrencyASelect}
                          showMaxButton={false}
                          currency={baseCurrency ?? null}
                          id="add-liquidity-input-tokena"
                        />

                        <CurrencyInputPanel
                          currencies={secondCurrencies}
                          value={depositAmount}
                          hideInput
                          onUserInput={setDepositAmount}
                          onCurrencySelect={handleCurrencyBSelect}
                          showMaxButton={false}
                          currency={quoteCurrency ?? null}
                          id="add-liquidity-input-tokenb"
                        />
                      </RowBetween>
                    </AutoColumn>
                  </>
                )}
              </AutoColumn>

              {!hasExistingPosition && (
                <>
                  <DynamicSection gap="md">
                    {baseCurrency && quoteCurrency && (
                      <YellowCard padding="8px 12px" $borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                          <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                            Single token deposits only. The final position may consist with both tokens. Learn more
                            about the strategy&nbsp;
                            <ExternalLink href="https://docs.ichi.org/home/yield-iq-strategy">here.</ExternalLink>.
                            <br />
                            This liquidity will be managed by ICHI finance.
                          </ThemedText.DeprecatedYellow>
                        </RowBetween>
                      </YellowCard>
                    )}
                  </DynamicSection>
                </>
              )}
              <div>
                <DynamicSection disabled={!baseCurrency || !quoteCurrency}>
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedLabel>Deposit {baseCurrency?.symbol}</ThemedText.DeprecatedLabel>

                    <CurrencyInputPanel
                      value={depositAmount}
                      onUserInput={setDepositAmount}
                      onMax={() => {
                        setDepositAmount(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      showMaxButton={true}
                      currency={baseCurrency ?? null}
                      id="add-liquidity-input-tokena"
                      fiatValue={currencyAFiat}
                      locked={depositInputDisabled}
                    />
                  </AutoColumn>
                </DynamicSection>
              </div>
              <Buttons />
            </ResponsiveTwoColumns>
          </Wrapper>
        </StyledBodyWrapper>
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
