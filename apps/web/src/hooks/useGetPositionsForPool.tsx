import { indexerTaraswap } from "components/Incentives/types";

export const useGetStakedPositionsForPool = async (poolAddress: string) => {
  if (!indexerTaraswap) {
    return 0;
  }
  const response = await fetch(indexerTaraswap, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
          query poolPositions($pool: String) {
            positions(where: {pool: $pool, owner: "0x3611731bac2f6891dd222f6f47d9f6faf7d72e30"}) {
              id
            }
          }
        `,
      variables: {
        pool: poolAddress,
      },
    }),
  });
  const data = await response.json();
  if (data && data.data) {
    const positions = data.data.positions;
    return positions.length;
  }
  return 0;
};
