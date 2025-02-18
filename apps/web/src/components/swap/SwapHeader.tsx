import { Trans } from "i18n";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSwapAndLimitContext, useSwapContext } from "state/swap/hooks";
import { InterfaceEventNameLocal } from "uniswap/src/features/telemetry/constants";
import { sendAnalyticsEvent } from "uniswap/src/features/telemetry/send";
import { SwapTab } from "uniswap/src/types/screens/interface";
import { isIFramed } from "utils/isIFramed";
import { RowBetween, RowFixed } from "../Row";
import SettingsTab from "../Settings";
import { SwapHeaderTabButton } from "./styled";

import styled, { keyframes } from "styled-components";
import useTswapPrice from "hooks/useTswapPrice";
import { indexerTaraswap } from "components/Incentives/types";
import { useSingleTokenBalance } from "hooks/useSingleTokenBalance";
import { formatNumber } from "utils/formatNumber";

const pulse = keyframes`
  0% {
    background-color:rgb(208, 209, 212);
  }
  50% {
    background-color:rgb(235, 234, 231);
  }
  100% {
    background-color:rgb(201, 202, 204);
  }
`;

const SkeletonLoader = styled.span`
  display: inline-block;
  height: 18px;
  width: 70px;
  border-radius: 6px;
  animation: ${pulse} 2s infinite;
`;

const Card = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  padding: 15px;
  border-radius: 16px;
  color: ${({ theme }) => theme.neutral2};
  border: 1px solid rgba(155, 155, 155, 0.3);
  margin-bottom: 20px;
`;

const StatText = styled.div`
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.span`
  color: #bbb;
  font-weight: normal;
`;

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 12px;
  padding-right: 4px;
  color: ${({ theme }) => theme.neutral2};
`;

const HeaderButtonContainer = styled(RowFixed)<{ compact: boolean }>`
  gap: ${({ compact }) => (compact ? 0 : 16)}px;

  ${SwapHeaderTabButton} {
    ${({ compact }) => compact && "padding: 8px 12px;"}
  }
`;

const PathnameToTab: { [key: string]: SwapTab } = {
  "/swap": SwapTab.Swap,
  "/send": SwapTab.Send,
  // '/limit': SwapTab.Limit,
};

export default function SwapHeader({
  compact,
  syncTabToUrl,
}: {
  compact: boolean;
  syncTabToUrl: boolean;
}) {
  const { chainId, currentTab, setCurrentTab } = useSwapAndLimitContext();
  const {
    derivedSwapInfo: { trade, autoSlippage },
  } = useSwapContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [triggerBuyFlow, setTriggerBuyFlow] = useState(false);
  const tswapBalance = useSingleTokenBalance(
    "0x2bF93378d68D2a6137EE9e6fA04FEF5D07b615d3",
    "0x712037beab9a29216650b8d032b4d9a59af8ad6c"
  );

  const { tswapPrice, loading, error } = useTswapPrice(indexerTaraswap);

  useEffect(() => {
    setCurrentTab(PathnameToTab[pathname] ?? SwapTab.Swap);
    if (pathname === "/buy") {
      setTriggerBuyFlow(true);
    }
  }, [pathname, setCurrentTab]);

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent(InterfaceEventNameLocal.SwapTabClicked, { tab });
      if (syncTabToUrl) {
        navigate(`/${tab}`, { replace: true });
      } else {
        setCurrentTab(tab);
      }
    },
    [navigate, setCurrentTab, syncTabToUrl]
  );

  return (
    <>
      <Card>
        <StatText>
          <Label>Circulating Supply:</Label>
          {!tswapBalance ? (
            <SkeletonLoader />
          ) : (
            formatNumber(1e9 - Number(tswapBalance?.toExact() ?? 0))
          )}
        </StatText>
        <StatText>
          <Label>Market Cap:</Label>
          {loading || error ? (
            <SkeletonLoader />
          ) : (
            `$${formatNumber(
              (1e9 - Number(tswapBalance?.toExact() ?? 0)) * tswapPrice
            )}`
          )}
        </StatText>
      </Card>
      <StyledSwapHeader>
        <HeaderButtonContainer compact={compact}>
          <SwapHeaderTabButton
            as={pathname === "/swap" ? "h1" : "button"}
            role="button"
            tabIndex={0}
            $isActive={currentTab === SwapTab.Swap}
            onClick={() => {
              onTabClick(SwapTab.Swap);
            }}
          >
            <Trans i18nKey="common.swap" />
          </SwapHeaderTabButton>
          {/* <SwapHeaderTabButton
          $isActive={currentTab === SwapTab.Limit}
          onClick={() => {
            onTabClick(SwapTab.Limit);
          }}
        >
          <Trans i18nKey="swap.limit" />
        </SwapHeaderTabButton> */}
          {!isIFramed() && (
            <SwapHeaderTabButton
              $isActive={currentTab === SwapTab.Send}
              onClick={() => {
                onTabClick(SwapTab.Send);
              }}
            >
              <Trans i18nKey="common.send.button" />
            </SwapHeaderTabButton>
          )}
          {/* <SwapBuyFiatButton
          triggerBuyFlow={triggerBuyFlow}
          setTriggerBuyFlow={setTriggerBuyFlow}
        /> */}
        </HeaderButtonContainer>
        {currentTab === SwapTab.Swap && (
          <RowFixed>
            <SettingsTab
              autoSlippage={autoSlippage}
              chainId={chainId}
              compact={compact}
              trade={trade.trade}
            />
          </RowFixed>
        )}
      </StyledSwapHeader>
    </>
  );
}
