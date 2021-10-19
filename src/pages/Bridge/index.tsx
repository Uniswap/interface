import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { CurrencyAmount } from '@swapr/sdk'

import { Tabs } from './Tabs'
import AppBody from '../AppBody'
import { AssetSelector } from './AssetsSelector'
import { RowBetween } from '../../components/Row'
import ArrowIcon from '../../assets/svg/arrow.svg'
import { BridgeActionPanel } from './BridgeActionPanel'
import { BridgeModal } from './BridgeModals/BridgeModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { BridgeTransactionsSummary } from './BridgeTransactionsSummary'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { NetworkSwitcher as NetworkSwitcherPopover } from '../../components/NetworkSwitcher'

import { useActiveWeb3React } from '../../hooks'
import { useBridgeService } from '../../contexts/BridgeServiceProvider'
import { useBridgeTransactionsSummary } from '../../state/bridgeTransactions/hooks'
import { useBridgeInfo, useBridgeActionHandlers, useBridgeModal } from '../../state/bridge/hooks'

import { NETWORK_DETAIL } from '../../constants'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { BridgeStep, createNetworkOptions, getNetworkOptionById } from './utils'

const Wrapper = styled.div`
  max-width: 432px;
  margin: 0 auto;
`

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
    min-width: 141px;
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

  @media only screen and (max-width: 600px) {
    padding: 0 8px;
  }
`

export default function Bridge() {
  const bridgeService = useBridgeService()
  const { account, chainId } = useActiveWeb3React()
  const bridgeSummaries = useBridgeTransactionsSummary()
  const [modalData, setModalStatus, setModalData] = useBridgeModal()
  const { bridgeCurrency, currencyBalance, parsedAmount, typedValue, fromNetwork, toNetwork } = useBridgeInfo()
  const { onUserInput, onToNetworkChange, onFromNetworkChange, onSwapBridgeNetworks } = useBridgeActionHandlers()

  const toPanelRef = useRef(null)
  const fromPanelRef = useRef(null)

  const [step, setStep] = useState(BridgeStep.Initial)
  const [showToList, setShowToList] = useState(false)
  const [showFromList, setShowFromList] = useState(false)
  const [collectableTx, setCollectableTx] = useState(
    () => bridgeSummaries.filter(tx => tx.status === 'redeem')[0] || undefined
  )

  const isCollecting = step === BridgeStep.Collect
  const isNetworkConnected = fromNetwork.chainId === chainId
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean((maxAmountInput && parsedAmount?.equalTo(maxAmountInput)) || !isNetworkConnected)

  useEffect(() => {
    if (collectableTx && isCollecting && chainId !== collectableTx.fromChainId && chainId !== collectableTx.toChainId) {
      setStep(BridgeStep.Initial)
    }
  }, [chainId, collectableTx, isCollecting, step])

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
  }, [bridgeService, chainId, typedValue])

  const handleCollect = useCallback(
    (tx: BridgeTransactionSummary) => {
      setStep(BridgeStep.Collect)
      setCollectableTx(tx)
      setModalData({
        currencyId: tx.assetName,
        typedValue: tx.value,
        fromChainId: tx.fromChainId,
        toChainId: tx.toChainId
      })
    },
    [setModalData]
  )

  const handleCollectConfirm = useCallback(async () => {
    if (!bridgeService) return
    await bridgeService.triggerOutboxEth(collectableTx)
    setStep(BridgeStep.Success)
  }, [bridgeService, collectableTx])

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

  return (
    <Wrapper>
      <Tabs step={step} setStep={setStep} handleResetBridge={handleResetBridge} />
      <AppBody>
        <RowBetween mb="12px">
          <Title>{isCollecting ? 'Collect' : 'Swapr Bridge'}</Title>
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
      <BridgeModal
        handleResetBridge={handleResetBridge}
        setStep={setStep}
        setStatus={setModalStatus}
        modalData={modalData}
      />
    </Wrapper>
  )
}
