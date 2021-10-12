import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { CurrencyAmount } from '@swapr/sdk'
import QuestionHelper from '../../components/QuestionHelper'
import { RowBetween } from '../../components/Row'
import AppBody from '../AppBody'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import ArrowIcon from '../../assets/svg/arrow.svg'
import { AssetSelector } from './AssetsSelector'
import { useActiveWeb3React } from '../../hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { useBridgeInfo, useBridgeActionHandlers, useBridgeModal } from '../../state/bridge/hooks'
import { NetworkSwitcher as NetworkSwitcherPopover } from '../../components/NetworkSwitcher'
import { useBridgeTransactionsSummary } from '../../state/bridgeTransactions/hooks'
import { BridgeTransactionsSummary } from './BridgeTransactionsSummary'
import { BridgeStep, createNetworkOptions, getNetworkOptionById } from './utils'
import { BridgeActionPanel } from './BridgeActionPanel'
import { NETWORK_DETAIL } from '../../constants'
import { useBridgeService } from '../../contexts/BridgeServiceProvider'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { BridgeModal } from './BridgeModals/BridgeModal'
import { Tabs } from './Tabs'

const Title = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.purple2};
`

const Row = styled(RowBetween)`
  align-items: stretch;

  & > div {
    width: 100%;
  }

  & > div,
  & > div button {
    min-height: 100%;
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
    onFromNetworkChange,
    onSwapBridgeNetworks,
    getCollectedTx
  } = useBridgeActionHandlers()

  const toPanelRef = useRef(null)
  const fromPanelRef = useRef(null)

  const [step, setStep] = useState(BridgeStep.Initial)
  const [showToList, setShowToList] = useState(false)
  const [showFromList, setShowFromList] = useState(false)
  const [modalData, setModalStatus, setModalData] = useBridgeModal()

  const bridgeService = useBridgeService()
  const bridgeSummaries = useBridgeTransactionsSummary()

  const isNetworkConnected = fromNetwork.chainId === chainId
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean((maxAmountInput && parsedAmount?.equalTo(maxAmountInput)) || !isNetworkConnected)
  const isCollecting = step === BridgeStep.Collect

  const handleResetBridge = useCallback(() => {
    onUserInput('')
    setStep(BridgeStep.Initial)
  }, [onUserInput])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(isNetworkConnected ? maxAmountInput.toExact() : '')
  }, [maxAmountInput, isNetworkConnected, onUserInput])

  const handleSubmit = useCallback(async () => {
    if (!chainId || !bridgeService) return
    if (!NETWORK_DETAIL[chainId].isArbitrum) {
      await bridgeService.depositEth(typedValue)
    } else {
      await bridgeService.withdrawEth(typedValue)
    }
    // handleResetBridge()
  }, [bridgeService, chainId, typedValue])

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
      getCollectedTx({ currency: tx.assetName, from: tx.fromChainId, to: tx.toChainId, typedValue: tx.value })
    },
    [getCollectedTx]
  )

  const handleCollectConfirm = useCallback(async () => {
    if (!bridgeService) return
    await bridgeService.triggerOutboxEth(collectableTx)
    setStep(BridgeStep.Success)
  }, [bridgeService, collectableTx])

  useEffect(() => {
    if (collectableTx && isCollecting && chainId !== collectableTx.fromChainId && chainId !== collectableTx.toChainId) {
      setStep(BridgeStep.Initial)
    }
  }, [chainId, collectableTx, isCollecting, step])

  return (
    <>
      <AppBody>
        <Tabs step={step} setStep={setStep} handleResetBridge={handleResetBridge} />
        <RowBetween mb="12px">
          <Title>{isCollecting ? 'Collect' : 'Swapr Bridge'}</Title>
          <QuestionHelper text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum" />
        </RowBetween>
        <Row mb="12px">
          <div ref={fromPanelRef}>
            <AssetSelector
              label="from"
              selectedNetwork={getNetworkOptionById(fromNetwork.chainId, fromOptions)}
              onClick={() => setShowFromList(val => !val)}
              disabled={isCollecting}
            />
            <NetworkSwitcherPopover
              show={showFromList}
              onOuterClick={() => setShowFromList(false)}
              options={fromOptions}
              showWalletConnector={false}
              parentRef={fromPanelRef}
            />
          </div>
          <SwapButton onClick={onSwapBridgeNetworks} disabled={isCollecting}>
            <img src={ArrowIcon} alt="arrow" />
          </SwapButton>
          <div ref={toPanelRef}>
            <AssetSelector
              label="to"
              selectedNetwork={getNetworkOptionById(toNetwork.chainId, toOptions)}
              onClick={() => setShowToList(val => !val)}
              disabled={isCollecting}
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
          value={isCollecting ? collectableTx.value : typedValue}
          showMaxButton={!isCollecting && !atMaxAmountInput}
          currency={bridgeCurrency}
          onUserInput={onUserInput}
          onMax={!isCollecting ? handleMaxInput : undefined}
          disableCurrencySelect={true}
          disabled={isCollecting}
          id="bridge-currency-input"
        />
        <BridgeActionPanel
          account={account}
          fromNetworkChainId={fromNetwork.chainId}
          toNetworkChainId={isCollecting ? collectableTx.toChainId : toNetwork.chainId}
          handleSubmit={handleSubmit}
          handleCollect={handleCollectConfirm}
          isNetworkConnected={isNetworkConnected}
          step={step}
          setStep={setStep}
          typedValue={typedValue}
        />
      </AppBody>
      {step !== BridgeStep.Collect && bridgeService && !!bridgeSummaries.length && (
        <BridgeTransactionsSummary
          transactions={bridgeSummaries}
          collectableTx={collectableTx}
          onCollect={handleCollect}
        />
      )}
      <BridgeModal handleResetBridge={handleResetBridge} setStep={setStep} modalData={modalData} />
    </>
  )
}
