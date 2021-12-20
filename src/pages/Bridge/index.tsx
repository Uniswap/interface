import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { CurrencyAmount } from '@swapr/sdk'
import { useDispatch } from 'react-redux'

import { Tabs } from './Tabs'
import AppBody from '../AppBody'
import { AssetSelector } from './AssetsSelector'
import { RowBetween } from '../../components/Row'
import ArrowIcon from '../../assets/svg/arrow.svg'
import { BridgeActionPanel } from './ActionPanel/BridgeActionPanel'
import { BridgeModal } from './BridgeModals/BridgeModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { BridgeTransactionsSummary } from './BridgeTransactionsSummary'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { NetworkSwitcher as NetworkSwitcherPopover, networkOptionsPreset } from '../../components/NetworkSwitcher'

import { useActiveWeb3React } from '../../hooks'
import { useBridgeService } from '../../contexts/BridgeServiceProvider'
import { useBridgeTransactionsSummary } from '../../state/bridgeTransactions/hooks'
import { useBridgeInfo, useBridgeActionHandlers, useBridgeModal, useBridgeTxsFilter } from '../../state/bridge/hooks'

import { SHOW_TESTNETS } from '../../constants'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { BridgeStep, isNetworkDisabled } from './utils'
import { BridgeTxsFilter } from '../../state/bridge/reducer'
import { BridgeModalStatus } from '../../state/bridge/reducer'
import { isToken } from '../../hooks/Tokens'
import { useChains } from '../../hooks/useChains'
import { createNetworksList, getNetworkOptions } from '../../utils/networksList'
import { setFromBridgeNetwork, setToBridgeNetwork } from '../../state/bridge/actions'

const Wrapper = styled.div`
  width: 100%;
  max-width: 432px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  align-items: stretch;
  justify-content: space-between;

  @media (max-width: 374px) {
    flex-direction: column;
  }
`

const SwapButton = styled.button<{ disabled: boolean }>`
  padding: 0 16px;
  border: none;
  background: none;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};

  @media only screen and (max-width: 600px) {
    padding: 8px;
  }
`

const AssetWrapper = styled.div`
  flex: 1 0 35%;
`

export default function Bridge() {
  const dispatch = useDispatch()
  const bridgeService = useBridgeService()
  const { account } = useActiveWeb3React()
  const bridgeSummaries = useBridgeTransactionsSummary()
  const { chainId, partnerChainId, isArbitrum } = useChains()
  const [modalData, setModalStatus, setModalData] = useBridgeModal()
  const { bridgeCurrency, currencyBalance, parsedAmount, typedValue, fromNetwork, toNetwork } = useBridgeInfo()
  const {
    onCurrencySelection,
    onUserInput,
    onToNetworkChange,
    onFromNetworkChange,
    onSwapBridgeNetworks
  } = useBridgeActionHandlers()

  const toPanelRef = useRef(null)
  const fromPanelRef = useRef(null)

  const [step, setStep] = useState(BridgeStep.Initial)
  const [showToList, setShowToList] = useState(false)
  const [showFromList, setShowFromList] = useState(false)
  const [collectableTx, setCollectableTx] = useState(
    () => bridgeSummaries.filter(tx => tx.status === 'redeem')[0] || undefined
  )
  const [txsFilter, setTxsFilter] = useBridgeTxsFilter()

  const collectableTxAmount = bridgeSummaries.filter(tx => tx.status === 'redeem').length
  const isCollecting = step === BridgeStep.Collect
  const isCollectableFilter = txsFilter === BridgeTxsFilter.COLLECTABLE
  const isNetworkConnected = fromNetwork.chainId === chainId
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean((maxAmountInput && parsedAmount?.equalTo(maxAmountInput)) || !isNetworkConnected)

  useEffect(() => {
    if (!chainId || !partnerChainId) return

    if (collectableTx && isCollecting) {
      const { assetAddressL1, assetAddressL2, fromChainId, toChainId } = collectableTx

      onCurrencySelection(assetAddressL1 && assetAddressL2 ? (isArbitrum ? assetAddressL2 : assetAddressL1) : 'ETH')

      if (chainId !== fromChainId && chainId !== toChainId) {
        setStep(BridgeStep.Initial)
      }

      return
    }

    // Reset input on network change
    onUserInput('')
    onCurrencySelection('')
    dispatch(setFromBridgeNetwork({ chainId }))
    dispatch(setToBridgeNetwork({ chainId: partnerChainId }))
  }, [chainId, collectableTx, dispatch, isArbitrum, isCollecting, onCurrencySelection, onUserInput, partnerChainId])

  const handleResetBridge = useCallback(() => {
    onUserInput('')
    onCurrencySelection('')
    setStep(BridgeStep.Initial)
    setTxsFilter(BridgeTxsFilter.RECENT)
    setModalStatus(BridgeModalStatus.CLOSED)
    setModalData({
      symbol: '',
      typedValue: '',
      fromChainId: chainId || 1,
      toChainId: partnerChainId || 42161
    })
  }, [chainId, onCurrencySelection, onUserInput, partnerChainId, setModalData, setModalStatus, setTxsFilter])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(isNetworkConnected ? maxAmountInput.toExact() : '')
  }, [maxAmountInput, isNetworkConnected, onUserInput])

  const handleSubmit = useCallback(async () => {
    if (!chainId || !bridgeService) return
    let address: string | undefined = ''

    if (isToken(bridgeCurrency)) {
      address = bridgeCurrency.address
    }
    if (!isArbitrum) {
      await bridgeService.deposit(typedValue, address)
    } else {
      await bridgeService.withdraw(typedValue, address)
    }
  }, [bridgeCurrency, bridgeService, chainId, isArbitrum, typedValue])

  const handleModal = useCallback(async () => {
    setModalData({
      symbol: bridgeCurrency?.symbol,
      typedValue: typedValue,
      fromChainId: fromNetwork.chainId,
      toChainId: toNetwork.chainId
    })
    setModalStatus(BridgeModalStatus.DISCLAIMER)
  }, [bridgeCurrency, typedValue, fromNetwork.chainId, toNetwork.chainId, setModalData, setModalStatus])

  const handleCollect = useCallback(
    (tx: BridgeTransactionSummary) => {
      onCurrencySelection(
        tx.assetAddressL1 && tx.assetAddressL2 ? (isArbitrum ? tx.assetAddressL2 : tx.assetAddressL1) : 'ETH'
      )
      setStep(BridgeStep.Collect)
      setCollectableTx(tx)
      setModalData({
        symbol: tx.assetName,
        typedValue: tx.value,
        fromChainId: tx.fromChainId,
        toChainId: tx.toChainId
      })
    },
    [isArbitrum, onCurrencySelection, setModalData]
  )

  const handleCollectConfirm = useCallback(async () => {
    if (!bridgeService) return
    await bridgeService.collect(collectableTx)
    setStep(BridgeStep.Success)
  }, [bridgeService, collectableTx])

  const fromNetworkList = useMemo(
    () =>
      createNetworksList({
        networkOptionsPreset,
        isNetworkDisabled,
        onNetworkChange: onFromNetworkChange,
        selectedNetworkChainId: fromNetwork.chainId,
        activeChainId: !!account ? chainId : -1
      }),
    [account, chainId, fromNetwork.chainId, onFromNetworkChange]
  )

  const toNetworkList = useMemo(
    () =>
      createNetworksList({
        networkOptionsPreset,
        isNetworkDisabled,
        onNetworkChange: onToNetworkChange,
        selectedNetworkChainId: toNetwork.chainId,
        activeChainId: !!account ? chainId : -1
      }),
    [account, chainId, onToNetworkChange, toNetwork.chainId]
  )

  return (
    <Wrapper>
      <Tabs
        collectableTxAmount={collectableTxAmount}
        isCollecting={isCollecting}
        isCollectableFilter={isCollectableFilter}
        setTxsFilter={setTxsFilter}
        handleResetBridge={handleResetBridge}
      />
      <AppBody>
        <RowBetween mb="12px">
          <Title>{isCollecting ? 'Collect' : 'Swapr Bridge'}</Title>
        </RowBetween>
        <Row mb="12px">
          <AssetWrapper ref={fromPanelRef}>
            <AssetSelector
              label="from"
              onClick={SHOW_TESTNETS ? () => setShowFromList(val => !val) : () => null}
              disabled={SHOW_TESTNETS ? isCollecting : true}
              networkOption={getNetworkOptions({ chainId: fromNetwork.chainId, networkList: fromNetworkList })}
            />
            <NetworkSwitcherPopover
              networksList={fromNetworkList}
              showWalletConnector={false}
              parentRef={fromPanelRef}
              show={SHOW_TESTNETS ? showFromList : false}
              onOuterClick={SHOW_TESTNETS ? () => setShowFromList(false) : () => null}
              placement="bottom"
            />
          </AssetWrapper>
          <SwapButton onClick={onSwapBridgeNetworks} disabled={isCollecting}>
            <img src={ArrowIcon} alt="arrow" />
          </SwapButton>
          <AssetWrapper ref={toPanelRef}>
            <AssetSelector
              label="to"
              onClick={SHOW_TESTNETS ? () => setShowToList(val => !val) : () => null}
              disabled={SHOW_TESTNETS ? isCollecting : true}
              networkOption={getNetworkOptions({ chainId: toNetwork.chainId, networkList: toNetworkList })}
            />
            <NetworkSwitcherPopover
              networksList={toNetworkList}
              showWalletConnector={false}
              parentRef={toPanelRef}
              show={SHOW_TESTNETS ? showToList : false}
              onOuterClick={SHOW_TESTNETS ? () => setShowToList(false) : () => null}
              placement="bottom"
            />
          </AssetWrapper>
        </Row>
        <CurrencyInputPanel
          label="Amount"
          value={isCollecting ? collectableTx.value : typedValue}
          showMaxButton={!isCollecting && !atMaxAmountInput}
          currency={bridgeCurrency}
          onUserInput={onUserInput}
          onMax={!isCollecting ? handleMaxInput : undefined}
          onCurrencySelect={onCurrencySelection}
          disableCurrencySelect={isCollecting}
          disabled={isCollecting}
          id="bridge-currency-input"
        />
        <BridgeActionPanel
          account={account}
          fromNetworkChainId={fromNetwork.chainId}
          toNetworkChainId={isCollecting ? collectableTx.toChainId : toNetwork.chainId}
          handleModal={handleModal}
          handleCollect={handleCollectConfirm}
          isNetworkConnected={isNetworkConnected}
          step={step}
          setStep={setStep}
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
        handleSubmit={handleSubmit}
      />
    </Wrapper>
  )
}
