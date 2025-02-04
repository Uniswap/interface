import { useCallback, useEffect, ChangeEvent } from "react";
import {
  InterfaceElementName,
  InterfaceSectionName,
  SwapEventName,
} from "@uniswap/analytics-events";
import { AutoColumn } from "components/Column";
import Row from "components/Row";

import {
  ArrowContainer,
  ArrowWrapper,
  OutputSwapSection,
  SwapSection,
} from "components/swap/styled";
import { Trans } from "i18n";
import { useTheme } from "styled-components";
import Trace from "uniswap/src/features/telemetry/Trace";
import {
  CrossChainSwapCurrencyInputPanel,
  InputPanel,
} from "components/CurrencyInputPanel/SwapCurrencyInputPanel";
import { CrossChainCurrency } from "types/tokens";
import { ArrowDown } from "react-feather";
import { Box, H1, H2, H3 } from "pages/Landing/components/Generics";
import { useSimulateSwap } from "hooks/useSimulateSwap";
import useDebounce from "hooks/useDebounce";
import { ButtonLight } from "components/Button";
import { Text } from "ui/src";
import { useExecuteCrossChainSwap } from "hooks/useExecuteCrossChainSwap";
import styled, { keyframes } from "styled-components";
import { Check } from "react-feather";

const CheckIcon = styled(Check)`
  color: ${({ theme }) => theme.white};
  border-radius: 50%;
  background-color: #2eb872;
`;

// Define keyframes for the spinner animation
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled text below the spinner
const LoadingText = styled.div`
  margin: 15px;
  font-size: 15px;
  color: #333;
`;

// Styled component for the overlay
const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
  z-index: 9999; /* Ensures it's on top of other content */
`;

// Styled component for the spinner
const Spinner = styled.div`
  width: 55px;
  height: 55px;
  border: 8px solid rgba(255, 255, 255, 0.2); /* Light border */
  border-top: 8px solid white; /* Highlighted top border */
  border-radius: 50%;
  animation: ${spin} 1s linear infinite; /* Apply the spinning animation */
`;

const StyledRecipientInput = styled.input`
  background: none;
  width: 100%;
  color: ${({ theme }) => theme.neutral1};
  outline: none;
  border: none;
  font-size: 17px;
  font-weight: 500;
  line-height: 24px;
  padding: 10px 3px;

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
`;

const StyledRecipientInputRow = styled(Row)`
  color: ${({ theme }) => theme.neutral2};
`;

const StepContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 10px;
`;

const Step = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
  gap: 5px;
`;

const Circle = styled.div<{ completed?: boolean }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1rem;
  color: ${({ completed }) => (completed ? "#fff" : "#fff")};
  background-color: ${({ completed }) => (completed ? "#2eb872" : "#39424e")};
`;

const StepLabel = styled.div`
  font-size: 1rem;
  color: #39424e;
`;

export type SimulateSwapFormType = {
  amountFrom: string;
  setAmountFrom: (amountFrom: string) => void;
  amountTo: string;
  setAmountTo: (amountTo: string) => void;
  currencyFrom: CrossChainCurrency | null;
  setCurrencyFrom: (currencyFrom: CrossChainCurrency | null) => void;
  currencyTo: CrossChainCurrency | null;
  setCurrencyTo: (currencyTo: CrossChainCurrency | null) => void;
  step: number;
  setStep: (step: number) => void;
  recipient: string;
  setRecipient: (recipient: string) => void;
  setCrossChainSwapData: (crossChainSwapData: any) => void;
};

export function SimulateSwapForm({
  amountFrom,
  setAmountFrom,
  amountTo,
  setAmountTo,
  currencyFrom,
  setCurrencyFrom,
  currencyTo,
  setCurrencyTo,
  step,
  setStep,
  recipient,
  setRecipient,
  setCrossChainSwapData,
}: SimulateSwapFormType) {
  const theme = useTheme();

  const debouncedAmountFrom = useDebounce(amountFrom, 500);

  const {
    simulateSwap,
    isLoading: isSimulateSwapLoading,
    error: simulateSwapError,
  } = useSimulateSwap();

  const {
    executeCrossChainSwap,
    isLoading: isExecuteCrossChainSwapLoading,
    error: executeCrossChainSwapError,
  } = useExecuteCrossChainSwap();

  useEffect(() => {
    const simulate = async () => {
      if (currencyFrom && currencyTo && debouncedAmountFrom) {
        const data = await simulateSwap({
          currencyFrom: currencyFrom.symbol,
          currencyTo: currencyTo.symbol,
          amountFrom: debouncedAmountFrom,
        });
        if (data) setAmountTo(data);
      }
    };
    simulate();
  }, [debouncedAmountFrom, currencyFrom, currencyTo]);

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const inputWithoutSpaces = input.replace(/\s+/g, "");
    setRecipient(inputWithoutSpaces);
  }, []);

  const isExchangeButtonDisalbed = (): boolean => {
    if (step === 1)
      return Boolean(
        isSimulateSwapLoading || simulateSwapError || !amountTo || !amountFrom
      );
    if (step === 2)
      return Boolean(
        isExecuteCrossChainSwapLoading ||
          executeCrossChainSwapError ||
          !recipient
      );
    return false;
  };

  return (
    <>
      {isExecuteCrossChainSwapLoading && (
        <FullScreenOverlay>
          <Spinner />
        </FullScreenOverlay>
      )}
      <div style={{ display: "relative", marginBottom: "5px" }}>
        {step === 2 && (
          <StepContainer>
            <Step>
              <CheckIcon />
              <StepLabel>Choose currencies</StepLabel>
            </Step>
            <Step>
              <Circle>2</Circle>
              <StepLabel>Enter the address</StepLabel>
            </Step>
          </StepContainer>
        )}
        <SwapSection>
          <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
            <CrossChainSwapCurrencyInputPanel
              label={<Trans i18nKey="common.sell.label" />}
              id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
              hideInput={false}
              value={amountFrom}
              onCurrencySelect={(currency: CrossChainCurrency) => {
                setCurrencyFrom(currency);
              }}
              currency={currencyFrom}
              otherCurrency={currencyTo}
              onUserInput={(value: string) => {
                setAmountFrom(value);
              }}
              disabled={step !== 1}
            />
          </Trace>
        </SwapSection>
        {step === 1 && (
          <ArrowWrapper clickable={true}>
            <Trace
              logPress
              eventOnTrigger={SwapEventName.SWAP_TOKENS_REVERSED}
              element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
            >
              <ArrowContainer
                data-testid="swap-currency-button"
                onClick={() => {
                  setCurrencyFrom(currencyTo);
                  setCurrencyTo(currencyFrom);
                }}
                color={theme.neutral1}
              >
                <ArrowDown size="16" color={theme.neutral1} />
              </ArrowContainer>
            </Trace>
          </ArrowWrapper>
        )}
      </div>
      <AutoColumn gap="xs">
        <div>
          <OutputSwapSection>
            <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
              <CrossChainSwapCurrencyInputPanel
                label={<Trans i18nKey="common.buy.label" />}
                id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
                hideInput={false}
                value={amountTo}
                onCurrencySelect={(currency: CrossChainCurrency) => {
                  setCurrencyTo(currency);
                }}
                onUserInput={(value: string) => setAmountTo(value)}
                currency={currencyTo}
                otherCurrency={currencyFrom}
                disabledInput
                disabled={step !== 1}
                isInputLoading={isSimulateSwapLoading}
              />
            </Trace>
          </OutputSwapSection>
        </div>
        {step === 2 && (
          <InputPanel
            id="cross-chain-currency"
            hideInput={false}
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              padding: "15px",
              border: "1px solid #9b9b9b5c",
            }}
          >
            <Text variant="body3" userSelect="none" color="$neutral2">
              Recipient's address
            </Text>
            <StyledRecipientInputRow justify="space-between">
              <StyledRecipientInput
                ref={null}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="Enter the recipient's address"
                pattern="^(0x[a-fA-F0-9]{40})$"
                onChange={handleInput}
                // onFocus={() => handleFocus(true)}
                value={recipient}
                onKeyDown={() => {}}
                // autoFocus={isForcingFocus}
              />
            </StyledRecipientInputRow>
          </InputPanel>
        )}
        <div style={{ marginTop: "5px" }}>
          <ButtonLight
            onClick={async () => {
              if (step === 1) setStep(2);
              if (step === 2) {
                if (
                  !currencyFrom ||
                  !currencyTo ||
                  !amountFrom ||
                  !amountTo ||
                  !recipient
                )
                  return;
                const data = await executeCrossChainSwap({
                  currencyFrom: currencyFrom.symbol,
                  currencyTo: currencyTo.symbol,
                  amountFrom,
                  amountTo,
                  recipient,
                });
                if (data) {
                  setCrossChainSwapData(data);
                  setStep(step + 1);
                }
              }
            }}
            fontWeight={535}
            $borderRadius="16px"
            disabled={isExchangeButtonDisalbed()}
          >
            {(step === 1 && simulateSwapError) ||
              (step === 2 && executeCrossChainSwapError) || (
                <Trans
                  i18nKey={
                    step === 1
                      ? "common.exchange.button"
                      : "common.exchangeNow.button"
                  }
                />
              )}
          </ButtonLight>
          {isSimulateSwapLoading && step === 1 && (
            <LoadingText>Fetching ...</LoadingText>
          )}
        </div>
      </AutoColumn>
    </>
  );
}
