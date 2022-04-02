import {
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
import { RouteComponentProps } from "react-router-dom";
import styled from "styled-components/macro";
import { ButtonPrimary } from "../../components/Button";
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
import { routerAbi, routerAddress } from "./routerAbi";
import Column from "components/Column";
import Row from "components/Row";
import { stackOrderInsideOut } from "d3";
import { isMobile } from "react-device-detect";

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

export default function VotePage({
  match: {
    params: { governorIndex, id },
  },
}: RouteComponentProps<{ governorIndex: string; id: string }>) {
  const web3 = useActiveWeb3React();
  const { account } = web3;
  // get data for this specific proposal

  // update support based on button interactions
  const [support, setSupport] = useState<boolean>(true);
  // modal for casting votes
  const showVoteModal = useModalOpen(ApplicationModal.VOTE);
  const toggleVoteModal = useToggleVoteModal();
  // toggle for showing delegation modal
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE);
  const toggleDelegateModal = useToggleDelegateModal();
  // only count available votes as of the proposal start block

  const trumpCoin = new Token(
    1,
    "0x99d36e97676A68313ffDc627fd6b56382a2a08B6",
    9,
    "BabyTrump",
    "BabyTrump Token"
  );
  const stimulusCoin = new Token(
    1,
    "0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013",
    9,
    "StimulusCheck",
    "StimulusCheck Token"
  );
  const defaultTokens = useAllTokens();

  const trumpBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    trumpCoin
  );
  const stimulusBalance = useTokenBalance(account ?? undefined, stimulusCoin);
  const storedSimulusBalance = useMemo(() => {
    return localStorage.getItem("stimulusBalance") || undefined;
  }, [localStorage.getItem("stimulusBalance")]);

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
    localStorage.setItem("stimulusBalance", "0");
    localStorage.setItem("trackingSince", "");
    setTrumpGainsUSD('')
    setStimGainsUSD('')
    setIsTrackingGains(false);
  };

  const trackGains = () => {
    if (isTrackingGains) {
      localStorage.setItem("trumpBalance", "0");
      localStorage.setItem("stimulusBalance", "0");
      localStorage.setItem("trackingSince", "");
      setIsTrackingGains(false);
    } else if (!!trumpBalance || !!stimulusBalance) {
      localStorage.setItem("trumpBalance", (trumpBalance || 0)?.toFixed(2));
      localStorage.setItem(
        "stimulusBalance",
        (stimulusBalance || 0)?.toFixed(2)
      );
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
  const [showTool, setShowTool] = useState<boolean>(false);
  const tiptext = `Holding Stimulus Token and Baby Trump at the same time allow for 16% redistribution`;

  const trackingLabel = useMemo(() => {
    return isTrackingGains ? "Stop Tracking Gains" : "Start Tracking Gains";
  }, [isTrackingGains]);

  useEffect(() => {
    if (storedTrumpBalance && trumpBalance) {
      if (
        (+storedTrumpBalance - +trumpBalance.toFixed(2)).toFixed(2) ===
        trumpBalance.toFixed(2)
      ) {
        stopTrackingGains();
      } else if (+storedTrumpBalance - +trumpBalance.toFixed(2) < 0)
        stopTrackingGains();
    } else if (storedSimulusBalance && stimulusBalance) {
      if (
        (+storedSimulusBalance - +stimulusBalance.toFixed(2)).toFixed(2) ===
        stimulusBalance.toFixed(2)
      ) {
        stopTrackingGains();
      } else if (+storedSimulusBalance - +stimulusBalance.toFixed(2) < 0)
      stopTrackingGains();
    }
  }, []);

  const rawTrumpCurrency = useMemo(() => {
    if (!storedTrumpBalance || !trumpBalance) return null;
    const calc = +Math.round(+trumpBalance?.toFixed(2) - +storedTrumpBalance);
    return calc;
  }, [storedTrumpBalance, trumpBalance, isTrackingGains]);

  const rawStimulusCurrency = useMemo(() => {
    if (!storedSimulusBalance || !stimulusBalance) return null;
    const calc = (+stimulusBalance.toFixed(2) - +storedSimulusBalance).toFixed(
      0
    );
    return calc;
  }, [stimulusBalance, storedSimulusBalance, isTrackingGains]);

  const formattedStim = React.useCallback(() => {
    if (!stimulusBalance) return "-";
    return stimulusBalance.toFixed(2);
  }, [stimulusBalance]);

  const [trumpGainsUSD, setTrumpGainsUSD] = React.useState("-");
  const [stimGainsUSD, setStimGainsUSD] = React.useState("-");

  useEffect(() => {
    if (rawTrumpCurrency && +rawTrumpCurrency.toFixed(0) <= 0) {
      setTrumpGainsUSD("-");
      return;
    }
    if (rawTrumpCurrency && +rawTrumpCurrency.toFixed(0) > 0) {
      const w3 = new Web3(window.ethereum as any).eth;
      const routerContr = new w3.Contract(routerAbi as any, routerAddress);
      const ten9 = 10 ** 9;
      const amount = +rawTrumpCurrency.toFixed(0) * ten9;
      const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
        trumpCoin.address,
        WETH9[1].address,
        USDC.address,
      ]);
      amountsOut.call().then((response: any) => {
        const usdc = response[response.length - 1];
        const ten6 = 10 ** 6;
        const usdcValue = usdc / ten6;
        setTrumpGainsUSD(usdcValue.toFixed(2));
      });
    }
  }, [rawTrumpCurrency, trumpBalance, storedTrumpBalance]);

  useEffect(() => {
    if (rawStimulusCurrency && +rawStimulusCurrency <= 0) {
      setStimGainsUSD("-");
      return;
    }
    if (rawStimulusCurrency && +rawStimulusCurrency > 0) {
      const w3 = new Web3(window.ethereum as any).eth;
      const routerContr = new w3.Contract(routerAbi as any, routerAddress);
      const ten9 = 10 ** 9;
      const amount = +rawStimulusCurrency * ten9;
      const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
        stimulusCoin.address,
        WETH9[1].address,
        USDC.address,
      ]);
      amountsOut.call().then((response: any) => {
        console.log(response);
        const usdc = response[response.length - 1];
        const ten6 = 10 ** 6;
        const usdcValue = usdc / ten6;
        setStimGainsUSD(usdcValue.toFixed(2));
      });
    }
  }, [rawStimulusCurrency, stimulusBalance, storedSimulusBalance]);

  const [showTGoldTool, setShowTGoldTool] = useState(false)
  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <ProposalInfo gap="lg" justify="space-between">
          <Card>
            <CardSection>
              <TYPE.black>
              <small> 
              <Info /> 
              <Trans> 
                    {`NOTE: Trump GAINS v1 is meant for holders whom are not transferring / selling tokens, but wanting to track the amount of gains they have obtained from holding.
                     In the future, we plan to build the ability to filter out transactions that are sells / transfers.`}
                </Trans>
                &nbsp;

                </small>
              </TYPE.black>
              <br />
              {isTrackingGains && (
                <BlueCard>
                  <TYPE.main>
                    <small>
                      <Clock />
                      &nbsp; <Trans>Started tracking gains {trackingSince} </Trans>
                    </small>
                  </TYPE.main>
                </BlueCard>
              )}
            </CardSection>
            <AutoColumn gap="50px">
              <GreyCard justifyContent="center">
                <div style={{ display: "flex", flexFlow: "row wrap" }}>
                  {!account && (
                    <TYPE.black>
                      <Trans>
                        Please connect wallet to start tracking gains.
                      </Trans>
                    </TYPE.black>
                  )}
                  <img
                    src={
                      "https://babytrumptoken.com/images/Trump_Open_Eyes.png"
                    }
                    width="100px"
                  />
                  <div style={{ marginTop: 40, alignItems: "baseline" }}>
                    <TYPE.black className="d-flex">
                      <Trans>
                        {trumpBalance !== undefined
                          ? `Trump Balance ${trumpBalance?.toFixed(2)}`
                          : null}
                      </Trans>
                    </TYPE.black>
                    {isTrackingGains === true && (
                      <TYPE.main className="d-flex">
                        {storedTrumpBalance !== undefined &&
                          trumpBalance !== undefined &&
                          account !== undefined && (
                            <React.Fragment>
                               <ArrowUp /> 
                           
                               &nbsp;
                                <Trans>{`TRUMPGAINS`} </Trans> &nbsp;
                                {(
                                  +trumpBalance?.toFixed(2) -
                                  +storedTrumpBalance
                                ).toFixed(2)}
                              <br />
                              {isTrackingGains && trumpGainsUSD && (
                                <Badge style={{ paddingTop: 5 }}>
                                  <small>
                                       <Trans>Total GAINS</Trans>
                                  </small>&nbsp;
                                  {rawTrumpCurrency && +rawTrumpCurrency?.toFixed(0) > 0 ? trumpGainsUSD : '-'}
                                  <small>&nbsp;<Trans>USD</Trans></small>
                                </Badge>
                              )}
                            </React.Fragment>
                          )}
                      </TYPE.main>
                    )}
                  </div>
                </div>
              </GreyCard>
            </AutoColumn>
            <br />
            <AutoColumn gap="2em">
              <GreyCard>
                <div style={{ display: "flex", flexFlow: "row wrap" }}>
                  {!account && (
                    <Trans>{`Connect your wallet to start tracking gains`}</Trans>
                  )}
                  {!account && <h1>YOUR GAINS</h1>}
                  <div>
                    <img
                      src={
                        "https://babytrumptoken.com/images/Untitled_Artwork-9.png"
                      }
                      width="100px"
                    />
                  </div>
                  <CardSection style={{ marginTop: 40, alignItems: "center" }}>
                    <TYPE.black>
                      <Trans>
                        {" "}
                        {formattedStim() !== undefined &&
                          `Stimulus Check Balance ${formattedStim()}`}{" "}
                      </Trans>
                    </TYPE.black>
                    {isTrackingGains === true && (
                      <TYPE.main>
                        {storedSimulusBalance !== undefined &&
                          stimulusBalance !== undefined &&
                          account !== undefined && (
                            <React.Fragment>
                              <ArrowUp /> &nbsp;
                              <Trans>
                                {`STIMULUSGAINS`}
                              </Trans>
                                 &nbsp;
                                {`${(
                                  +stimulusBalance.toFixed(2) -
                                  +storedSimulusBalance
                                ).toFixed(2)}`}
                              <span style={{ marginLeft: 50 }}>
                                <Tooltip text={tiptext} show={showTool}>
                                  <Info
                                    onMouseEnter={() => setShowTool(true)}
                                    onMouseLeave={() => setShowTool(false)}
                                  />
                                </Tooltip>
                              </span>
                            </React.Fragment>
                          )}
                      </TYPE.main>
                    )}
                    {isTrackingGains && stimulusBalance !== undefined &&
                      trumpBalance !== undefined &&
                      +stimulusBalance.toFixed(2) > 0 &&
                      +trumpBalance.toFixed(2) > 0 && (
                        <Row style={{display:'flex', flexFlow: isMobile ? 'column wrap' : 'row wrap'}}>
                          <Column>
                            <Badge>
                              {stimGainsUSD && rawStimulusCurrency && (
                                <TYPE.black>
                                  <small>Total GAINS</small>&nbsp;
                                  {+rawStimulusCurrency > 0 ? stimGainsUSD : '-'}
                                  <small>&nbsp;USD</small>
                                </TYPE.black>
                              )}
                            </Badge>
                          </Column>
                          <AutoColumn style={{ display: isMobile ? 'block' : 'flex', paddingLeft: isMobile ? 0 : 10.2 }}>
                            <Badge>
                              {" "}
                              <TYPE.blue><Trans>2X REDISTRIBUTION</Trans></TYPE.blue>
                            </Badge>
                          </AutoColumn>
                        </Row>
                      )}
                  </CardSection>
                </div>
              </GreyCard>
            </AutoColumn>
            <br />

            <AutoColumn style={{marginBottom:15}} gap="2em">
              <GreyCard>
                
                <div style={{ display: "flex", flexFlow: "row wrap" }}>
                  {!account && (
                    <Trans>{`Connect your wallet to start tracking gains`}</Trans>
                  )}
                  {!account && <h1>YOUR GAINS</h1>}
                  <div>
                  <h1 style={{textAlign:'center', width:'100%'}}>COMING SOON</h1>

                    <img
                      src={
                        "https://babytrumptoken.com/images/Trump_Gold_Coin_Gecko.png"
                      }
                      width="100px"
                    />
                  </div>
                  <CardSection style={{ marginTop: 40, alignItems: "center" }}>
                    <TYPE.black>
                      <Trans>
                        {" "}
                        {formattedStim() !== undefined &&
                          `Trump Gold Balance -`}{" "}
                      </Trans>
                    </TYPE.black>
                    {isTrackingGains === true && (
                      <TYPE.main>
                        {storedSimulusBalance !== undefined &&
                          stimulusBalance !== undefined &&
                          account !== undefined && (
                            <React.Fragment>
                              <ArrowUp /> &nbsp;
                              <Trans>
                                {`TGOLDGAINS`} &nbsp;
                                {`-`}
                              </Trans>
                              <span style={{ marginLeft: 50 }}>
                                <Tooltip text={"Trump Gold is a governance token that allows holders to create propositions community members can vote on"} show={showTGoldTool}>
                                  <Info
                                    onMouseEnter={() => setShowTGoldTool(true)}
                                    onMouseLeave={() => setShowTGoldTool(false)}
                                  />
                                </Tooltip>
                              </span>
                            </React.Fragment>
                          )}
                      </TYPE.main>
                    )}
                    {isTrackingGains && stimulusBalance !== undefined &&
                      trumpBalance !== undefined &&
                      +stimulusBalance.toFixed(2) > 0 &&
                      +trumpBalance.toFixed(2) > 0 && (
                        <Row>
                          <Column>
                            <Badge>
                                <TYPE.black>
                                  <small><Trans>Total GAINS</Trans></small>&nbsp;
                                  -
                                  <small>&nbsp;<Trans>USD</Trans></small>
                                </TYPE.black>
                            </Badge>
                          </Column>
                        </Row>
                      )}
                  </CardSection>
                </div>
              </GreyCard>
            </AutoColumn>
            <AutoColumn gap="50px">
              <ButtonPrimary onClick={trackGains}>
                <Trans>{trackingLabel}</Trans>
              </ButtonPrimary>
            </AutoColumn>
            <CardSection>
              <TYPE.blue>
                <div className="d-flex align-items-center">
                  <AlertCircle /> WANTING MORE GAINS? <br />
                </div>
                <small>
                  <Trans>Holding stimulus check while holding baby trump provides a
                  total of</Trans> &nbsp;
                  <Badge>16%</Badge> <Trans>redistribution</Trans>
                </small>
              </TYPE.blue>
            </CardSection>
          </Card>
        </ProposalInfo>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  );
}
