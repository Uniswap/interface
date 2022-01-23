import { DarkCard } from 'components/Card';
import { walletconnect } from 'connectors';
import React from 'react';
import { isAddress } from 'utils';
import Web3 from 'web3'
import styled from 'styled-components/macro'
import { useWeb3React } from '@web3-react/core';
import { AutoColumn } from 'components/Column';
import { RowFixed } from 'components/Row';
import { AlertOctagon, CheckCircle, Info } from 'react-feather';
import { useKiba } from './Vote/VotePage';
import Swal from 'sweetalert2';
import { useContractOwner } from 'components/swap/ConfirmSwapModal';
import Badge, { BadgeVariant } from 'components/Badge';
import Tooltip from 'components/Tooltip';
import { TopTokenHolders } from 'components/TopTokenHolders/TopTokenHolders';
const StyledHeader = styled.div`
  font-family:"Bangers", cursive;
  font-size:22px;
`
// eslint-disable-next-line
export const isHoneyPotBsc = async (address: string, provider: any): Promise<boolean> => {
  const web3 = new Web3(provider as any);
  let maxTXAmount = 0;
  let maxSell = 0;

  async function tryGetMaxes() {
    let sig = web3.eth.abi.encodeFunctionSignature({ name: '_maxTxAmount', type: 'function', inputs: [] });
    let d = {
      to: address,
      from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
      value: 0,
      gas: 15000000,
      data: sig,
    };
    try {
      const val = await web3.eth.call(d);
      maxTXAmount = web3.utils.toBN(val) as any;
      console.log(val, maxTXAmount);
    } catch (e) {
      console.log('_maxTxAmount: ', e);
      // I will nest as much as I want. screw javascript.
      sig = web3.eth.abi.encodeFunctionSignature({ name: 'maxSellTransactionAmount', type: 'function', inputs: [] });
      d = {
        to: address,
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: 0,
        gas: 15000000,
        data: sig,
      };
      try {
        const val2 = await web3.eth.call(d);
        maxSell = web3.utils.toBN(val2) as any;
        console.log(val2, maxSell);
      } catch (e) {

      }
    }
  }
  if (!isAddress(address)) return Promise.resolve(false);
  if (isAddress(address)) {
    try {
      const honeyData: Record<string, any> = {};
      const encodedAddress = web3.eth.abi.encodeParameter('address', address);
      const contractFuncData = '0xd66383cb';
      const callData = contractFuncData + encodedAddress.substring(2);
      const tokenName = '';
      const tokenSymbol = '';
      const tokenDecimals = 0;
      const bnbIN = 1000000000000000000;
      const maxTxBNB: any = null;
      const blacklisted: Record<string, string> = {
        '0xa914f69aef900beb60ae57679c5d4bc316a2536a': 'SPAMMING SCAM',
        '0x105e62565a31c269439b29371df4588bf169cef5': 'SCAM',
        '0xbbd1d56b4ccab9302aecc3d9b18c0c1799fe7525': 'Error: TRANSACTION_FROM_FAILED'
      };
      const unableToCheck: Record<string, string> = {
        '0x54810d2e8d3a551c8a87390c4c18bb739c5b2063': 'Coin does not utilise PancakeSwap'
      };

      if (blacklisted[address.toLowerCase()]) {
        honeyData.message = blacklisted[address.toLowerCase()];
        return Promise.resolve(false);
      }
      if (unableToCheck[address.toLowerCase()] !== undefined) {
        honeyData.message = unableToCheck[address.toLowerCase()];
        return Promise.resolve(false);
      }

      let val = 100000000000000000;
      if (bnbIN < val) {
        val = bnbIN - 1000;
      }
      return new Promise<boolean>((resolve, reject) => {
        web3.eth.call({
          to: '0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc',
          from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
          value: val,
          gas: '0x' + (45000000).toString(16),
          data: callData,
        })
          .then(async (updatedVal) => {
            await tryGetMaxes()
            const warnings = [];
            const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], updatedVal);
            const buyExpectedOut = web3.utils.toBN(decoded[0]);
            const buyActualOut = web3.utils.toBN(decoded[1]);
            const sellExpectedOut = web3.utils.toBN(decoded[2]);
            const sellActualOut = web3.utils.toBN(decoded[3]);
            const buyGasUsed = web3.utils.toBN(decoded[4]);
            const sellGasUsed = web3.utils.toBN(decoded[5]);
            const buyTax = Math.round((+buyExpectedOut - +buyActualOut) / +buyExpectedOut * 100 * 10) / 10;
            const sellTax = Math.round((+sellExpectedOut - +sellActualOut) / +sellExpectedOut * 100 * 10) / 10;

            honeyData.sellTax = sellTax;
            honeyData.buyTax = buyTax;
            if (+buyTax + +sellTax > 80) {
              honeyData.isHoneyPot = true;
              warnings.push("Extremely high tax. Effectively a honeypot.")
              return resolve(true);
            }
            if (+sellGasUsed > 1500000) {
              warnings.push("Selling costs a lot of gas.");
            }
            console.log(buyTax, sellTax);
            let maxDiv = '';
            if (maxTXAmount !== 0 || maxSell !== 0) {
              let n = 'Max TX';
              let x = maxTXAmount;
              if (maxSell !== 0) {
                n = 'Max Sell';
                x = maxSell;
                honeyData.maxSell = maxSell;
              }
              let bnbWorth: number | string = '?'
              if (maxTxBNB !== null) {
                bnbWorth = Math.round(maxTxBNB / 10 ** 15) / 10 ** 3;
                honeyData.maxTxAmount = maxSell;
              }
              const tokens = Math.round(x / 10 ** tokenDecimals);
              maxDiv = `<p>${n}: ${tokens} ${tokenSymbol} (~ ${bnbWorth} BNB)</p>`;
            }
            let warningmsg = '';
            let uiType = 'success';
            let warningsEncountered = false;
            if (warnings.length > 0) {
              warningsEncountered = true;
              uiType = 'warning';
              warningmsg = '<p><ul>WARNINGS';
              for (let i = 0; i < warnings.length; i++) {
                warningmsg += `<li>${warnings[i]}</li>`;
              }
              warningmsg += '</ul></p>';
            }
            return resolve(false);
          })
          .catch(err => {
            if (err === 'Error: Returned error: execution reverted') {
              return resolve(true);
            }
            return resolve(true);
          });
      })
    } catch (ex) {
      return Promise.resolve(true)
    }
  } else return Promise.resolve(false)
}

export const HoneyPotBsc = () => {
  const [msg, setMsg] = React.useState('')
  const [honeyData, setHoneyData] = React.useState<any>({})
  const [showTip, setShowTip] = React.useState(false)
  const { account, library } = useWeb3React();
  const provider = window.ethereum ? window.ethereum : library?.provider
  const [address, setAddress] = React.useState('')
  const web3 = new Web3(provider as any);
  const contractOwner = useContractOwner(msg)
  const kibaBalance = useKiba(account)
  const runInteraction = (address: string) => {
    if (isAddress(address)) {
      setMsg(address)
      const honey_data: Record<string, any> = {};
      const encodedAddress = web3.eth.abi.encodeParameter('address', address);
      const contractFuncData = '0xd66383cb';
      const callData = contractFuncData + encodedAddress.substring(2);
      const tokenName = '';
      const tokenSymbol = '';
      const tokenDecimals = 0;
      const maxSell = 0;
      const maxTXAmount = 0;
      const bnbIN = 1000000000000000000;
      const maxTxBNB: any = null;
      const blacklisted: Record<string, string> = {
        '0xa914f69aef900beb60ae57679c5d4bc316a2536a': 'SPAMMING SCAM',
        '0x105e62565a31c269439b29371df4588bf169cef5': 'SCAM',
        '0xbbd1d56b4ccab9302aecc3d9b18c0c1799fe7525': 'Error: TRANSACTION_FROM_FAILED'
      };
      const unableToCheck: Record<string, string> = {
        '0x54810d2e8d3a551c8a87390c4c18bb739c5b2063': 'Coin does not utilise PancakeSwap'
      };

      if (!!blacklisted[address.toLowerCase()]) {
        honey_data['message'] = blacklisted[address.toLowerCase()];
        setHoneyData(honey_data);
        return;
      }
      if (unableToCheck[address.toLowerCase()] !== undefined) {
        honey_data['message'] = unableToCheck[address.toLowerCase()];
        setHoneyData(honey_data);
        return;
      }

      let val = 100000000000000000;
      if (bnbIN < val) {
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
          const honey_data: Record<string, any> = {};
          const warnings = [];
          const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
          const buyExpectedOut = web3.utils.toBN(decoded[0]);
          const buyActualOut = web3.utils.toBN(decoded[1]);
          const sellExpectedOut = web3.utils.toBN(decoded[2]);
          const sellActualOut = web3.utils.toBN(decoded[3]);
          const buyGasUsed = web3.utils.toBN(decoded[4]);
          const sellGasUsed = web3.utils.toBN(decoded[5]);
          const buy_tax = Math.round((+buyExpectedOut - +buyActualOut) / +buyExpectedOut * 100 * 10) / 10;
          const sell_tax = Math.round((+sellExpectedOut - +sellActualOut) / +sellExpectedOut * 100 * 10) / 10;

          honey_data['sellTax'] = sell_tax;
          honey_data['buyTax'] = buy_tax;
          if (+buy_tax + +sell_tax > 80) {
            honey_data['isHoneyPot'] = true;
            warnings.push("Extremely high tax. Effectively a honeypot.")
          } else if (+buy_tax + sell_tax > 40) {
            warnings.push("Really high tax.");
          }
          if (+sellGasUsed > 1500000) {
            warnings.push("Selling costs a lot of gas.");
          }
          console.log(buy_tax, sell_tax);
          let maxdiv = '';
          if (maxTXAmount != 0 || maxSell != 0) {
            let n = 'Max TX';
            let x = maxTXAmount;
            if (maxSell != 0) {
              n = 'Max Sell';
              x = maxSell;
              honey_data['maxSell'] = maxSell;
            }
            let bnbWorth: number | string = '?'
            if (maxTxBNB != null) {
              bnbWorth = Math.round(maxTxBNB / 10 ** 15) / 10 ** 3;
              honey_data['maxTxAmount'] = maxSell;
            }
            const tokens = Math.round(x / 10 ** tokenDecimals);
            maxdiv = '<p>' + n + ': ' + tokens + ' ' + tokenSymbol + ' (~' + bnbWorth + ' BNB)</p>';
          }
          let warningmsg = '';
          let uiType = 'success';
          let warningsEncountered = false;
          if (warnings.length > 0) {
            warningsEncountered = true;
            uiType = 'warning';
            warningmsg = '<p><ul>WARNINGS';
            for (let i = 0; i < warnings.length; i++) {
              warningmsg += '<li>' + warnings[i] + '</li>';
            }
            warningmsg += '</ul></p>';
          }
          setHoneyData({ ran: true, ...honey_data, isHoneyPot: false, buyTax: buy_tax, sellTax: sell_tax, name: tokenName, symbol: tokenSymbol })
        })
        .catch(err => {
          if (err == 'Error: Returned error: execution reverted') {
            setHoneyData({ isHoneyPot: false, message: "Unable to run the contract interaction. Be very careful with this contract address.", name: tokenName, symbol: tokenSymbol })
            return;
          }
          setHoneyData({ ran: true, ...honey_data, isHoneyPot: true, message: "Honeypot detected. Do NOT invest.", name: tokenName, symbol: tokenSymbol })
        });

    } else {
      if (address) Swal.fire({ title: "The address you entered was not a contract address", icon: 'error', toast: true, timer: 5000, timerProgressBar: true, showConfirmButton: false })
      setHoneyData({})
      setMsg('');
    }
  }


  const hasInvalidPermissions = React.useMemo(() => !account || !kibaBalance || (!!kibaBalance && +kibaBalance?.toFixed(0) <= 0), [account, kibaBalance])

  return (
    <DarkCard style={{ background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))', opacity: '.96', maxWidth: 600 }} id="honeypage">
      <div style={{ maxWidth: 600, display: 'flex', flexFlow: 'column wrap', margin: 'auto', paddingBottom: '1rem' }}>
        <Badge style={{ width: 200 }}><StyledHeader>Honeypot Checker (BSC)</StyledHeader></Badge>
        <small style={{ marginTop: 3, paddingLeft: 3 }}>Disclaimer: This is an experimental service, use at your own risk and make sure to double check all contract interactions.</small>
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
          <div style={{ paddingBottom: 15, paddingTop: 15, display: 'flex', flexFlow: 'row wrap' }}>
            {honeyData && honeyData['ran'] && honeyData['isHoneyPot'] && <Badge variant={BadgeVariant.NEGATIVE} style={{ display: 'flex', color: "#FFF" }}><AlertOctagon />&nbsp;HONEY POT DETECTED </Badge>}
            {honeyData && honeyData['ran'] && !honeyData['isHoneyPot'] && <Badge variant={BadgeVariant.POSITIVE} style={{ display: 'flex', color: "#FFF" }}><CheckCircle />&nbsp;This is not a honey pot. </Badge>}
            {honeyData && honeyData['ran'] && contractOwner && (
            <React.Fragment>
              <div style={{ marginRight: '8px' }}>
                <Badge variant={contractOwner === '0x0000000000000000000000000000000000000000' ? BadgeVariant.POSITIVE : BadgeVariant.WARNING}>Ownership {contractOwner !== '0x0000000000000000000000000000000000000000' && <> NOT </>} Renounced &nbsp; <Tooltip show={showTip} text={<>{'The contract is owned by '} <a href={`https://bscscan.com/address/${contractOwner}`}>{contractOwner}</a> </>}> <Info onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setTimeout(() => setShowTip(false), 1500)} /></Tooltip></Badge>
              </div>

              <TopTokenHolders address={msg} chainId={56} />
            </React.Fragment>
            )
            }
          </div>

          {honeyData && +honeyData['buyTax'] > 0 && <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: 15, display: 'flex', flexFlow: 'row wrap' }}>
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