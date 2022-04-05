import {
  BigintIsh,
  Currency,
  CurrencyAmount,
  Price,
  Rounding,
  Token,
  WETH9,
} from "@uniswap/sdk-core";
import { BigNumber } from "ethers";
import useCurrentBlockTimestamp from "hooks/useCurrentBlockTimestamp";
import JSBI from "jsbi";
import { DateTime } from "luxon";
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Clock,
  DollarSign,
  Info,
  Type,
} from "react-feather";
import ReactMarkdown from "react-markdown";
import { Link, RouteComponentProps } from "react-router-dom";
import styled from "styled-components/macro";
import { ButtonPrimary,ButtonLight } from "../../components/Button";
import { GreyCard } from "../../components/Card";
import { AutoColumn } from "../../components/Column";
import {
  CardBGImage,
  CardBGImageSmaller,
  CardSection,
  DataCard,
} from "../../components/earn/styled";
import { RowBetween, RowFixed } from "../../components/Row";
import { SwitchLocaleLink } from "../../components/SwitchLocaleLink";
import DelegateModal from "../../components/vote/DelegateModal";
import VoteModal from "../../components/vote/VoteModal";
import {
  AVERAGE_BLOCK_TIME_IN_SECS,
  COMMON_CONTRACT_NAMES,
  DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
} from "../../constants/governance";
import { ZERO_ADDRESS } from "../../constants/misc";
import { UNI, USDC, USDT } from "../../constants/tokens";
import { useActiveWeb3React } from "../../hooks/web3";
import { ApplicationModal } from "../../state/application/actions";
import {
  useBlockNumber,
  useModalOpen,
  useToggleDelegateModal,
  useToggleVoteModal,
} from "../../state/application/hooks";
import {
  ProposalData,
  ProposalState,
  useProposalData,
  useUserDelegatee,
  useUserVotesAsOfBlock,
} from "../../state/governance/hooks";
import { useCurrencyBalance, useTokenBalance } from "../../state/wallet/hooks";
import { ExternalLink, StyledInternalLink, TYPE } from "../../theme";
import { isAddress } from "../../utils";
import { ExplorerDataType, getExplorerLink } from "../../utils/getExplorerLink";
import { ProposalStatus } from "./styled";
import { t, Trans } from "@lingui/macro";
import { useTokenComparator } from "components/SearchModal/sorting";
import Card from "components/Card";
import { useAllTokens, useToken } from "hooks/Tokens";
import { computeFiatValuePriceImpact } from "utils/computeFiatValuePriceImpact";
import Header from "components/Header";
import { relative } from "path";
import { DialogOverlay } from "@reach/dialog";
import Badge from "components/Badge";
import { mnemonicToEntropy } from "ethers/lib/utils";
import moment from "moment";
import { BlueCard } from "components/Card";
import Tooltip from "components/Tooltip";
import { FiatValue } from "components/CurrencyInputPanel/FiatValue";
import useUSDCPrice, { useUSDCValue } from "hooks/useUSDCPrice";
import { gql } from "graphql-request";
import { formatCurrencyAmount, formatPrice } from "utils/formatCurrencyAmount";
import FormattedCurrencyAmount from "components/FormattedCurrencyAmount";
import { tryParsePrice } from "state/mint/v3/utils";
import { useV2TradeExactIn, useV2TradeExactOut } from "hooks/useV2Trade";
import { usePool } from "hooks/usePools";
import { usePoolActiveLiquidity } from "hooks/usePoolTickData";
import Web3 from "web3";
import { abi } from "./abi";
import { routerAbi, routerAddress, pancakeAbi, pancakeAddress } from "./routerAbi";
import Column from "components/Column";
import Row from "components/Row";
import { stackOrderInsideOut } from "d3";
import { isMobile } from "react-device-detect";
import { useTrumpGoldBalance } from "./AddProposal";
import { walletconnect } from "connectors";
import squeezeLogo from '../../assets/images/squeeze.png'
import { useDarkModeManager } from "state/user/hooks";
import { kibaAbi } from "components/ShowSellTax";
import { useWeb3React } from "@web3-react/core";
import { SupportedChainId } from "constants/chains";
import useBUSDPrice, { useBinanceTokenBalance } from "utils/binance.utils";
import { binanceTokens } from "utils/binance.tokens";
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
  const kibaCoin = new Token(
    1,
    isBinance ? '0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341' : "0x4b2c54b80b77580dc02a0f6734d3bad733f50900",
    9,
    "Kiba",
    "Kiba Inu"
  );

  const kiba: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    kibaCoin
  );

  const bKiba =  useBinanceTokenBalance('0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341')
  
  return React.useMemo(() => {
    return isBinance && bKiba?.balance ? +bKiba.balance.toFixed(0) : kiba;
  }, [kiba, isBinance, bKiba.balance, account, chainId]);
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

export default function VotePage({
  match: {
    params: { governorIndex, id },
  },
}: RouteComponentProps<{ governorIndex: string; id: string }>) {
  const web3 = useActiveWeb3React();
  const { account, chainId } = web3;
  const isBinance = chainId === SupportedChainId.BINANCE;
  const kibaCoin = new Token(
    isBinance ? 56 : 1,
    isBinance ? '0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341' : "0x4b2c54b80b77580dc02a0f6734d3bad733f50900",
    9,
    "Kiba",
    "Kiba Inu"
  );

  const kiba: CurrencyAmount<Token>| any | undefined = useTokenBalance(
    account ?? undefined,
    kibaCoin
  );

  const kibaBalance = useKiba(account)
  const storedTrumpBalance = useMemo(() => {
    return localStorage.getItem("trumpBalance") || undefined;
  }, [localStorage.getItem("trumpBalance")]);

  const [isTrackingGains, setIsTrackingGains] = useState<boolean>(
    storedTrumpBalance !== undefined && +storedTrumpBalance > 0 && !!account
  );

  const date = new Date();

  const trackingSince = useMemo(() => {
    return moment(
      new Date(localStorage.getItem("trackingSince") as string)
    ).fromNow();
  }, [localStorage.getItem("trackingSince"), date]);

  const stopTrackingGains = () => {
    localStorage.setItem("trumpBalance", "0");
    localStorage.setItem("trackingSince", "");
    setTrumpGainsUSD("");
    setStimGainsUSD("");
    setIsTrackingGains(false);
  };

  const trackGains = () => {
    if (isTrackingGains) {
      localStorage.setItem("trumpBalance", "0");
      localStorage.setItem("trackingSince", "");
      setIsTrackingGains(false);
    } else if (!!kibaBalance) {
      localStorage.setItem("trumpBalance", (kibaBalance || 0)?.toFixed(2));
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

  const {routerADD, routerABI } = React.useMemo(() => {
    return isBinance ? {
      routerADD: pancakeAddress,
      routerABI: pancakeAbi
    } : { routerADD: routerAddress, routerABI: routerAbi }
  }, [isBinance])

  useEffect(() => {
    if (storedTrumpBalance && kibaBalance) {
      if (
        (+storedTrumpBalance - +kibaBalance.toFixed(2)).toFixed(2) ===
        kibaBalance.toFixed(2)
      ) {
      } else if (+storedTrumpBalance - +kibaBalance.toFixed(2) < 0) {
      }
    } 
  }, []);

  const rawTrumpCurrency = useMemo(() => {
    if (!storedTrumpBalance || !kibaBalance) return null;
    const calc = +Math.round(+kibaBalance?.toFixed(2) - +storedTrumpBalance);
    return calc;
  }, [storedTrumpBalance, kibaBalance, isTrackingGains]);

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
  }, [rawTrumpCurrency, isBinance, kibaBalance, storedTrumpBalance]);

  const [trumpBalanceUSD, setTrumpBalanceUSD] = React.useState("");
  React.useEffect(() => {
    try {
      if (kibaBalance && +kibaBalance < 0) {
        setTrumpBalanceUSD("-");
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
          setTrumpBalanceUSD(number.toLocaleString());
        });
      }
    } catch (ex) {
      console.error(ex);
    }
  }, [kibaBalance,  isBinance]);
const [darkMode] = useDarkModeManager()
 
  const goldBalance = useTrumpGoldBalance(account)
  
  const GainsText = styled(TYPE.white)`
  font-size:22px;
  font-family:'Bangers', cursive;`
  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <ProposalInfo>
    

            <div style={{display:'block', width:'100%',marginBottom:'2rem'}}><GainsText style={{fontSize:32}}>KibaGains</GainsText></div>
              {isTrackingGains && (
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
                          ? <div style={{display:'flex'}}><GainsText style={{marginRight:10}}>Kiba Balance</GainsText> <span style={{fontSize:18}}> {Number(kibaBalance?.toFixed(2)).toLocaleString()} (${(trumpBalanceUSD)} USD) </span></div>
                          : null}
                      </Trans>
                    </TYPE.white>
                      </div>
                      <div style={{display:'block', width:'100%', marginTop:15}}>

                      {isTrackingGains === true && (
                      <GainsText  className="d-flex">
                        {storedTrumpBalance !== undefined &&
                          kibaBalance !== undefined &&
                          kibaBalance?.toFixed(0) &&
                          account !== undefined && (
                            <React.Fragment>
                              <Trans>{`Kiba Gains`} </Trans> &nbsp;
                              <span>{Number((
                                +kibaBalance?.toFixed(2) - +storedTrumpBalance
                              ).toFixed(2)).toLocaleString()} </span>
                              {isTrackingGains && trumpGainsUSD && (
                                <Badge style={{ color:"#FFF",paddingTop: 5 }}>
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
