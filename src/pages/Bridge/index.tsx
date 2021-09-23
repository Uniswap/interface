import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { ChainId, CurrencyAmount } from '@swapr/sdk'
import QuestionHelper from '../../components/QuestionHelper'
import { RowBetween } from '../../components/Row'
import AppBody from '../AppBody'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import ArrowIcon from '../../assets/svg/arrow.svg'
import { AssetSelector } from './AssetsSelector'
import { FooterBridgeSelector } from './FooterBridgeSelector'
import { FooterPending } from './FooterPending'
import { FooterReady } from './FooterReady'
import { NetworkSwitcher } from './NetworkSwitcher'
import { BridgeSuccesModal } from './BridgeSuccesModal'
import { BridgeButton } from './BridgeButton'
import { ButtonPrimary } from '../../components/Button'
import { useActiveWeb3React } from '../../hooks'
import { useWalletSwitcherPopoverToggle } from '../../state/application/hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { useBridgeInfo, useBridgeActionHandlers } from '../../state/bridge/hooks'

import {
  NetworkSwitcher as NetworkSwitcherPopover,
  networkOptionsPreset,
  NetworkOptionProps
} from '../../components/NetworkSwitcher'
import { useArbBridge } from '../../hooks/useArbBridge'

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

const SwapButton = styled.button`
  padding: 0 16px;
  border: none;
  background: none;
  cursor: pointer;
`

enum Step {
  Initial,
  Pending,
  Ready,
  Collect,
  Success
}

const createNetworkOptions = ({
  value,
  setValue,
  activeChainId
}: {
  value: ChainId
  setValue: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
}): Array<NetworkOptionProps & { chainId: ChainId }> => {
  return networkOptionsPreset.map(option => {
    const { chainId: optionChainId, logoSrc, name } = option

    return {
      chainId: optionChainId,
      header: name,
      logoSrc: logoSrc,
      active: value === activeChainId,
      disabled: value === optionChainId,
      onClick: () => setValue(optionChainId)
    }
  })
}

const getNetworkOptionById = (chainId: ChainId, options: ReturnType<typeof createNetworkOptions>) =>
  options.find(option => option.chainId === chainId)

export default function Bridge() {
  const { account, chainId } = useActiveWeb3React()
  const { selectEthereum, selectNetwork } = useNetworkSwitch()
  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const { bridgeCurrency, currencyBalance, parsedAmount, typedValue, fromNetwork, toNetwork } = useBridgeInfo()
  const {
    onUserInput,
    onToNetworkChange,
    onCurrencySelection,
    onFromNetworkChange,
    onSwapBridgeNetworks
  } = useBridgeActionHandlers()

  const [step, setStep] = useState(Step.Initial)
  const [bridge, setBridge] = useState('Swapr Fast Exit')

  const [showToList, setShowToList] = useState(false)
  const [showFromList, setShowFromList] = useState(false)

  const toPanelRef = useRef(null)
  const fromPanelRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => step === Step.Pending && setStep(Step.Ready), 2000)
    return () => clearTimeout(timer)
  }, [step])

  const isNetworkConnected = fromNetwork.chainId === chainId
  const isButtonDisabled = !typedValue || step !== Step.Initial
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean((maxAmountInput && parsedAmount?.equalTo(maxAmountInput)) || !isNetworkConnected)

  const handleResetBridge = () => {
    onUserInput('')
    setStep(Step.Initial)
  }
  const handleBridgeRadioChange = useCallback(event => setBridge(event.target.value), [])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(isNetworkConnected ? maxAmountInput.toExact() : '')
  }, [maxAmountInput, isNetworkConnected, onUserInput])

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

  // const { depositEth, withdrawEth } = useArbBridge()
  const { withdrawEth } = useArbBridge()

  // const handleDeposit = useCallback(() => depositEth(typedValue), [depositEth, typedValue])
  const handleWithdraw = useCallback(() => withdrawEth(typedValue), [withdrawEth, typedValue])

  return (
    <>
      <AppBody>
        <RowBetween mb="12px">
          <Title>{step === Step.Collect ? 'Collect' : 'Swapr Bridge'}</Title>
          <QuestionHelper text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum" />
        </RowBetween>
        <Row mb="12px">
          <div ref={fromPanelRef}>
            <AssetSelector
              label="from"
              selectedNetwork={getNetworkOptionById(fromNetwork.chainId, fromOptions)}
              onClick={() => setShowFromList(val => !val)}
            />
            <NetworkSwitcherPopover
              show={showFromList}
              onOuterClick={() => setShowFromList(false)}
              options={fromOptions}
              showWalletConnector={false}
              parentRef={fromPanelRef}
            />
          </div>
          <SwapButton onClick={onSwapBridgeNetworks}>
            <img src={ArrowIcon} alt="arrow" />
          </SwapButton>
          <div ref={toPanelRef}>
            <AssetSelector
              label="to"
              selectedNetwork={getNetworkOptionById(toNetwork.chainId, toOptions)}
              onClick={() => setShowToList(val => !val)}
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
          value={typedValue}
          showMaxButton={!atMaxAmountInput}
          currency={bridgeCurrency}
          onUserInput={onUserInput}
          onMax={handleMaxInput}
          onCurrencySelect={onCurrencySelection}
          disableCurrencySelect={step !== Step.Initial}
          disabled={step !== Step.Initial}
          hideBalance={!isNetworkConnected}
          id="brdige-currency-input"
        />
        {!account ? (
          <ButtonPrimary mt="12px" onClick={toggleWalletSwitcherPopover}>
            Connect Wallet
          </ButtonPrimary>
        ) : !isNetworkConnected ? (
          <ButtonPrimary
            mt="12px"
            onClick={
              fromNetwork.chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(fromNetwork.chainId)
            }
          >
            Connect to {getNetworkOptionById(fromNetwork.chainId, fromOptions)?.header}
          </ButtonPrimary>
        ) : step === Step.Collect ? (
          <NetworkSwitcher sendToId={toNetwork.chainId} onCollectClick={() => setStep(Step.Success)} />
        ) : (
          <BridgeButton onClick={handleWithdraw} disabled={isButtonDisabled} from="Arbitrum" to="Ethereum">
            {!typedValue
              ? 'Enter ETH amount'
              : `Brigde to ${getNetworkOptionById(toNetwork.chainId, toOptions)?.header}`}
          </BridgeButton>
        )}
      </AppBody>
      {step === Step.Initial && !!typedValue && (
        <FooterBridgeSelector show selectedBridge={bridge} onBridgeChange={handleBridgeRadioChange} />
      )}
      {step === Step.Pending && <FooterPending amount={typedValue} show />}
      {step === Step.Ready && (
        <FooterReady amount={typedValue} show onCollectButtonClick={() => setStep(Step.Collect)} />
      )}
      <BridgeSuccesModal
        isOpen={step === Step.Success}
        onDismiss={handleResetBridge}
        onTradeButtonClick={handleResetBridge}
        onBackButtonClick={handleResetBridge}
        amount={typedValue}
      />
    </>
  )
}
