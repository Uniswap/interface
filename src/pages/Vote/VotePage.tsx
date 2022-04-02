import {
  CurrencyAmount,
  Token,
  WETH9,
} from "@uniswap/sdk-core";
import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
} from "react-feather";
import styled from "styled-components/macro";
import { ButtonLight } from "../../components/Button";
import { GreyCard } from "../../components/Card";
import { AutoColumn } from "../../components/Column";
import {
  DataCard,
} from "../../components/earn/styled";
import { RowBetween } from "../../components/Row";
import { SwitchLocaleLink } from "../../components/SwitchLocaleLink";
import { USDC } from "../../constants/tokens";
import { useActiveWeb3React } from "../../hooks/web3";
import { useTokenBalance } from "../../state/wallet/hooks";
import { ExternalLink, StyledInternalLink, TYPE } from "../../theme";
import { Trans } from "@lingui/macro";
import Badge from "components/Badge";
import moment from "moment";
import Web3 from "web3";
import { routerAbi, routerAddress, pancakeAbi, pancakeAddress } from "./routerAbi";
import { walletconnect } from "connectors";
import { useDarkModeManager } from "state/user/hooks";
import { useWeb3React } from "@web3-react/core";
import { SupportedChainId } from "constants/chains";
import { useBinanceTokenBalance } from "utils/binance.utils";
import { binanceTokens } from "utils/binance.tokens";
import { useUserTransactions } from "state/logs/utils";
import { Transactions } from "./TransactionsPage";
const PageWrapper = styled(AutoColumn)`
  width: 100%;
`;

const ProposalInfo = styled(AutoColumn)`
  background: ${({ theme }) => theme.bg0};
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  max-width: 640px;
  width: 100%;
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
    isBinance ? '0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341' : "0x4b2c54b80b77580dc02a0f6734d3bad733f50900",
    9,
    "Kiba",
    "Kiba Inu"
  ), [isBinance])

  const kiba: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    kibaCoin
  );
  
  const bKiba =  useBinanceTokenBalance('0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341', account, chainId)
  
  return React.useMemo(() => {
    return isBinance && bKiba?.balance ? +bKiba.balance.toFixed(0) : kiba;
  }, [kiba, account, isBinance, bKiba.balance]);
};

export const useKibaRefreshedBinance = (account?: string | null, chainId?: number) => {
  const  isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
  const kibaCoin =React.useMemo(() =>  new Token(
    1,
    isBinance ? '0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341' : "0x4b2c54b80b77580dc02a0f6734d3bad733f50900",
    9,
    "Kiba",
    "Kiba Inu"
  ), [isBinance])

  const kiba: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    kibaCoin
  );  

  const bKiba =  useBinanceTokenBalance('0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341', account, chainId)
  
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
  const {account,chainId} = useActiveWeb3React();
  const gainsKey = React.useMemo(() => `kibaBalance_${account}`,[account])

  const isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
  const kibaCoin = new Token(
    isBinance ? 56 : 1,
    isBinance ? '0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341' : "0x4b2c54b80b77580dc02a0f6734d3bad733f50900",
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


  useEffect(() => {
    try {
      if (rawTrumpCurrency && +rawTrumpCurrency.toFixed(0) < 0) {
        setTrumpGainsUSD("-");
        return;
      }
      if (rawTrumpCurrency && +rawTrumpCurrency.toFixed(0) > 0) {  
        const provider = window.ethereum ? window.ethereum : walletconnect
        const w3 = new Web3(provider as any).eth;
        const routerContr = new w3.Contract(routerABI as any, routerADD);
        const ten9 = 10 ** 9;
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
  }, [rawTrumpCurrency, isBinance, kibaBalance, storedKibaBalance]);

  const [kibaBalanceUSD, setKibaBalanceUSD] = React.useState("");
  React.useEffect(() => {
    try {
      if (kibaBalance && +kibaBalance < 0) {
        setKibaBalanceUSD("-");
        return;
      }
      if (kibaBalance && +kibaBalance.toFixed(0) > 0) {
        const provider = window.ethereum ? window.ethereum : walletconnect
        const w3 = new Web3(provider as any).eth;
        const routerContr = new w3.Contract(routerABI as any, routerADD);
        const ten9 = 10 ** 9;
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
          setKibaBalanceUSD(number.toLocaleString());
        });
      }
    } catch (ex) {
      console.error(ex);
    }
  }, [kibaBalance,  isBinance]);
const [darkMode] = useDarkModeManager()

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <ProposalInfo>

            <div style={{display:'block', width:'100%',marginBottom:'2rem'}}><GainsText style={{fontSize:32}}>KibaGains</GainsText></div>
              {isTrackingGains && kibaBalance && +kibaBalance?.toFixed(0) > 0 && (
                 <GreyCard style={{flexFlow: 'row nowrap', background:'#222',opacity:'.95',display:'inline-block', justifyContent:'center',marginBottom:15}}> <TYPE.main>
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
                        Please connect wallet to start tracking gains.
                      </Trans>
                    </TYPE.white>
                  )}
               
               {(kibaBalance  === undefined || +kibaBalance?.toFixed(0) <= 0) && (
                    <TYPE.white>
                      <GainsText>
                        You must own Kiba Inu tokens to use this feature.
                      </GainsText>
                    </TYPE.white>
                  )}
              
                  <div style={{ display:'flex', flexFlow:'column wrap', alignItems: "center" }}>
                 
                    <div style={{display:'block', width:'100%'}}>
                    <TYPE.white>
                      <Trans>
                        {kibaBalance !== undefined 
                        && (+(kibaBalance) > 0 || +kibaBalance?.toFixed(0) > 0 )
                          ? <div style={{display:'flex'}}><GainsText style={{marginRight:10}}>Kiba Balance</GainsText> <span style={{fontSize:18}}> {Number(kibaBalance?.toFixed(2)).toLocaleString()} (${(kibaBalanceUSD)} USD) </span></div>
                          : null}
                      </Trans>
                    </TYPE.white>
                      </div>
                      <div style={{display:'block', width:'100%', marginTop:15}}>

                      {isTrackingGains === true && (
                      <GainsText  className="d-flex">
                        {storedKibaBalance !== undefined &&
                          kibaBalance !== undefined &&
                          +kibaBalance?.toFixed(0) > 0 &&
                          account !== undefined && (
                            <React.Fragment>
                              <Trans>{`Kiba Gains`} </Trans> &nbsp;
                              <span>{Number((
                                +kibaBalance?.toFixed(2) - +storedKibaBalance
                              ).toFixed(2)).toLocaleString()} </span>
                              {isTrackingGains && trumpGainsUSD && (
                                <Badge style={{ marginTop: 5, color:"#FFF",paddingTop: 5 }}>
                                  <small>
                                    <GainsText>Total Reflections</GainsText>
                                  </small>
                                  &nbsp;
                                  {rawTrumpCurrency &&
                                  +rawTrumpCurrency?.toFixed(0) > 0
                                    ? <> {'$'}{trumpGainsUSD}</>
                                    : "-"}
                                    &nbsp;<Trans>USD</Trans>
                                </Badge>
                              )}
                            </React.Fragment>
                          )}
                      </GainsText>
                    )}
                      </div>

                  </div>
                </div>
                
            </AutoColumn>
            { !!kibaBalance && +kibaBalance?.toFixed(0) > 0 &&
            <AutoColumn gap="50px">
              <ButtonLight style={{background: darkMode ? '#fff ' : 'inherit', color: darkMode ? '#222' : '#fff', marginTop:15}} onClick={trackGains}>
                {isTrackingGains && <Trans>Stop Tracking</Trans>}
                {!isTrackingGains&& <Trans>Start Tracking</Trans>}
              </ButtonLight>
            </AutoColumn>
}
            <br/>
            <small style={{marginTop:2, marginBottom:2}}>When switching networks, you need to restart tracking (stop and start tracking again).</small>
          </ProposalInfo>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  );
}
