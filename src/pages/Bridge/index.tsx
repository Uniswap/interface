import React, { useCallback, useEffect, useState } from 'react'
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
import {
  useBridgeInfo,
  useBridgeActionHandlers,
} from '../../state/bridge/hooks'

import {
  NetworkSwitcher as NetworkSwitcherPopover,
  networkOptionsPreset,
  NetworkOptionProps
} from '../../components/NetworkSwitcher'
import { BridgeNetworkInput } from '../../state/bridge/reducer'

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

// export const useBridgeInputs = () => {
//   const [showFromNetworkList, setShowFromNetworkList] = useState(false)
//   const [showToNetworkList, setShowToNetworkList] = useState(false)
//   const [fromInputNetwork, setFromInputNetwork] = useState<ChainId>(1)
//   const [toInputNetwork, setToInputNetwork] = useState<ChainId>(42161)
//   // const { fromInputNetwork, toInputNetwork, showFromNetworkList, showToNetworkList } = useBridgeInfo()

//   const handleSwap = useCallback(() => {
//     setFromInputNetwork(toInputNetwork)
//     setToInputNetwork(fromInputNetwork)
//   }, [fromInputNetwork, toInputNetwork])

//   const handleFromNetworkChange = useCallback(
//     (chainId: ChainId) => {
//       if (chainId === toInputNetwork) {
//         handleSwap()
//         return
//       }
//       setFromInputNetwork(chainId)
//     },
//     [handleSwap, toInputNetwork]
//   )

//   const handleToNetworkChange = useCallback(
//     (chainId: ChainId) => {
//       if (chainId === fromInputNetwork) {
//         handleSwap()
//         return
//       }
//       setToInputNetwork(chainId)
//     },
//     [fromInputNetwork, handleSwap]
//   )

//   return {
//     handleSwap,
//     showFromNetworkList,
//     setShowFromNetworkList,
//     showToNetworkList,
//     setShowToNetworkList,
//     toInputNetwork,
//     handleToNetworkChange,
//     fromInputNetwork,
//     handleFromNetworkChange
//   }
// }

const createNetworkOptions = ({
  value,
  setValue,
  activeChainId
}: {
  value: ChainId
  setValue: ({chainId, showList}:Partial<BridgeNetworkInput>) => void
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
      onClick: () => setValue({chainId: optionChainId})
    }
  })
}

export default function Bridge() {
  const { account, chainId } = useActiveWeb3React()
  const { selectEthereum, selectNetwork } = useNetworkSwitch()
  const { bridgeCurrency, currencyBalance, parsedAmount, typedValue, fromNetwork, toNetwork } = useBridgeInfo()
  const { onCurrencySelection, onUserInput, onToNetworkChange, onSwapBridgeNetworks,  onFromChange, onFromNetworkShowList} = useBridgeActionHandlers()

  const [step, setStep] = useState(Step.Initial)
  const [bridge, setBridge] = useState('Swapr Fast Exit')

  const isButtonDisabled = !typedValue || step !== Step.Initial
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalance, chainId)
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const handleBridgeRadioChange = useCallback(event => setBridge(event.target.value), [])

  useEffect(() => {
    const timer = setTimeout(() => step === Step.Pending && setStep(Step.Ready), 2000)
    return () => clearTimeout(timer)
  }, [step])

  const resetBridge = () => {
    onUserInput('')
    setStep(Step.Initial)
  }

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const fromOptions = createNetworkOptions({
    value: fromNetwork.chainId,
    setValue: onFromChange,
    activeChainId: !!account ? chainId : -1
  })

  const toOptions = createNetworkOptions({
    value: toNetwork.chainId,
    setValue: onFromChange,
    activeChainId: !!account ? chainId : -1
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
              selectedNetwork={getNetworkOptionById(fromNetwork.chainId, fromOptions)}
              onClick={() => onFromChange({showList:true})}
            />
            <NetworkSwitcherPopover
              show={fromNetwork.showList}
              onOuterClick={() => onFromNetworkShowList}
              options={fromOptions}
              showWalletConnector={false}
            />
          </div>
          <SwapButton onClick={onSwapBridgeNetworks}>
            <img src={ArrowIcon} alt="arrow" />
          </SwapButton>
          <div>
            <AssetSelector
              label="to"
              selectedNetwork={getNetworkOptionById(toNetwork.chainId, toOptions)}
              onClick={() => onToNetworkChange}
            />
            <NetworkSwitcherPopover
              show={toNetwork.showList}
              onOuterClick={() => onToNetworkChange}
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
          onUserInput={onUserInput}
          onMax={handleMaxInput}
          onCurrencySelect={onCurrencySelection}
          disableCurrencySelect={step !== Step.Initial}
          disabled={step !== Step.Initial}
          hideBalance={fromNetwork.chainId !== chainId}
          id="brdige-currency-input"
        />
        {!account ? (
          <ButtonPrimary mt="12px" onClick={toggleWalletSwitcherPopover}>
            Connect Wallet
          </ButtonPrimary>
        ) : fromNetwork.chainId !== chainId ? (
          <ButtonPrimary
            mt="12px"
            onClick={fromNetwork.chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(fromNetwork.chainId)}
          >
            Connect to {getNetworkOptionById(fromNetwork.chainId, fromOptions)?.header}
          </ButtonPrimary>
        ) : step === Step.Collect ? (
          <NetworkSwitcher sendToId={toNetwork.chainId} onCollectClick={() => setStep(Step.Success)} />
        ) : (
          <BridgeButton onClick={() => setStep(Step.Pending)} disabled={isButtonDisabled} from="Arbitrum" to="Ethereum">
            {!typedValue ? 'Enter ETH amount' : `Brigde to ${getNetworkOptionById(toNetwork.chainId, toOptions)?.header}`}
          </BridgeButton>
        ) }
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