import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components';
import QuestionHelper from '../../components/QuestionHelper';
import { RowBetween } from '../../components/Row';
import AppBody from '../AppBody';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import ArrowIcon from '../../assets/svg/arrow.svg';
import { AssetSelector } from './AssetsSelector';
import { FooterBridgeSelector } from './FooterBridgeSelector';
import { FooterPending } from './FooterPending';
import { FooterReady } from './FooterReady';
import { NetworkSwitcher } from './NetworkSwitcher';
import { BridgeSuccesModal } from './BridgeSuccesModal';
import { ApplicationModal } from '../../state/application/actions';
import { BridgeButton } from './BridgeButton';

const Title = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.purple2};
`;

const Row = styled(RowBetween)`
  & > div {
    width: 100%;
  }
`;


const ArrowImg = styled.img`
  margin: 0 16px;
`;

enum Step {
  Initial,
  Pending,
  Ready,
  Collect,
  Success
}

export default function Bridge() {
  const [step, setStep] = useState(Step.Initial);
  
  const [amount, setAmount] = useState('');
  const [isEthereumConnected, setIsEthereumConnected] = useState(false);  

  const isButtonDisabled = !amount || step !== Step.Initial;
  
  useEffect(() => {
    const timer = setTimeout(() => step === Step.Pending && setStep(Step.Ready), 2000);
    return () => clearTimeout(timer);
  }, [step]);

  const resetBridge = () => {
    setAmount('');
    setStep(Step.Initial);
    setIsEthereumConnected(false);
  }
  
  const [bridge, setBridge] = useState('Swapr Fast Exit');
  const handleBridgeRadioChange = useCallback(event => setBridge(event.target.value), [])
  
  return (
    <>
      <AppBody>
        <RowBetween mb="12px">
          <Title>{step === Step.Collect ? 'Collect' : 'Swapr Bridge'}</Title>
          <QuestionHelper text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum" />
        </RowBetween>
        <Row mb="12px">
          <AssetSelector
            modal={ApplicationModal.NETWORK_SWITCHER_FROM}
            label="from"
            icon="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"
            name="Arbitrum"
            connected={!isEthereumConnected}
          />
          <ArrowImg src={ArrowIcon} alt="arrow" />
          <AssetSelector
            modal={ApplicationModal.NETWORK_SWITCHER_TO}
            label="to"
            icon="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"
            name="Ethereum"
            connected={isEthereumConnected}
          />
        </Row>
        <CurrencyInputPanel
          label="Amount"
          value={amount}
          showMaxButton
          onUserInput={setAmount}
          onMax={() => {}}
          onCurrencySelect={() => {}}
          disableCurrencySelect={step !== Step.Initial}
          disabled={step !== Step.Initial}
          id="brdige-currency-input"
        />
        {step === Step.Collect ? (
          <NetworkSwitcher
            isEthereumConnected={isEthereumConnected}
            onSwitchClick={() => setIsEthereumConnected(true)}
            onCollectClick={() => setStep(Step.Success)}
          />
        ) : (
          <BridgeButton onClick={() => setStep(Step.Pending)} disabled={isButtonDisabled} from="Arbitrum" to="Ethereum">
            {!!amount ? 'Brigde to ethereum' : 'Enter Eth Amount'}
          </BridgeButton>
        )}
      </AppBody>
      {step === Step.Initial && !!amount && (
        <FooterBridgeSelector
          show
          selectedBridge={bridge}
          onBridgeChange={handleBridgeRadioChange}
        />
      )}
      {step === Step.Pending && <FooterPending amount={amount} show />}
      {step === Step.Ready && <FooterReady amount={amount} show onCollectButtonClick={() => setStep(Step.Collect)} />}
      <BridgeSuccesModal
        isOpen={step === Step.Success}
        onDismiss={resetBridge}
        onTradeButtonClick={resetBridge}
        onBackButtonClick={resetBridge}
        amount={amount}
      />
    </>
  )
}
