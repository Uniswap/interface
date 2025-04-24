import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "components/Table";
import { Cell } from "components/Table/Cell";
import Row from "components/Row";
import { ThemedText } from "theme/components";
import styled from "styled-components";
import { TokenLogoImage } from "../DoubleLogo";
import { ProcessedIncentive } from "hooks/useIncentivesData";
import { formatCurrencyAmount, NumberType } from "utils/formatNumbers";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Swap } from "components/Icons/Swap";
import { Trans } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getAddress } from "ethers/lib/utils";
import { PoolFeeDetails } from "./PoolFeeDetails";
import { useMemo } from "react";

const StyledPoolRow = styled(Row)`
  align-items: center;
  margin-left: 4px;
`;

const TokenContainer = styled.div`
  display: flex;
  margin-right: 8px;
  gap: -8px;
`;

const TokenImageWrapper = styled.div<{ $hasImage?: boolean }>`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.surface2};
  border-radius: 50%;
  ${({ $hasImage }) =>
    !$hasImage &&
    `
    visibility: hidden;
  `}
`;

const ActionButtons = styled(Row)<{ $leftAlign?: boolean }>`
  gap: 8px;
  width: 100%;
  justify-content: ${({ $leftAlign }) =>
    $leftAlign ? "flex-start" : "flex-end"};
`;

const SwapButton = styled.div`
  cursor: pointer;
  transform: rotate(90deg);
  margin-left: 20px;
  display: flex;
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: "primary" }>`
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid
    ${({ theme, $variant }) =>
      $variant === "primary" ? theme.accent1 : theme.surface3};
  background: ${({ theme, $variant }) =>
    $variant === "primary" ? theme.accent1 : "transparent"};
  color: ${({ theme }) => theme.neutral1};

  &:hover {
    opacity: 0.8;
  }
`;

const PoolNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 2px;
`;

const PoolName = styled(ThemedText.BodyPrimary)`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const FeeLabel = styled(ThemedText.BodySecondary)`
  font-size: 14px;
  color: ${({ theme }) => theme.neutral2};
  background: ${({ theme }) => theme.surface2};
  padding: 2px 6px;
  border-radius: 6px;
  width: fit-content;
  margin-top: 4px;
`;

interface IncentiveTableProps {
  incentives: ProcessedIncentive[];
  isLoading: boolean;
  onDeposit?: (incentive: ProcessedIncentive) => void;
}

const formatValue = (value: string) => {
  try {
    return formatCurrencyAmount({
      amount: CurrencyAmount.fromRawAmount(
        new Token(1, "0x0000000000000000000000000000000000000000", 18, "USD"),
        Math.floor(parseFloat(value) * 1e18).toString()
      ),
      type: NumberType.FiatTokenPrice,
    });
  } catch {
    return "$0.00";
  }
};

interface PoolTokenImageProps {
  pool: {
    token0LogoURI: string;
    token1LogoURI: string;
  };
}
const PoolTokenImage = ({ pool }: { pool: ProcessedIncentive }) => {
  const LOGO_DEFAULT_SIZE = 30;
  return (
    <TokenContainer>
      <TokenImageWrapper $hasImage={!!pool.token0LogoURI}>
        {pool.token0LogoURI && (
          <a
            href={`https://www.taraswap.info/#/tokens/${pool.token0Address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TokenLogoImage size={LOGO_DEFAULT_SIZE} src={pool.token0LogoURI} />
          </a>
        )}
      </TokenImageWrapper>
      <TokenImageWrapper $hasImage={!!pool.token1LogoURI}>
        {pool.token1LogoURI && (
          <a
            href={`https://www.taraswap.info/#/tokens/${pool.token1Address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TokenLogoImage size={LOGO_DEFAULT_SIZE} src={pool.token1LogoURI} />
          </a>
        )}
      </TokenImageWrapper>
    </TokenContainer>
  );
};

export const IncentiveTable = ({
  incentives,
  isLoading,
  onDeposit,
}: IncentiveTableProps) => {
  const columnHelper = createColumnHelper<ProcessedIncentive>();
  const navigate = useNavigate();

  const allIncentivesEnded = useMemo(
    () =>
      incentives.length > 0 && incentives.every((incentive) => incentive.ended),
    [incentives]
  );

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("poolName", {
        id: "pool",
        header: () => (
          <Cell
            minWidth={230}
            justifyContent="flex-start"
            style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
          >
            <ThemedText.BodyPrimary>Pool</ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (pool) => {
          const data = pool?.row?.original;
          if (!data) return null;
          return (
            <Cell
              minWidth={230}
              justifyContent="flex-start"
              style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
            >
              <StyledPoolRow gap="12px">
                <PoolTokenImage pool={data} />
                <PoolNameContainer>
                  <PoolName>{data.poolName}</PoolName>
                  <FeeLabel>{data.feeTier}</FeeLabel>
                </PoolNameContainer>
              </StyledPoolRow>
            </Cell>
          );
        },
      }),
      columnHelper.accessor("liquidity", {
        header: () => (
          <Cell
            minWidth={130}
            style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
          >
            <ThemedText.BodyPrimary>Liquidity</ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (pool) => {
          const data = pool?.row?.original;
          if (!data) return null;
          return (
            <Cell
              minWidth={130}
              style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
            >
              <ThemedText.BodyPrimary>
                {formatValue(data.liquidity)}
              </ThemedText.BodyPrimary>
            </Cell>
          );
        },
      }),
      columnHelper.accessor("volume24h", {
        header: () => (
          <Cell
            minWidth={130}
            style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
          >
            <ThemedText.BodyPrimary>Volume 24H</ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (pool) => {
          const data = pool?.row?.original;
          if (!data) return null;
          return (
            <Cell
              minWidth={130}
              style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
            >
              <ThemedText.BodyPrimary>
                {formatValue(data.volume24h)}
              </ThemedText.BodyPrimary>
            </Cell>
          );
        },
      }),
      columnHelper.accessor("feesUSD", {
        header: () => (
          <Cell minWidth={130}>
            <ThemedText.BodyPrimary>Fees 24H</ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (pool) => {
          const data = pool?.row?.original;
          if (!data) return null;

          if (allIncentivesEnded) {
            return (
              <Cell minWidth={10}>
                <ThemedText.BodyPrimary style={{ marginLeft: "70px" }}>
                  {formatValue(data.feesUSD)}
                </ThemedText.BodyPrimary>
                <SwapButton
                  onClick={() =>
                    navigate(
                      `/swap?inputCurrency=${getAddress(
                        data.token0Address
                      )}&outputCurrency=${getAddress(
                        data.token1Address
                      )}&chain=taraxa`
                    )
                  }
                >
                  <Swap />
                </SwapButton>
              </Cell>
            );
          }

          return (
            <Cell minWidth={130} style={{ marginRight: "20px" }}>
              <ThemedText.BodyPrimary>
                {formatValue(data.feesUSD)}
              </ThemedText.BodyPrimary>
            </Cell>
          );
        },
      }),
    ];

    const idColumn = columnHelper.accessor("id", {
      header: () => <Cell minWidth={125} />,
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;

        if (!data.hasUserPositionInPool && !data.userHasTokensToDeposit) {
          return (
            <Cell minWidth={125} justifyContent="flex-end">
              <ActionButtons>
                <SwapButton
                  onClick={() =>
                    navigate(
                      `/swap?inputCurrency=${getAddress(
                        data.token0Address
                      )}&outputCurrency=${getAddress(
                        data.token1Address
                      )}&chain=taraxa`
                    )
                  }
                >
                  <Swap />
                </SwapButton>
              </ActionButtons>
            </Cell>
          );
        }

        return (
          <Cell minWidth={255} justifyContent="flex-end">
            <ActionButtons>
              <SwapButton
                onClick={() =>
                  navigate(
                    `/swap?inputCurrency=${getAddress(
                      data.token0Address
                    )}&outputCurrency=${getAddress(
                      data.token1Address
                    )}&chain=taraxa`
                  )
                }
              >
                <Swap />
              </SwapButton>
              <ActionButton
                $variant="primary"
                onClick={() => onDeposit?.(data)}
              >
                {data.hasUserPositionInPool ? (
                  <Trans i18nKey="common.incentives.position" />
                ) : (
                  <Trans i18nKey="common.incentives.deposit" />
                )}
              </ActionButton>
            </ActionButtons>
          </Cell>
        );
      },
    });

    if (!allIncentivesEnded) {
      baseColumns.push(
        columnHelper.accessor("apr24h", {
          header: () => (
            <Cell minWidth={150} justifyContent="flex-end">
              <ThemedText.BodyPrimary>APR 24H</ThemedText.BodyPrimary>
            </Cell>
          ),
          cell: (pool) => {
            const data = pool?.row?.original;
            if (!data) return null;

            if (data.ended) {
              return <Cell minWidth={150} />;
            }
            return (
              <Cell minWidth={150} justifyContent="flex-start">
                <PoolFeeDetails
                  key={data.id}
                  incentiveId={data.id}
                  rewardTokenImage={data.token1LogoURI}
                  rewardTokenSymbol={data.token1Symbol}
                  rewardTokenAddress={data.token1Address}
                  tradeFeesPercentage={data.tradeFeesPercentage}
                  tokenRewardsPercentage={data.tokenRewardsPercentage}
                  daily24hAPR={data.daily24hAPR}
                  weeklyRewards={data.weeklyRewards}
                  weeklyRewardsUSD={data.weeklyRewardsUSD}
                />
              </Cell>
            );
          },
        })
      );
      baseColumns.push(idColumn);
    }

    return baseColumns;
  }, [columnHelper, navigate, onDeposit, allIncentivesEnded]);

  return (
    <Table columns={columns} data={incentives || []} loading={isLoading} />
  );
};
