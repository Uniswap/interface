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
import { useScreenSize } from "hooks/screenSize";

const StyledPoolRow = styled(Row)<{ $isMobile?: boolean }>`
  align-items: center;
  margin-left: ${({ $isMobile }) => ($isMobile ? '0' : '4px')};
  gap: ${({ $isMobile }) => ($isMobile ? '0' : '12px')};
`;

const TokenContainer = styled.div`
  display: flex;
  margin-right: 8px;
  gap: -8px;
`;

const TokenImageWrapper = styled.div<{ $hasImage?: boolean; $isMobile?: boolean }>`
  width: ${({ $isMobile }) => ($isMobile ? '16px' : '30px')};
  height: ${({ $isMobile }) => ($isMobile ? '16px' : '30px')};
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

const ActionButtons = styled(Row)<{ $leftAlign?: boolean; $isMobile?: boolean }>`
  gap: ${({ $isMobile }) => ($isMobile ? '4px' : '8px')};
  width: 100%;
  justify-content: ${({ $leftAlign }) =>
    $leftAlign ? "flex-start" : "flex-end"};
`;

const SwapButton = styled.div<{ $isMobile?: boolean }>`
  cursor: pointer;
  transform: rotate(90deg);
  margin-left: ${({ $isMobile }) => ($isMobile ? '4px' : '20px')};
  display: flex;
  align-items: center;
  svg {
    width: ${({ $isMobile }) => ($isMobile ? '14px' : '24px')};
    height: ${({ $isMobile }) => ($isMobile ? '14px' : '24px')};
  }
`;

const ActionButton = styled.button<{ $variant?: "primary"; $isMobile?: boolean }>`
  padding: ${({ $isMobile }) => ($isMobile ? '2px 4px' : '8px 12px')};
  border-radius: 6px;
  font-size: ${({ $isMobile }) => ($isMobile ? '10px' : '14px')};
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

const PoolNameContainer = styled.div<{ $isMobile?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-left: ${({ $isMobile }) => ($isMobile ? '0' : '2px')};
`;

const PoolName = styled(ThemedText.BodyPrimary)<{ $isMobile?: boolean }>`
  && {
    font-size: ${({ $isMobile }) => ($isMobile ? '12px' : '16px')};
    font-weight: 500;
    margin-bottom: ${({ $isMobile }) => ($isMobile ? '1px' : '4px')};
  }
`;

const FeeLabel = styled(ThemedText.BodySecondary)<{ $isMobile?: boolean }>`
  && {
    font-size: ${({ $isMobile }) => ($isMobile ? '12px' : '14px')};
    color: ${({ theme }) => theme.neutral2};
    background: ${({ theme }) => theme.surface2};
    padding: ${({ $isMobile }) => ($isMobile ? '0 2px' : '2px 6px')};
    border-radius: 4px;
    width: fit-content;
    margin-top: ${({ $isMobile }) => ($isMobile ? '1px' : '4px')};
  }
`;

interface IncentiveTableProps {
  incentives: ProcessedIncentive[];
  isLoading: boolean;
  onDeposit?: (incentive: ProcessedIncentive) => void;
}

const PoolTokenImage = ({ pool, isMobile }: { pool: ProcessedIncentive, isMobile?: boolean }) => {
  const LOGO_DEFAULT_SIZE = isMobile ? 22 : 30;
  return (
    <TokenContainer>
      <TokenImageWrapper $hasImage={!!pool.token0LogoURI} $isMobile={isMobile}>
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
      <TokenImageWrapper $hasImage={!!pool.token1LogoURI} $isMobile={isMobile}>
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
  const isScreenSize = useScreenSize();
  const isMobile = !isScreenSize['sm'];

  const allIncentivesEnded = useMemo(
    () =>
      incentives.length > 0 && incentives.every((incentive) => incentive.status !== 'active'),
    [incentives]
  );

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("poolName", {
        id: "pool",
        header: () => (
          <Cell
            minWidth={isMobile ? 140 : 230}
            justifyContent="flex-start"
            style={{ padding: allIncentivesEnded ? "8px 2px" : undefined }}
          >
            <ThemedText.BodyPrimary>Pool</ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (pool) => {
          const data = pool?.row?.original;
          if (!data) return null;
          return (
            <Cell
              minWidth={isMobile ? 130 : 230}
              grow={isMobile ? true : false}
              justifyContent="flex-start"
              style={{ padding: allIncentivesEnded ? "8px 2px" : undefined }}
            >
              <StyledPoolRow $isMobile={isMobile}>
                <PoolTokenImage pool={data} isMobile={isMobile} />
                <PoolNameContainer $isMobile={isMobile}>
                  <PoolName $isMobile={isMobile}>{data.poolName}</PoolName>
                  <FeeLabel $isMobile={isMobile}>{data.feeTier}</FeeLabel>
                </PoolNameContainer>
              </StyledPoolRow>
            </Cell>
          );
        },
      }),
    ];

    if (!isMobile) {
      baseColumns.push(
        columnHelper.accessor("liquidity", {
          header: () => (
            <Cell
              minWidth={130}
              style={{ padding: allIncentivesEnded ? "12px 4px" : undefined }}
            >
              <ThemedText.BodyPrimary>TVL</ThemedText.BodyPrimary>
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
                  {data.liquidity}
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
                  {data.volume24h}
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
                  <ThemedText.BodyPrimary style={{ marginLeft: "25px" }}>
                    {data.feesUSD}
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
                  {data.feesUSD}
                </ThemedText.BodyPrimary>
              </Cell>
            );
          },
        })
      );
    }

    if (!allIncentivesEnded) {
      baseColumns.push(
        columnHelper.accessor("apr24h", {
          header: () => (
            <Cell minWidth={isMobile ? 30 : 180}>
              <ThemedText.BodyPrimary>APR 24H</ThemedText.BodyPrimary>
            </Cell>
          ),
          cell: (pool) => {
            const data = pool?.row?.original;
            if (!data) return null;

            return (
              <Cell minWidth={isMobile ? 90 : 150} justifyContent={isMobile ? "flex-end" : "flex-start"}>
                { !isMobile ? <PoolFeeDetails
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
                /> : <ThemedText.BodyPrimary >{data.daily24hAPR.toFixed(2)}%</ThemedText.BodyPrimary>}
              </Cell>
            );
          },
        })
      );
    }

    const idColumn = columnHelper.accessor("id", {
      header: () => <Cell minWidth={isMobile ? 10 :125} />,
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;

        if (!data.hasUserPositionInPool && !data.userHasTokensToDeposit) {
          return (
            <Cell minWidth={isMobile ? 10 :125} justifyContent="flex-end">
              <ActionButtons>
                <SwapButton $isMobile={isMobile}
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
          <Cell minWidth={isMobile ? 10 :255} justifyContent="flex-end">
            <ActionButtons $isMobile={isMobile}>
              <SwapButton $isMobile={isMobile}
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
                $isMobile={isMobile}
                onClick={() => onDeposit?.(data)}
              >
                {data.hasUserPositionInPool ? (
                  <Trans i18nKey="common.incentives.position" />
                ) : data.userHasTokensToDeposit && !data.hasUserPositionInPool && !data.hasUserPositionInIncentive ? (
                  <Trans i18nKey="common.incentives.deposit" />
                ) : null}
              </ActionButton>
            </ActionButtons>
          </Cell>
        );
      },
    });

    baseColumns.push(idColumn);

    return baseColumns;
  }, [columnHelper, navigate, onDeposit, allIncentivesEnded, isMobile]);

  return (
    <Table columns={columns} data={incentives || []} loading={isLoading} />
  );
};
