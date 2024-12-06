import { indexerTaraswap } from "components/Incentives/types";
import { useTokenUsdPrice } from "./useTokenUsdPrice";

export const useGetNumberOfStakedPositionsForPool = async (
  poolAddress: string
) => {
  if (!indexerTaraswap) return 0;

  const response = await fetch(indexerTaraswap, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query poolPositions($pool: String) {
          positions(where: {pool: $pool, owner: "0x3611731bac2f6891dd222f6f47d9f6faf7d72e30"}) {
            id
          }
        }
      `,
      variables: { pool: poolAddress },
    }),
  });

  const data = await response.json();
  return data?.data?.positions?.length || 0;
};

export const useGetStakedLiqudityForPool = async (
  poolAddress: string
): Promise<number> => {
  if (!indexerTaraswap) return 1;

  const response = await fetch(indexerTaraswap, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query stakes($pool: String) {
          stakes(subgraphError: deny, where: { position_: { pool: $pool } }) {
            farmer { id }
            position {
              id
              depositedToken0
              depositedToken1
              token0 { id }
              token1 { id }
              pool { id }
            }
          }
          unstakes(subgraphError: deny, where: { position_: { pool: $pool } }) {
            farmer { id }
            position {
              id
              depositedToken0
              depositedToken1
              token0 { id }
              token1 { id }
              pool { id }
            }
          }
        }
      `,
      variables: { pool: poolAddress },
    }),
  });

  const data = await response.json();
  if (data.data.stakes) {
    if (data.data.stakes.length <= 0) {
      return 1;
    }

    const depositedToken0s: number[] = data.data.stakes.map((stake: any) =>
      Number(stake.position.depositedToken0)
    );
    const depositedToken1s: number[] = data.data.stakes.map((stake: any) =>
      Number(stake.position.depositedToken1)
    );
    const unstakedToken0s: number[] = data.data.unstakes.map((unstake: any) =>
      Number(unstake.position.depositedToken0)
    );
    const unstakedToken1s: number[] = data.data.unstakes.map((unstake: any) =>
      Number(unstake.position.depositedToken1)
    );

    const priceToken0 = await useTokenUsdPrice(
      data.data.stakes[0]?.position?.token0?.id
    );
    const priceToken1 = await useTokenUsdPrice(
      data.data.stakes[0]?.position?.token1?.id
    );

    const totalDepositedToken0 = depositedToken0s.reduce(
      (acc, val) => acc + val,
      0
    );
    const totalDepositedToken1 = depositedToken1s.reduce(
      (acc, val) => acc + val,
      0
    );
    const totalUnstakedToken0 = unstakedToken0s.reduce(
      (acc, val) => acc + val,
      0
    );
    const totalUnstakedToken1 = unstakedToken1s.reduce(
      (acc, val) => acc + val,
      0
    );

    const totalLiquidity =
      (totalDepositedToken0 - totalUnstakedToken0) *
        (priceToken0.usdPrice || 0) +
      (totalDepositedToken1 - totalUnstakedToken1) *
        (priceToken1.usdPrice || 0);

    return totalLiquidity;
  }

  return 1;
};
