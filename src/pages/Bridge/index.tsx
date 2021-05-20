import React, { useState } from 'react'
import styled from 'styled-components';
import QuestionHelper from '../../components/QuestionHelper';
import { RowBetween } from '../../components/Row';
import AppBody from '../AppBody';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import { ButtonPrimary } from '../../components/Button';
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter';
import { Table, Th } from '../../components/Table';
import { HideableAutoColumn } from '../../components/Column';
import ArrowIcon from '../../assets/svg/arrow.svg';
import TriangleIcon from '../../assets/svg/triangle.svg';
import Radio from '../../components/Radio';
import { TYPE } from '../../theme';

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


export default function Bridge() {
  const [amount, setAmount] = useState('');
  
  return (
    <>
      <AppBody>
        <RowBetween mb="12px">
          <Title>Swapr Bridge</Title>
          <QuestionHelper
            text="Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsumLorem ipsum"
          />
        </RowBetween>
        <RowBetween mb="12px">
          <AssetSelector
            label="from"
            icon="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"
            name="Arbitrum"
          />
          <ArrowImg src={ArrowIcon} alt="arrow" />
          <AssetSelector
            label="to"
            icon="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"
            name="Ethereum"
          />
        </RowBetween>
        <CurrencyInputPanel
          label="Amount"
          value={amount}
          showMaxButton
          onUserInput={setAmount}
          onMax={() => {}}
          onCurrencySelect={() => {}}
          id="brdige-currency-input"
        />
        <ButtonPrimary mt="12px">Connect to arbitrum</ButtonPrimary>
      </AppBody>
      <HideableAutoColumn show={true}>
        <AdvancedDetailsFooter fullWidth padding="16px">
          <Table>
            <thead>
              <tr>
                <Th>Exchange</Th>
                <Th align="right">Fee</Th>
                <Th align="right">Gas</Th>
                <Th align="right">Time</Th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ lineHeight: '22px' }}>
                <td>
                  <Radio
                    checked={true}
                    label="Swapr Fast Exit"
                    value=""
                    onChange={() => {}}
                  />
                </td>
                <td align="right">
                  <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                    0.05%
                  </TYPE.main>
                </td>
                <td align="right">
                  <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                    13$
                  </TYPE.main>
                </td>
                <td align="right">
                  <TYPE.subHeader color="white" fontSize="12px" fontWeight="600">
                    30 min
                  </TYPE.subHeader>
                </td>
              </tr>
            </tbody>
          </Table>
        </AdvancedDetailsFooter>
      </HideableAutoColumn>
    </>
  )
}

const Section = styled.button`
  width: 100%;
  padding: 12px 19px 15px;
  background: ${({ theme }) => theme.bg1And2};
  border-radius: 12px;
  border: none;
  text-align: left;
  cursor: pointer;
`;

const SmallLabel = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.purple2};
`

const IconWrapper = styled.div`
  min-height: 36px;
  max-width: 36px;
  margin-bottom: 12px;

  img {
    max-width: 100%;
  }
`;

const AssetName = styled.p`
  position: relative;
  display: inline-block;
  padding-right: 20px;
  margin: 5px 0 0;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text2};

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background: url(${TriangleIcon}) center no-repeat;
    background-size: contain;
  }
`;


interface AssetSelectorProps {
  label: string;
  icon: string;
  name: string;
}

const AssetSelector = ({label, icon, name}: AssetSelectorProps) => {
  return (
    <Section>
      <IconWrapper>
        <img src={icon} alt={name} />
      </IconWrapper>
      <SmallLabel>{label}</SmallLabel>
      <AssetName>{name}</AssetName>
    </Section>
  )
}
