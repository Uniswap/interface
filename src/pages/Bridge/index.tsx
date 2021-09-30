import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { CurrencyAmount } from '@swapr/sdk'
import QuestionHelper from '../../components/QuestionHelper'
import { RowBetween } from '../../components/Row'
import AppBody from '../AppBody'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import ArrowIcon from '../../assets/svg/arrow.svg'
import { AssetSelector } from './AssetsSelector'
// import { FooterBridgeSelector } from './FooterBridgeSelector'
import { BridgeSuccesModal } from './BridgeSuccesModal'
import { useActiveWeb3React } from '../../hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { useBridgeInfo, useBridgeActionHandlers } from '../../state/bridge/hooks'

import { NetworkSwitcher as NetworkSwitcherPopover } from '../../components/NetworkSwitcher'
import { useArbBridge } from '../../hooks/useArbBridge'
import { BridgeTransactionSummary, useBridgeTransactionsSummary } from '../../state/bridgeTransactions/hooks'
import { BridgeTransactionsSummary } from './BridgeTransactionsSummary'
import { BridgeStep, createNetworkOptions, getNetworkOptionById } from './utils'
import { BridgeActionPanel } from './BridgeActionPanel'
import { NETWORK_DETAIL } from '../../constants'

const Title = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.purple2};
`

const Row = styled(RowBetween)`
  & > div {
    width: 100%;
  }
`

const SwapButton = styled.button<{ disabled: boolean }>`
  padding: 0 16px;
  border: none;
  background: none;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
`

export default function Bridge() {
  const { account, chainId } = useActiveWeb3React()
  const { bridgeCurrency, currencyBalance, parsedAmount, typedValue, fromNetwork, toNetwork } = useBridgeInfo()
  const {
    onUserInput,
    onToNetworkChange,
    onCurrencySelection,
    onFromNetworkChange,
    onSwapBridgeNetworks
  } = useBridgeActionHandlers()

  const toPanelRef = useRef(null)
  const fromPanelRef = useRef(null)

  const [step, setStep] = useState(BridgeStep.Initial)
  const [showToList, setShowToList] = useState(false)
  const [showFromList, setShowFromList] = useState(false)

  const { depositEth, withdrawEth } = useArbBridge()
  const bridgeSummaries = useBridgeTransactionsSummary()

  useEffect(() => {
    const timer = setTimeout(() => step === BridgeStep.Pending && setStep(BridgeStep.Ready), 2000)
    return () => clearTimeout(timer)
  }, [step])

  const isNetworkConnected = fromNetwork.chainId === chainId
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean((maxAmountInput && parsedAmount?.equalTo(maxAmountInput)) || !isNetworkConnected)

  const handleResetBridge = useCallback(() => {
    onUserInput('')
    setStep(BridgeStep.Initial)
  }, [onUserInput])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(isNetworkConnected ? maxAmountInput.toExact() : '')
  }, [maxAmountInput, isNetworkConnected, onUserInput])

  const handleSubmit = useCallback(() => {
    if (!chainId) return
    if (!NETWORK_DETAIL[chainId].isArbitrum) {
      handleResetBridge()
      return depositEth(typedValue)
    } else {
      handleResetBridge()
      return withdrawEth(typedValue)
    }
  }, [chainId, depositEth, handleResetBridge, typedValue, withdrawEth])

  const fromOptions = createNetworkOptions({
    value: fromNetwork.chainId,
    setValue: onFromNetworkChange,
    activeChainId: !!account ? chainId : -1
  })

  const toOptions = createNetworkOptions({
    value: toNetwork.chainId,
    setValue: onToNetworkChange,
    activeChainId: !!account ? chainId : -1
  })

  const [collectableTx, setCollectableTx] = useState(
    () => bridgeSummaries.filter(tx => tx.status === 'redeem')[0] || undefined
  )

  const handleCollect = useCallback(
    (tx: BridgeTransactionSummary) => {
      setStep(BridgeStep.Collect)
      setCollectableTx(tx)
    },
    [setStep, setCollectableTx]
  )

  // const collectedCurrency = useCurrency(collectableTx.assetName)

  return (
    <>
      <AppBody>
        <RowBetween mb="12px">
          <Title>{step === BridgeStep.Collect ? 'Collect' : 'Swapr Bridge'}</Title>
          <QuestionHelper text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum" />
        </RowBetween>
        <Row mb="12px">
          <div ref={fromPanelRef}>
            <AssetSelector
              label="from"
              selectedNetwork={getNetworkOptionById(fromNetwork.chainId, fromOptions)}
              onClick={() => setShowFromList(val => !val)}
              disabled={step === BridgeStep.Collect}
            />
            <NetworkSwitcherPopover
              show={showFromList}
              onOuterClick={() => setShowFromList(false)}
              options={fromOptions}
              showWalletConnector={false}
              parentRef={fromPanelRef}
            />
          </div>
          <SwapButton onClick={onSwapBridgeNetworks} disabled={step === BridgeStep.Collect}>
            <img src={ArrowIcon} alt="arrow" />
          </SwapButton>
          <div ref={toPanelRef}>
            <AssetSelector
              label="to"
              selectedNetwork={getNetworkOptionById(toNetwork.chainId, toOptions)}
              onClick={() => setShowToList(val => !val)}
              disabled={step === BridgeStep.Collect}
            />
            <NetworkSwitcherPopover
              show={showToList}
              onOuterClick={() => setShowToList(false)}
              options={toOptions}
              showWalletConnector={false}
              parentRef={toPanelRef}
            />
          </div>
        </Row>
        <CurrencyInputPanel
          label="Amount"
          value={step === BridgeStep.Collect ? collectableTx.value : typedValue}
          showMaxButton={!atMaxAmountInput}
          currency={bridgeCurrency}
          onUserInput={onUserInput}
          onMax={handleMaxInput}
          onCurrencySelect={onCurrencySelection}
          disableCurrencySelect={step === BridgeStep.Collect}
          disabled={step === BridgeStep.Collect}
          hideBalance={!isNetworkConnected}
          id="bridge-currency-input"
        />
        <BridgeActionPanel
          account={account}
          fromNetworkChainId={fromNetwork.chainId}
          toNetworkChainId={toNetwork.chainId}
          handleSubmit={handleSubmit}
          isNetworkConnected={isNetworkConnected}
          step={step}
          setStep={setStep}
          typedValue={typedValue}
        />
      </AppBody>
      {chainId && !!bridgeSummaries.length && (
        <BridgeTransactionsSummary
          show
          transactions={bridgeSummaries}
          collectableTx={collectableTx}
          onCollect={handleCollect}
        />
      )}

      {/* {step === Step.Initial && !!typedValue && (
        <FooterBridgeSelector show selectedBridge={bridge} onBridgeChange={handleBridgeRadioChange} />
      )} */}
      <BridgeSuccesModal
        isOpen={step === BridgeStep.Success}
        onDismiss={handleResetBridge}
        onTradeButtonClick={handleResetBridge}
        onBackButtonClick={handleResetBridge}
        amount={typedValue}
      />
    </>
  )
}
