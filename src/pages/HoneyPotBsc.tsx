import { DarkCard } from 'components/Card';
import { walletconnect } from 'connectors';
import React from 'react';
import { isAddress } from 'utils';
import Web3 from 'web3'
import styled from 'styled-components/macro'
import { useWeb3React } from '@web3-react/core';
import { AutoColumn } from 'components/Column';
import { RowFixed } from 'components/Row';
import { AlertOctagon, CheckCircle } from 'react-feather';
import { useKiba } from './Vote/VotePage';
const StyledHeader = styled.div`
  font-family:"Bangers", cursive;
  font-size:22px;
`
export const HoneyPotBsc = ( ) => {
    const [msg, setMsg] = React.useState('')
    const [honeyData, setHoneyData] = React.useState<any>({})
    
    const provider = window.ethereum ? window.ethereum : walletconnect
    const [address, setAddress] = React.useState('')
    const web3 = new Web3(provider as any);
    const { account } = useWeb3React();
    const kibaBalance = useKiba(account)
    const runInteraction = (address: string ) => {
        if(isAddress(address)) {
            const honey_data: Record<string, any> = { };
    const encodedAddress = web3.eth.abi.encodeParameter('address', address);
    const contractFuncData = '0xd66383cb';
    const callData = contractFuncData+encodedAddress.substring(2);
    const tokenName = '';
    const tokenSymbol = '';
    const tokenDecimals = 0;
    const maxSell = 0;
    const maxTXAmount = 0;
    const bnbIN = 1000000000000000000;
    let buy_tax = null, sell_tax = null;
    const maxTxBNB:any = null;
    const blacklisted: Record<string, string> = {
        '0xa914f69aef900beb60ae57679c5d4bc316a2536a': 'SPAMMING SCAM',
        '0x105e62565a31c269439b29371df4588bf169cef5': 'SCAM',
        '0xbbd1d56b4ccab9302aecc3d9b18c0c1799fe7525': 'Error: TRANSACTION_FROM_FAILED'
    };
    const unableToCheck: Record<string, string> = {
        '0x54810d2e8d3a551c8a87390c4c18bb739c5b2063': 'Coin does not utilise PancakeSwap'
    };

    if(!!blacklisted[address.toLowerCase()]) {
        honey_data['message']= blacklisted[address.toLowerCase()];
        setHoneyData(honey_data);
        return;
    }
    if(unableToCheck[address.toLowerCase()] !== undefined) {
        honey_data['message']= unableToCheck[address.toLowerCase()];
        setHoneyData(honey_data);
        return;
    }

    let val = 100000000000000000;
    if(bnbIN < val) {
        val = bnbIN - 1000;
    }
    web3.eth.call({
        to: '0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc',
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: val,
        gas: 45000000,
        data: callData,
    })
    .then((val) => {
        const honey_data: Record<string, any> = { };
        const warnings = [];
        const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
        const buyExpectedOut = web3.utils.toBN(decoded[0]);
        const buyActualOut = web3.utils.toBN(decoded[1]);
        const sellExpectedOut = web3.utils.toBN(decoded[2]);
        const sellActualOut = web3.utils.toBN(decoded[3]);
        const buyGasUsed = web3.utils.toBN(decoded[4]);
        const sellGasUsed = web3.utils.toBN(decoded[5]);
        buy_tax = Math.round((+buyExpectedOut - +buyActualOut) / +buyExpectedOut * 100 * 10) / 10;
        sell_tax = Math.round((+sellExpectedOut - +sellActualOut) / +sellExpectedOut * 100 * 10) / 10;
        honey_data['sellTax'] = sell_tax;
        honey_data['buyTax'] = buy_tax;
        if(+buy_tax + +sell_tax > 80) {
            honey_data['isHoneyPot'] = true;
            warnings.push("Extremely high tax. Effectively a honeypot.")
        }else if(+buy_tax + sell_tax > 40) {
            warnings.push("Really high tax.");
        }
        if(+sellGasUsed > 1500000) {
            warnings.push("Selling costs a lot of gas.");
        }
        console.log(buy_tax, sell_tax);
        let maxdiv = '';
        if(maxTXAmount != 0 || maxSell != 0) {
            let n = 'Max TX';
            let x = maxTXAmount;
            if(maxSell != 0) {
                n = 'Max Sell';
                x = maxSell;
                honey_data['maxSell'] = maxSell;
            }
            let bnbWorth:number | string = '?'
            if(maxTxBNB != null) {
                bnbWorth = Math.round(maxTxBNB / 10**15) / 10**3;
                honey_data['maxTxAmount'] = maxSell;
            }
            const tokens = Math.round(x / 10**tokenDecimals);
            maxdiv = '<p>'+n+': ' + tokens + ' ' + tokenSymbol + ' (~'+bnbWorth+' BNB)</p>';
        }
        let warningmsg = '';
        let uiType = 'success';
        let warningsEncountered = false;
        if(warnings.length > 0) {
            warningsEncountered = true;
            uiType = 'warning';
            warningmsg = '<p><ul>WARNINGS';
            for(let i = 0; i < warnings.length; i++) {
                warningmsg += '<li>'+warnings[i]+'</li>';
            }
            warningmsg += '</ul></p>';
        }
        setHoneyData({ran: true, ...honey_data, isHoneyPot: false, buyTax: buy_tax, sellTax: sell_tax, name: tokenName, symbol: tokenSymbol })
    })
    .catch(err => {
        if(err == 'Error: Returned error: execution reverted') {
            setHoneyData({isHoneyPot: false, message: "Unable to run the contract interaction. Be very careful with this contract address.", name: tokenName, symbol: tokenSymbol })
            return;
        }
        setHoneyData({ran: true, ...honey_data, isHoneyPot: true, message: "Honeypot detected. Do NOT invest.", name: tokenName, symbol: tokenSymbol })
    });

    } else if (!address) setHoneyData({})
}

const hasInvalidPermissions = React.useMemo(() => !account || !kibaBalance || (!!kibaBalance && +kibaBalance?.toFixed(0) <= 0), [account, kibaBalance])

return (
   <DarkCard style={{background:'radial-gradient(#f5b642, rgba(129,3,3,.95))', opacity: '.96', maxWidth: 600 }} id="honeypage">
    <div style={{ maxWidth: 600, margin: 'auto', paddingBottom: '1rem' }}>
      <StyledHeader>Honeypot Checker (BSC)</StyledHeader>
      <small>Disclaimer: This is an experimental service, use at your own risk and make sure to double check all contract interactions.</small>
    </div>
    <RowFixed style={{ maxWidth: 600, width: "100%" }} >
      {hasInvalidPermissions === false &&
        <AutoColumn style={{ maxWidth: 600, width: "100%" }} gap={'md'}>
          <label>Input a contract address to check if its a honeypot</label>
          <input style={{ padding: 8, width: '100%', marginBottom: 5 }} type={'search'} placeholder={"Input a contract address to check if a honeypot"} onChange={e => runInteraction(e.target.value)} />
        </AutoColumn>
      }

      {hasInvalidPermissions &&
        <p>You must hold Kiba Inu tokens in order to use this feature.
        </p>}
    </RowFixed>
    <RowFixed>
      <AutoColumn>
        {honeyData && honeyData['ran'] && honeyData['isHoneyPot'] && <div style={{ textAlign: 'center', display: 'flex' }}><AlertOctagon /> HONEY POT DETECTED </div>}
        {honeyData && honeyData['ran'] && !honeyData['isHoneyPot'] && <div style={{ textAlign: 'center', display: 'flex' }}><CheckCircle /> This is not a honey pot. </div>}
        {honeyData && +honeyData['buyTax'] > 0 && <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: 15, paddingTop: 15, display: 'flex', flexFlow: 'row wrap' }}>
          <div style={{ marginRight: '8px' }}>
            <StyledHeader>Buy Tax <br /> {honeyData['buyTax']}% </StyledHeader>
          </div>
          <div style={{ marginRight: '8px' }}>
            <StyledHeader>Sell Tax <br /> {honeyData['sellTax']}% </StyledHeader>
          </div>

          {honeyData && honeyData['maxTxAmount'] && <div style={{ marginRight: '8px' }}>
            <StyledHeader>Max Transaction <br /> {honeyData['maxTxAmount']} </StyledHeader>
          </div>}

          {honeyData && honeyData['maxSell'] && <div style={{ marginRight: '8px' }}>
            <StyledHeader>Max Sell <br /> {honeyData['maxSell']} </StyledHeader>
          </div>}
        </div>
        }

      </AutoColumn>
    </RowFixed>
  </DarkCard>
  )

}