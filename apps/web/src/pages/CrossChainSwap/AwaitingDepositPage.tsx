import { CrossChainCurrencyLogo } from "components/SearchModal/CurrencyList";
import { useAwaitingDeposit } from "hooks/useAwaitingDeposit";
import useCopyClipboard from "hooks/useCopyClipboard";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { CrossChainCurrency } from "types/tokens";
import { Copy, Clipboard, CheckSquare, Check } from "react-feather";

const CopyIcon = styled(Copy)`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
`;

const CheckIcon = styled(Check)`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
`;

const Container = styled.div`
  font-family: Arial, sans-serif;
  background-color: ${({ theme }) => theme.surface1};
  padding: 22px;
  border-radius: 12px;
  margin: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(155, 155, 155, 0.3);
`;

const ExchangeID = styled.div`
  display: flex;
  text-align: left;
  margin-bottom: 30px;
  color: ${({ theme }) => theme.text};
  align-items: center;
`;

const ExchangeIDCopy = styled.div`
  display: flex;
  flex: 1;
  margin-left: 8px;
  text-align: center;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.surface3};
  padding: 5px 10px;
  border-radius: 6px;
  display: inline-block;
  cursor: pointer;
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.text};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const DepositHeader = styled.div`
  margin: 0;
  margin-bottom: 10px;
  font-size: 23px;
`;

const DepositAmount = styled.div`
  font-size: 28px;
  margin: 10px 0 15px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const DepositAddress = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.text};
  padding: 10px;
  border-radius: 8px;
  font-size: 16px;
  word-break: break-word;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  gap: 10px;
`;

const Icon = styled.div`
  background-color: #fff;
  border: 2px solid #d3d3d3;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  color: #4f4f4f;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SwapDetails = styled.div`
  background-color: ${({ theme }) => theme.surface3};
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: ${({ theme }) => theme.text};
`;

const DetailTitle = styled.div`
  margin: 18px 0;
  font-size: 23px;

  & span {
  }
`;

const DetailRow = styled.div`
  margin-bottom: 10px;
  font-size: 14px;

  & span {
  }
`;

const SwapAmount = styled.div`
  font-size: 22px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SwapAddress = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.text};
  padding: 10px;
  border-radius: 8px;
  font-size: 16px;
  word-break: break-word;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

type AwaitingDepositPageProps = {
  crossChainSwapData: any;
  currencyFrom: CrossChainCurrency | null;
  currencyTo: CrossChainCurrency | null;
};

export const AwaitingDepositPage = ({
  crossChainSwapData,
  currencyFrom,
  currencyTo,
}: AwaitingDepositPageProps) => {
  const [copiedAddress, setCopiedAddress] = useState<
    "FROM" | "TO" | "EXCHANGEID" | null
  >(null);
  const [swapDetails, setSwapDetails] = useState(crossChainSwapData);
  const { getSwapStatus } = useAwaitingDeposit();
  const [isCopied, staticCopy] = useCopyClipboard();

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (crossChainSwapData) {
      const fetchSwapStatus = async () => {
        try {
          const data = await getSwapStatus(crossChainSwapData.id);
          setSwapDetails(data);
        } catch (error) {
          console.error("Error fetching swap status:", error);
        }
      };

      fetchSwapStatus();
      intervalId = setInterval(fetchSwapStatus, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [crossChainSwapData, getSwapStatus]);

  const shortenAddress = (address: string) => {
    const startChars = 17,
      endChars = 17;
    if (!address || address.length < startChars + endChars) {
      return address; // Return full address if it's too short to shorten.
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  if (!swapDetails) return null;
  return (
    <Container>
      <ExchangeID>
        Exchange ID:
        <ExchangeIDCopy
          onClick={async () => {
            staticCopy(swapDetails.id);
          }}
        >
          {swapDetails.id}
        </ExchangeIDCopy>
      </ExchangeID>

      <Card>
        <DepositHeader>
          {swapDetails.status === "waiting"
            ? "Awaiting your deposit"
            : swapDetails.status?.toUpperCase()}
        </DepositHeader>
        <DepositAmount>
          {currencyFrom && (
            <CrossChainCurrencyLogo
              src={currencyFrom.img}
              alt={currencyFrom.name}
            />
          )}
          <span>{swapDetails.amountFrom} </span>
          <span>{swapDetails.currencyFrom.toUpperCase()}</span>
        </DepositAmount>
        <DepositAddress
          onClick={async () => {
            if (swapDetails?.addressFrom) {
              staticCopy(swapDetails.addressFrom);
              setCopiedAddress("FROM");
              setTimeout(() => setCopiedAddress(null), 500);
            }
          }}
        >
          {shortenAddress(swapDetails.addressFrom)}
          {copiedAddress === "FROM" ? <CheckIcon /> : <CopyIcon />}
        </DepositAddress>
      </Card>

      <SwapDetails>
        <DetailTitle>Swap Details</DetailTitle>
        <DetailRow>
          <span>You Get:</span>
        </DetailRow>
        <SwapAmount>
          {currencyTo && (
            <CrossChainCurrencyLogo
              src={currencyTo.img}
              alt={currencyTo.name}
            />
          )}
          ≈ {swapDetails.amountTo}
          <span>{swapDetails.currencyTo.toUpperCase()}</span>
        </SwapAmount>
        <DetailRow>
          <span>Recipient address:</span>
        </DetailRow>
        <SwapAddress
          onClick={async () => {
            if (swapDetails?.addressTo) {
              staticCopy(swapDetails.addressTo);
              setCopiedAddress("TO");
              setTimeout(() => setCopiedAddress(null), 500);
            }
          }}
        >
          {shortenAddress(swapDetails.addressTo)}
          {copiedAddress === "TO" ? <CheckIcon /> : <CopyIcon />}
        </SwapAddress>
      </SwapDetails>
    </Container>
  );
};
