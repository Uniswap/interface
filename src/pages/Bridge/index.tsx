import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { CurrencyAmount } from '@swapr/sdk'
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
import {
  useBridgeInfo,
  useBridgeActionHandlers,
  useBridgeState
} from '../../state/bridge/hooks'
import { useWalletSwitcherPopoverToggle } from '../../state/application/hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'

import {
  NetworkSwitcher as NetworkSwitcherPopover,
  networkOptionsPreset,
  NetworkOptionProps
} from '../../components/NetworkSwitcher'
import { ChainId } from '@swapr/sdk'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'

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

export const useBridgeInputs = () => {
  const [showFromNetworkList, setShowFromNetworkList] = useState(false)
  const [showToNetworkList, setShowToNetworkList] = useState(false)
  const [fromInputNetwork, setFromInputNetwork] = useState<ChainId>(1)
  const [toInputNetwork, setToInputNetwork] = useState<ChainId>(42161)

  const handleSwap = useCallback(() => {
    setFromInputNetwork(toInputNetwork)
    setToInputNetwork(fromInputNetwork)
  }, [fromInputNetwork, toInputNetwork])

  const handleFromNetworkChange = useCallback(
    (chainId: ChainId) => {
      if (chainId === toInputNetwork) {
        handleSwap()
        return
      }
      setFromInputNetwork(chainId)
    },
    [handleSwap, toInputNetwork]
  )

  const handleToNetworkChange = useCallback(
    (chainId: ChainId) => {
      if (chainId === fromInputNetwork) {
        handleSwap()
        return
      }
      setToInputNetwork(chainId)
    },
    [fromInputNetwork, handleSwap]
  )

  return {
    handleSwap,
    showFromNetworkList,
    setShowFromNetworkList,
    showToNetworkList,
    setShowToNetworkList,
    toInputNetwork,
    handleToNetworkChange,
    fromInputNetwork,
    handleFromNetworkChange
  }
}

const createNetworkOptions = ({
  value,
  setValue,
  activeChainId
}: {
  value: ChainId
  setValue: (value: ChainId) => void
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

export default function Bridge() {
  const { chainId, account } = useActiveWeb3React()
  const { selectEthereum, selectNetwork } = useNetworkSwitch()
  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()

  const [step, setStep] = useState(Step.Initial)
  const [bridge, setBridge] = useState('Swapr Fast Exit')
  const { typedValue } = useBridgeState()
  const { onCurrencySelection, onUserInput } = useBridgeActionHandlers()
  const { bridgeCurrency, currencyBalance, parsedAmount } = useBridgeInfo()

  //const { chainId: networkConnectorChainId, account } = useActiveWeb3React()
  //const [connectedNetwork, setConnectedNetwork] = useState<undefined | number>(networkConnectorChainId)

  useEffect(() => {
    const timer = setTimeout(() => step === Step.Pending && setStep(Step.Ready), 2000)
    return () => clearTimeout(timer)
  }, [step])
 
  const isButtonDisabled = !typedValue || step !== Step.Initial


  const resetBridge = () => {
    handleUserInput('')
    setStep(Step.Initial)
  }

  const handleBridgeRadioChange = useCallback(event => setBridge(event.target.value), [])


  const handleCurrencySelect = useCallback(
    outputCurrency => {
      onCurrencySelection(outputCurrency)
    },
    [onCurrencySelection]
  )
  const handleUserInput = useCallback(
    (value: string) => {
      onUserInput(value)
    },
    [onUserInput]
  )

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])
  const {
    handleSwap,
    showFromNetworkList,
    showToNetworkList,
    fromInputNetwork,
    toInputNetwork,
    setShowFromNetworkList,
    setShowToNetworkList,
    handleFromNetworkChange,
    handleToNetworkChange
  } = useBridgeInputs()

  const fromOptions = createNetworkOptions({
    value: fromInputNetwork,
    setValue: handleFromNetworkChange,
    activeChainId: chainId
  })

  const toOptions = createNetworkOptions({
    value: toInputNetwork,
    setValue: handleToNetworkChange,
    activeChainId: chainId
  })

  const getNetworkOptionById = (chainId: ChainId, options: ReturnType<typeof createNetworkOptions>) => {
    return options.find(option => option.chainId === chainId)
  }

  return (
    <>
      <AppBody>
        <RowBetween mb="12px">
          <Title>{step === Step.Collect ? 'Collect' : 'Swapr Bridge'}</Title>
          <QuestionHelper text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum" />
        </RowBetween>
        <Row mb="12px">
          <div>
            <AssetSelector
              label="from"
              selectedNetwork={getNetworkOptionById(fromInputNetwork, fromOptions)}
              onClick={() => setShowFromNetworkList(true)}
            />
            <NetworkSwitcherPopover
              show={showFromNetworkList}
              onOuterClick={() => setShowFromNetworkList(false)}
              options={fromOptions}
              showWalletConnector={false}
            />
          </div>
          <SwapButton onClick={handleSwap}>
            <img src={ArrowIcon} alt="arrow" />
          </SwapButton>
          <div>
            <AssetSelector
              label="to"
              selectedNetwork={getNetworkOptionById(toInputNetwork, toOptions)}
              onClick={() => setShowToNetworkList(true)}
            />
            <NetworkSwitcherPopover
              show={showToNetworkList}
              onOuterClick={() => setShowToNetworkList(false)}
              options={toOptions}
              showWalletConnector={false}
            />
          </div>
        </Row>
        <CurrencyInputPanel
          label="Amount"
          value={typedValue}
          showMaxButton={!atMaxAmountInput}
          currency={bridgeCurrency}
          onUserInput={handleUserInput}
          onMax={handleMaxInput}
          onCurrencySelect={handleCurrencySelect}
          disableCurrencySelect={step !== Step.Initial}
          disabled={step !== Step.Initial}
          id="brdige-currency-input"
        />
        {!account ? (
          <ButtonPrimary mt="12px" onClick={toggleWalletSwitcherPopover}>
            Connect Wallet
          </ButtonPrimary>
        ) : fromInputNetwork !== chainId ? (
          <ButtonPrimary
            mt="12px"
            onClick={fromInputNetwork === ChainId.MAINNET ? selectEthereum : () => selectNetwork(fromInputNetwork)}
          >
            Connect to {getNetworkOptionById(fromInputNetwork, fromOptions)?.header}
          </ButtonPrimary>
        ) : step === Step.Collect ? (
          <NetworkSwitcher sendToId={toInputNetwork} onCollectClick={() => setStep(Step.Success)} />
        ) : (
          <BridgeButton onClick={() => setStep(Step.Pending)} disabled={isButtonDisabled} from="Arbitrum" to="Ethereum">
            {!typedValue ? 'Enter ETH amount' : `Brigde to ${getNetworkOptionById(toInputNetwork, toOptions)?.header}`}
          </BridgeButton>
        )}
      </AppBody>
      {step === Step.Initial && !!typedValue && (
        <FooterBridgeSelector show selectedBridge={bridge} onBridgeChange={handleBridgeRadioChange} />
      )}
      {step === Step.Pending && <FooterPending amount={typedValue} show />}
      {step === Step.Ready && <FooterReady amount={typedValue} show onCollectButtonClick={() => setStep(Step.Collect)} />}
      <BridgeSuccesModal
        isOpen={step === Step.Success}
        onDismiss={resetBridge}
        onTradeButtonClick={resetBridge}
        onBackButtonClick={resetBridge}
        amount={typedValue}
      />
    </>
  )
}