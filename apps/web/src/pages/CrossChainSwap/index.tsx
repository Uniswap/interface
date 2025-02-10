import { InterfacePageName } from "@uniswap/analytics-events";
import { SwitchLocaleLink } from "components/SwitchLocaleLink";
import { PageWrapper, SwapWrapper } from "components/swap/styled";
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { InterfaceTrade, TradeState } from "state/routing/types";
import { isPreviewTrade } from "state/routing/utils";
import Trace from "uniswap/src/features/telemetry/Trace";
import { SimulateSwapForm } from "./SimulateSwapForm";
import { CrossChainCurrency } from "types/tokens";
import { AwaitingDepositPage } from "./AwaitingDepositPage";
import { ButtonLight } from "components/Button";
import { Box, H1, H2, H3 } from "pages/Landing/components/Generics";
import styled from "styled-components";

const StyledH2 = styled(H2)`
  @media (max-width: 768px) {
    font-size: 40px;
  }
  @media (max-width: 464px) {
    font-size: 32px;
  }
  @media (max-height: 668px) {
    font-size: 25px;
  }
`;
const StyledH3 = styled(H3)`
  @media (max-width: 768px) {
    font-size: 23px;
  }
  @media (max-width: 464px) {
    font-size: 17px;
  }
  @media (max-height: 668px) {
    font-size: 13px;
  }
`;

const TARA_CURRENCY: CrossChainCurrency = {
  _id: "671e2dbcc5fd0975be523ceb",
  name: "Taraxa",
  symbol: "tara",
  img: "https://teleswap-currency.s3.amazonaws.com/tara.svg",
  network: "tara",
  address: null,
  isFiat: false,
  createdAt: "2024-10-27T12:10:36.769Z",
};

const ETH_CURRENCY: CrossChainCurrency = {
  _id: "672b49331a5a0ec42510f960",
  name: "Ethereum",
  symbol: "eth",
  img: "https://teleswap-currency.s3.amazonaws.com/eth.svg",
  network: "eth",
  address: null,
  isFiat: false,
  createdAt: "2024-11-06T10:47:15.686Z",
};

export function getIsReviewableQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  if (swapInputError) {
    return false;
  }
  // if the current quote is a preview quote, allow the user to progress to the Swap review screen
  if (isPreviewTrade(trade)) {
    return true;
  }

  return Boolean(trade && tradeState === TradeState.VALID);
}

export default function CrossChainSwapPage() {
  const location = useLocation();

  const [step, setStep] = useState<number>(1);

  const [amountFrom, setAmountFrom] = useState<string>("");
  const [amountTo, setAmountTo] = useState<string>("");

  const [currencyFrom, setCurrencyFrom] = useState<CrossChainCurrency | null>(
    ETH_CURRENCY
  );
  const [currencyTo, setCurrencyTo] = useState<CrossChainCurrency | null>(
    TARA_CURRENCY
  );

  const [recipient, setRecipient] = useState<string>("");

  const [crossChainSwapData, setCrossChainSwapData] = useState(null);

  return (
    <Trace logImpression page={"cross-chain-swap-page"}>
      <Box
        maxWidth="920px"
        direction="row"
        align="center"
        style={{
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: "9px",
          marginTop: "50px",
        }}
      >
        <StyledH2>Crypto Exchange</StyledH2>
        {step === 1 && <StyledH3>quick & easy, just swap</StyledH3>}
      </Box>
      <PageWrapper>
        {(step === 1 || step === 2) && (
          <SimulateSwapForm
            amountFrom={amountFrom}
            setAmountFrom={setAmountFrom}
            amountTo={amountTo}
            setAmountTo={setAmountTo}
            currencyFrom={currencyFrom}
            setCurrencyFrom={setCurrencyFrom}
            currencyTo={currencyTo}
            setCurrencyTo={setCurrencyTo}
            recipient={recipient}
            setRecipient={setRecipient}
            step={step}
            setStep={setStep}
            setCrossChainSwapData={setCrossChainSwapData}
          />
        )}
        {step === 3 && (
          <AwaitingDepositPage
            crossChainSwapData={crossChainSwapData}
            currencyFrom={currencyFrom}
            currencyTo={currencyTo}
          />
        )}
        {step !== 1 && (
          <ButtonLight
            onClick={() => setStep((prev) => prev - 1)}
            disabled={step === 1}
            fontWeight={535}
            $borderRadius="16px"
            marginTop="10px"
          >
            Back
          </ButtonLight>
        )}
      </PageWrapper>
      {location.pathname === "/cross-chain-swap" && <SwitchLocaleLink />}
    </Trace>
  );
}
