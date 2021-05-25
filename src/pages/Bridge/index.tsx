import React, { useEffect, useState } from 'react'
import styled from 'styled-components';
import QuestionHelper from '../../components/QuestionHelper';
import { RowBetween } from '../../components/Row';
import AppBody from '../AppBody';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import { ButtonPrimary } from '../../components/Button';
import ArrowIcon from '../../assets/svg/arrow.svg';
import { AssetSelector } from './AssetsSelector';
import { FooterBridgeSelector } from './FooterBridgeSelector';
import { FooterPending } from './FooterPending';
import { FooterReady } from './FooterReady';
import { NetworkSwitcher } from './NetworkSwitcher';
import { BridgeSuccesModal } from './BridgeSuccesModal';

const Title = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.purple2};
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
    setStep(Step.Initial)
  }
  
  return (
    <>
      <AppBody>
        <RowBetween mb="12px">
          <Title>{step === Step.Collect ? 'Collect' : 'Swapr Bridge'}</Title>
          <QuestionHelper text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum" />
        </RowBetween>
        <RowBetween mb="12px">
          <AssetSelector
            label="from"
            icon="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"
            name="Arbitrum"
            connected={!isEthereumConnected}
          />
          <ArrowImg src={ArrowIcon} alt="arrow" />
          <AssetSelector
            label="to"
            icon="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"
            name="Ethereum"
            connected={isEthereumConnected}
          />
        </RowBetween>
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
          <ButtonPrimary onClick={() => setStep(Step.Pending)} mt="12px" disabled={isButtonDisabled}>
            {!!amount ? 'Brigde to ethereum' : 'Enter Eth Amount'}
          </ButtonPrimary>
        )}
      </AppBody>
      {step === Step.Initial && !!amount && <FooterBridgeSelector show onBridgeChange={() => {}} />}
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
