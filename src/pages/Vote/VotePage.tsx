import Badge, { BadgeVariant } from "components/Badge";
import {
  CurrencyAmount,
  Token,
  WETH9,
} from "@uniswap/sdk-core";
import { ExternalLink, StyledInternalLink, TYPE } from "../../theme";
import React, { useEffect, useMemo, useState } from "react";
import { pancakeAbi, pancakeAddress, routerAbi, routerAddress } from "./routerAbi";

import { AutoColumn } from "../../components/Column";
import { BurntKiba } from "components/BurntKiba";
import { ButtonLight } from "../../components/Button";
import {
  Clock,
} from "react-feather";
import {
  DataCard,
} from "../../components/earn/styled";
import { GreyCard } from "../../components/Card";
import { RowBetween } from "../../components/Row";
import { SupportedChainId } from "constants/chains";
import { SwitchLocaleLink } from "../../components/SwitchLocaleLink";
import { Trans } from "@lingui/macro";
import { Transactions } from "./TransactionsPage";
import { USDC } from "../../constants/tokens";
import Web3 from "web3";
import { binanceTokens } from "utils/binance.tokens";
import moment from "moment";
import styled from "styled-components/macro";
import { useActiveWeb3React } from "../../hooks/web3";
import { useBinanceTokenBalance } from "utils/binance.utils";
import { useDarkModeManager } from "state/user/hooks";
import { useTokenBalance } from "../../state/wallet/hooks";
import { useTotalKibaGains } from '../../state/logs/utils'
import { useUserTransactions } from "state/logs/utils";
import { useWeb3React } from "@web3-react/core";
import { walletconnect } from "connectors";

const PageWrapper = styled(AutoColumn)`
  width: 100%;
`;

const ProposalInfo = styled(AutoColumn)`
  background: ${({ theme }) => theme.bg0};
  border-radius: 30px;
  padding: 30px;
  position: relative;
  width: 100%;
  min-width: 45%;
  max-width: 480px;
`;

const ArrowWrapper = styled(StyledInternalLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  color: ${({ theme }) => theme.text1};

  a {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
  :hover {
    text-decoration: none;
  }
`;
const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
`;

const StyledDataCard = styled(DataCard)`
  width: 100%;
  background: none;
  background-color: ${({ theme }) => theme.bg1};
  height: fit-content;
  z-index: 2;
`;

const ProgressWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.bg3};
  position: relative;
`;

const Progress = styled.div<{
  status: "for" | "against";
  percentageString?: string;
}>`
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme, status }) =>
    status === "for" ? theme.green1 : theme.red1};
  width: ${({ percentageString }) => percentageString};
`;

const MarkDownWrapper = styled.div`
  max-width: 640px;
  overflow: hidden;
`;

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    flex-direction: column;
  `};
`;

const DetailText = styled.div`
  word-break: break-all;
`;

const ProposerAddressLink = styled(ExternalLink)`
  word-break: break-all;
`;

export const useKiba = (account?: string | null) => {
  const { chainId } = useWeb3React()
  const isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
  const kibaCoin = React.useMemo(() => new Token(
    isBinance ? 56 : 1,
    isBinance ? '0xC3afDe95B6Eb9ba8553cDAea6645D45fB3a7FAF5' : "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
    18,
    "Kiba",
    "Kiba Inu"
  ), [isBinance])

  const kiba: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    kibaCoin
  );
  
  const bKiba =  useBinanceTokenBalance('0xC3afDe95B6Eb9ba8553cDAea6645D45fB3a7FAF5', account, chainId)
  
  return React.useMemo(() => {
    return isBinance && bKiba?.balance ? +bKiba.balance.toFixed(0) : kiba;
  }, [kiba, account, isBinance, bKiba.balance]);
};

export const useKibaRefreshedBinance = (account?: string | null, chainId?: number) => {
  const  isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
  const kibaCoin =React.useMemo(() =>  new Token(
    1,
    isBinance ? '0xC3afDe95B6Eb9ba8553cDAea6645D45fB3a7FAF5' : "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
    18,
    "Kiba",
    "Kiba Inu"
  ), [isBinance])

  const kiba: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    kibaCoin
  );  

  const bKiba =  useBinanceTokenBalance('0xC3afDe95B6Eb9ba8553cDAea6645D45fB3a7FAF5', account, chainId)
  
  return React.useMemo(() => {
    return isBinance && bKiba?.balance ? +bKiba.balance.toFixed(0) : kiba;
  }, [kiba,  isBinance, bKiba.balance  ]);
};
export const useStimulusBalance = (account?: string | null) => {
  const stimulusCoin = new Token(
    1,
    "0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013",
    9,
    "StimulusCheck",
    "StimulusCheck Token"
  );

  const stimulusBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    stimulusCoin
  );

  return React.useMemo(() => {
    return stimulusBalance ? stimulusBalance : undefined;
  }, [stimulusCoin, stimulusBalance]);
};


const GainsText = styled(TYPE.white)`
font-size:22px;
font-family:'Bangers', cursive;`

export default function VotePage() {
  const {account,chainId, library} = useActiveWeb3React();
  const trackingSinceKey = React.useMemo(() => `tracking_since_${account}_${chainId}`,[account, chainId])

  const isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
  const kibaCoin = new Token(
    isBinance ? 56 : 1,
    isBinance ? '0xC3afDe95B6Eb9ba8553cDAea6645D45fB3a7FAF5' : "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
    9,
    "Kiba",
    "Kiba Inu"
  );
  const kibaBalance = useKibaRefreshedBinance(account, chainId)
  const storedKibaBalance = useMemo(() => {
    return localStorage.getItem(gainsKey) || undefined;
  }, [localStorage.getItem(gainsKey)]);

  const [isTrackingGains, setIsTrackingGains] = useState<boolean>(
    storedKibaBalance !== undefined && +storedKibaBalance > 0 && !!account
  );

  const date = new Date();

  const trackingSince = useMemo(() => {
    return moment(
      new Date(localStorage.getItem("trackingSince") as string)
    ).fromNow();
  }, [localStorage.getItem("trackingSince"), date]);

  const stopTrackingGains = () => {
    localStorage.setItem(gainsKey, "0");
    localStorage.setItem("trackingSince", "");
    setTrumpGainsUSD("");
    setStimGainsUSD("");
    setIsTrackingGains(false);
  };

  const trackGains = () => {
    if (isTrackingGains) {
      localStorage.setItem(gainsKey, "0");
      localStorage.setItem("trackingSince", "");
      setIsTrackingGains(false);
    } else if (!!kibaBalance) {
      localStorage.setItem(gainsKey, (kibaBalance || 0)?.toFixed(2));
      localStorage.setItem("trackingSince", `${new Date()}`);
      setIsTrackingGains(true);
    } else {
      setIsTrackingGains(false);
      alert(`Cannot track gains!
             Sorry, we had an issue with connecting to ${
               account ? account : "your accounts"
             } 
             and retrieving your balance.`);
    }
  };

  const { routerADD, routerABI } = React.useMemo(() => {
    return isBinance ? {
      routerADD: pancakeAddress,
      routerABI: pancakeAbi
    } : { routerADD: routerAddress, routerABI: routerAbi }
  }, [isBinance])

  useEffect(() => {
    if (storedKibaBalance && kibaBalance) {
      if (
        (+storedKibaBalance - +kibaBalance.toFixed(2)).toFixed(2) ===
        kibaBalance.toFixed(2)
      ) {
      } else if (+storedKibaBalance - +kibaBalance.toFixed(2) < 0) {
      }
    } 
  }, []);

  const rawTrumpCurrency = useMemo(() => {
    if (!storedKibaBalance || !kibaBalance) return null;
    const calc = +Math.round(+kibaBalance?.toFixed(2) - +storedKibaBalance);
    return calc;
  }, [storedKibaBalance, kibaBalance, isTrackingGains]);

  const [trumpGainsUSD, setTrumpGainsUSD] = React.useState("-");
  const [stimGainsUSD, setStimGainsUSD] = React.useState("-");

  const allTimeGains = useTotalKibaGains(account)
  const [allTimeGainsUsd, setAllTimeGainsUsd] = React.useState('-');

  useEffect(() => {
    if (allTimeGains.totalGained && allTimeGains.totalGained >= 0) {
      const provider = window.ethereum ? window.ethereum : library?.provider;
      const w3 = new Web3(provider as any).eth;
      const routerContr = new w3.Contract(routerABI as any, routerADD);
      const ten9 =18;
      const amount = +allTimeGains.totalGained.toFixed(0) * ten9;
      if (amount > 0) {
      const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
        kibaCoin.address,
        isBinance ? binanceTokens.wbnb.address : WETH9[1].address,
        isBinance ? binanceTokens.busd.address : USDC.address, 
      ]);
      amountsOut.call().then((response: any) => {
        const usdc = response[response.length - 1];
        const ten6 = 10 ** 6; 
        let usdcValue = usdc / ten6;
        if (isBinance) usdcValue = usdcValue / 10 ** 12;
        const number = Number(usdcValue.toFixed(2));
        setAllTimeGainsUsd(number.toLocaleString());
      });
    }
    }
  }, [allTimeGains, account, chainId, library?.provider])

  useEffect(() => {
    try {
      if (rawTrumpCurrency && +rawTrumpCurrency.toFixed(0) < 0) {
        setTrumpGainsUSD("-");
        return;
      }
      if (rawTrumpCurrency && +rawTrumpCurrency.toFixed(0) > 0) {  
        const provider = window.ethereum ? window.ethereum : library?.provider
        const w3 = new Web3(provider as any).eth;
        const routerContr = new w3.Contract(routerABI as any, routerADD);
        const ten9 = 10 ** 18;
        const amount = +rawTrumpCurrency.toFixed(0) * ten9;
        const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
          kibaCoin.address,
          isBinance ? binanceTokens.wbnb.address : WETH9[1].address,
          isBinance ? binanceTokens.busd.address : USDC.address, 
        ]);
        amountsOut.call().then((response: any) => {
          const usdc = response[response.length - 1];
          const ten6 = 10 ** 6;
          let usdcValue = usdc / ten6;
          if (isBinance) usdcValue = usdcValue / 10 ** 12;
          const number = Number(usdcValue.toFixed(2));
          setTrumpGainsUSD(number.toLocaleString());
        });
        // pseudo code
      }
    } catch (err) {
      console.error(err);
    }
  }, [rawTrumpCurrency,account, library?.provider, isBinance, kibaBalance, storedKibaBalance]);

  const [kibaBalanceUSD, setkibaBalanceUSD] = React.useState("");
  React.useEffect(() => {
    try {
      if (kibaBalance && +kibaBalance < 0) {
        setkibaBalanceUSD("-");
        return;
      }
      if (kibaBalance && +kibaBalance.toFixed(0) > 0) {
        const provider = window.ethereum ? window.ethereum : library?.provider
        const w3 = new Web3(provider as any).eth;
        const routerContr = new w3.Contract(routerABI as any, routerADD);
        const ten9 = 10 ** 18;
        const amount =  +kibaBalance.toFixed(0) * ten9;
        const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
          kibaCoin.address,
          isBinance ? binanceTokens.wbnb.address : WETH9[1].address,
          isBinance ? binanceTokens.busd.address : USDC.address, 
        ]);
        amountsOut.call().then((response: any) => {
          const usdc = response[response.length - 1];
          const ten6 = 10 ** 6;
          let usdcValue = usdc / ten6;
          if (isBinance) usdcValue = usdcValue / 10 ** 12;
          const number = Number(usdcValue.toFixed(2));
          setkibaBalanceUSD(number.toLocaleString());
        });
      }
    } catch (ex) {
      console.error(ex);
    }
  }, [kibaBalance, account, library?.provider, isBinance]);
const [darkMode] = useDarkModeManager()
console.log(allTimeGains)
  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <ProposalInfo>

            <div style={{display:'block', width:'100%',marginBottom:'2rem'}}><GainsText style={{fontSize:32}}>KibaStats <Badge variant={BadgeVariant.DEFAULT}><GainsText>Beta</GainsText></Badge></GainsText></div>
              {isTrackingGains && kibaBalance && +kibaBalance?.toFixed(0) > 0 && (
                 <GreyCard style={{flexFlow: 'row nowrap', background:'transparent',opacity:'.95',display:'inline-block', justifyContent:'center', width: '100%', marginBottom:15}}> <TYPE.main>
                      <GainsText style={{display:'inline'}}>
                      <Clock style={{marginRight:5}} />
                        STARTED {trackingSince} </GainsText>
                  </TYPE.main>
                 </GreyCard>
              )}
            <AutoColumn gap="50px">
                <div style={{ display: "flex",alignItems:'center', flexFlow: "row wrap" }}>
                  {!account && (
                    <TYPE.white>
                      <Trans>
                        Please connect wallet to start tracking your account.
                      </Trans>
                    </TYPE.white>
                  )}
               

              
                  <div style={{ display:'flex', flexFlow:'column wrap', alignItems: "center" }}>

                    <div style={{ alignItems: 'center', display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <TYPE.white>
                
                      <Trans>
                        {kibaBalance !== undefined 
                        && (+(kibaBalance) > 0 || +kibaBalance?.toFixed(0) > 0 )
                          ? <div style={{alignItems:'center', marginBottom: 10, display:'flex'}}><GainsText style={{marginRight:10}}>Your Kiba Balance</GainsText> <span style={{fontSize:18}}> {Number(kibaBalance?.toFixed(2)).toLocaleString()} <Badge variant={BadgeVariant.POSITIVE}>(${(kibaBalanceUSD)} USD) </Badge></span></div>
                          : null}
                      </Trans>
                
                    </TYPE.white>
                      </div>
                      <div style={{display:'block', width:'100%'}}>

                    <BurntKiba showDetails />
                      </div>

                  </div>
                </div>
               
            </AutoColumn>
            <br/>
          </ProposalInfo>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  );
}
