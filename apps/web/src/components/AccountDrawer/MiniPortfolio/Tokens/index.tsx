import { InterfaceElementName } from "@uniswap/analytics-events";
import { hideSpamAtom } from "components/AccountDrawer/SpamToggle";
import Row from "components/Row";
import { DeltaArrow } from "components/Tokens/TokenDetails/Delta";
import { useTokenBalancesQuery } from "graphql/data/apollo/TokenBalancesProvider";
import { PortfolioToken } from "graphql/data/portfolios";
import { getTokenDetailsURL, gqlToCurrency } from "graphql/data/util";
import { useAtomValue } from "jotai/utils";
import { EmptyWalletModule } from "nft/components/profile/view/EmptyWalletContent";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { EllipsisStyle, ThemedText } from "theme/components";
import {
  Chain,
  PortfolioTokenBalancePartsFragment,
} from "uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks";
import Trace from "uniswap/src/features/telemetry/Trace";
import { logger } from "utilities/src/logger/logger";
import { NumberType, useFormatter } from "utils/formatNumbers";
import { hideSmallBalancesAtom } from "../../SmallBalanceToggle";
import { ExpandoRow } from "../ExpandoRow";
import { PortfolioLogo } from "../PortfolioLogo";
import PortfolioRow, {
  PortfolioSkeleton,
  PortfolioTabWrapper,
} from "../PortfolioRow";
import { useAccountDrawer } from "../hooks";
import useGetPortfolio, {
  addNativeTokenToArrayStart,
  splitHiddenTokens,
  TokenData,
  tokenToCurrency,
} from "./useGetPortfolio";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

export default function Tokens() {
  const account = useAccount();
  const accountDrawer = useAccountDrawer();
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom);
  const [showHiddenTokens, setShowHiddenTokens] = useState(false);
  const { tokens, error } = useGetPortfolio(undefined, account.address);

  const { visibleTokens, hiddenTokens } = useMemo(() => {
    return splitHiddenTokens(tokens, hideSmallBalances);
  }, [hideSmallBalances, tokens]);

  if (!tokens || error) {
    return <PortfolioSkeleton />;
  }

  if (tokens?.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return (
      <EmptyWalletModule type="token" onNavigateClick={accountDrawer.close} />
    );
  }

  const toggleHiddenTokens = () =>
    setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens);

  return (
    <PortfolioTabWrapper>
      {visibleTokens.map(
        (tokenBalance) =>
          tokenBalance.token && (
            <TokenRow
              key={tokenBalance.token.address}
              {...tokenBalance}
              token={tokenBalance}
              inputAddress={account.address || ""}
            />
          )
      )}
      <ExpandoRow
        isExpanded={showHiddenTokens}
        toggle={toggleHiddenTokens}
        numItems={hiddenTokens.length}
      >
        {hiddenTokens.map(
          (tokenBalance) =>
            tokenBalance.token && (
              <TokenRow
                key={tokenBalance.token.address}
                {...tokenBalance}
                token={tokenBalance}
                inputAddress={account.address || ""}
              />
            )
        )}
      </ExpandoRow>
    </PortfolioTabWrapper>
  );
}

export const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`;
export const TokenNameText = styled(ThemedText.SubHeader)`
  ${EllipsisStyle}
`;

function TokenRow({
  token,
  inputAddress,
}: {
  token: TokenData;
  inputAddress: string;
}) {
  const navigate = useNavigate();
  const accountDrawer = useAccountDrawer();

  const navigateToTokenDetails = useCallback(async () => {
    window.open(
      getTokenDetailsURL({
        address: token.token.address,
        chain: Chain.Taraxa,
        inputAddress,
      }),
      "_blank"
    );
    accountDrawer.close();
  }, [navigate, token, accountDrawer]);

  const currency = tokenToCurrency(token);

  if (!currency) {
    logger.error(
      new Error(
        "Token from unsupported chain received from Mini Portfolio Token Balance Query"
      ),
      {
        tags: {
          file: "RecentlySearchedAssets",
          function: "useRecentlySearchedAssets",
        },
        extra: { token },
      }
    );
    return null;
  }
  return (
    <Trace
      logPress
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{
        chain_id: currency.chainId,
        token_name: token.token.name,
        address: token.token.address,
      }}
    >
      <PortfolioRow
        left={
          <PortfolioLogo
            chainId={currency.chainId}
            currencies={[currency]}
            size={40}
          />
        }
        title={<TokenNameText>{token.token.name}</TokenNameText>}
        descriptor={
          <TokenBalanceText>
            {Number(formatEther(BigInt(token.value))).toFixed(6)}{" "}
            {token.token.symbol}
          </TokenBalanceText>
        }
        onClick={navigateToTokenDetails}
        right={
          token.value && (
            <>
              <ThemedText.SubHeader>
                {Number(formatEther(BigInt(token.value))).toFixed(6)}
              </ThemedText.SubHeader>
              {/* <Row justify="flex-end">
                <DeltaArrow delta={percentChange} />
                <ThemedText.BodySecondary>
                  {formatDelta(percentChange)}
                </ThemedText.BodySecondary>
              </Row> */}
            </>
          )
        }
      />
    </Trace>
  );
}
