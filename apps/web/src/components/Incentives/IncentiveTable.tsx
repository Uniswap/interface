import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "components/Table";
import { Cell } from "components/Table/Cell";
import Row from "components/Row";
import { ThemedText } from "theme/components";
import styled from "styled-components";
import { Star } from "react-feather";
import { TokenLogoImage } from "../DoubleLogo";
import { ProcessedIncentive } from "./IncentivesDataProvider";
import { formatCurrencyAmount, NumberType } from "utils/formatNumbers";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Swap } from "components/Icons/Swap";
import { Trans } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getAddress } from "ethers/lib/utils";
import { PoolFeeDetails } from "./PoolFeeDetails";

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

const SymbolText = styled(ThemedText.BodyPrimary)`
  font-size: 14px;
  white-space: nowrap;
`;

const ActionButtons = styled(Row)`
  gap: 8px;
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

const StyledSwap = styled(Swap)`
  path {
    fill: ${({ theme }) => theme.neutral1};
  }
  background: transparent !important;
  rect,
  circle {
    fill: transparent !important;
  }
  * {
    background: transparent !important;
  }
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
          <TokenLogoImage size={LOGO_DEFAULT_SIZE} src={pool.token0LogoURI} />
        )}
      </TokenImageWrapper>
      <TokenImageWrapper $hasImage={!!pool.token1LogoURI}>
        {pool.token1LogoURI && (
          <TokenLogoImage size={LOGO_DEFAULT_SIZE} src={pool.token1LogoURI} />
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
  const redirectToSwap = (data: ProcessedIncentive) => {
    navigate(
      `/swap?inputCurrency=${getAddress(
        data.token0Address
      )}&outputCurrency=${getAddress(data.token1Address)}&chain=taraxa`
    );
  };
  const columns = [
    columnHelper.accessor("poolName", {
      id: "pool",
      header: () => (
        <Cell minWidth={200} justifyContent="flex-start">
          <ThemedText.BodyPrimary>Pool</ThemedText.BodyPrimary>
        </Cell>
      ),
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;
        return (
          <Cell minWidth={200} justifyContent="flex-start">
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
        <Cell minWidth={50}>
          <ThemedText.BodyPrimary>Liquidity</ThemedText.BodyPrimary>
        </Cell>
      ),
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;
        return (
          <Cell minWidth={50}>
            <ThemedText.BodyPrimary>
              {formatValue(data.liquidity)}
            </ThemedText.BodyPrimary>
          </Cell>
        );
      },
    }),
    columnHelper.accessor("volume24h", {
      header: () => (
        <Cell minWidth={50}>
          <ThemedText.BodyPrimary>Volume 24H</ThemedText.BodyPrimary>
        </Cell>
      ),
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;
        return (
          <Cell minWidth={50}>
            <ThemedText.BodyPrimary>
              {formatValue(data.volume24h)}
            </ThemedText.BodyPrimary>
          </Cell>
        );
      },
    }),
    columnHelper.accessor("feesUSD", {
      header: () => (
        <Cell minWidth={50}>
          <ThemedText.BodyPrimary>Fees 24H</ThemedText.BodyPrimary>
        </Cell>
      ),
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;
        return (
          <Cell minWidth={50}>
            <ThemedText.BodyPrimary>
              {formatValue(data.feesUSD)}
            </ThemedText.BodyPrimary>
          </Cell>
        );
      },
    }),
    columnHelper.accessor("apr24h", {
      header: () => (
        <Cell minWidth={50}>
          <ThemedText.BodyPrimary>APR 24H</ThemedText.BodyPrimary>
        </Cell>
      ),
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;
        return (
          <Cell minWidth={50}>
            <ThemedText.BodyPrimary>{data.apr24h}</ThemedText.BodyPrimary>
          </Cell>
        );
      },
    }),
    columnHelper.accessor("id", {
      header: () => <Cell minWidth={150} />,
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;

        if (data.ended) {
          return <Cell minWidth={150} />;
        }

        if (!data.hasUserPosition && !data.userHasTokensToDeposit) {
          return (
            <Cell minWidth={150}>
              {" "}
              <ActionButtons>
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => redirectToSwap(data)}
                >
                  <Swap />
                </div>
              </ActionButtons>
            </Cell>
          );
        }

        return (
          <Cell minWidth={150}>
            <ActionButtons>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => redirectToSwap(data)}
              >
                <Swap />
              </div>
              <ActionButton
                $variant="primary"
                onClick={() => onDeposit?.(data)}
                style={{ marginLeft: "5px" }}
              >
                {data.hasUserPosition ? (
                  <Trans i18nKey="common.incentives.position" />
                ) : (
                  <Trans i18nKey="common.incentives.deposit" />
                )}
              </ActionButton>
            </ActionButtons>
          </Cell>
        );
      },
    }),
    columnHelper.accessor("reward", {
      header: () => <Cell minWidth={150} />,
      cell: (pool) => {
        const data = pool?.row?.original;
        if (!data) return null;
        return (
          <Cell minWidth={150}>
            <PoolFeeDetails
              poolId={data.poolAddress}
              rewardTokenImage={data.token1LogoURI}
              rewardTokenSymbol={data.token1Symbol}
            />
          </Cell>
        );
      },
    }),
  ];

  return (
    <Table
      columns={columns}
      data={incentives || []}
      loading={isLoading}
      maxWidth={1200}
    />
  );
};
