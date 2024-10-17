import { useAccount } from "hooks/useAccount";
import { STAKER_ADDRESS, useV3StakerContract } from "hooks/useV3StakerContract";
import { useCallback, useState } from "react";
import { PositionDetails } from "./usePosition";
import { indexerTaraswap, POSITIONS_QUERY } from "components/Incentives/types";
import { add } from "date-fns";

export interface PositionsResponse {
  id: number;
  owner: {
    id: string;
  };
}

export interface PositionsResponseRaw {
  id: string;
  owner: {
    id: string;
  };
}

const useTotalPositions = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const v3StakerContract = useV3StakerContract();

  const fetchTotalPositions = useCallback(async (): Promise<
    PositionsResponse[] | null
  > => {
    if (!indexerTaraswap) {
      return null;
    }
    setIsLoading(true);
    const response = await fetch(indexerTaraswap, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: POSITIONS_QUERY,
      }),
    });
    const data = await response.json();
    setIsLoading(false);
    if (data && data.data && data.data.positions) {
      const raw: PositionsResponseRaw[] = data.data.positions;
      return raw.map((r) => ({
        id: parseInt(r.id, 16),
        owner: {
          id: r.owner.id,
        },
      }));
    }
    return null;
  }, [indexerTaraswap, POSITIONS_QUERY, setIsLoading]);

  const getPositionsOfUser = async (
    address: string
  ): Promise<PositionsResponse[]> => {
    const totalPositions = await fetchTotalPositions();
    if (!totalPositions) return [];
    return totalPositions.filter(
      (pos) => pos.owner.id.toLowerCase() === address.toLowerCase()
    );
  };

  const getPositionsWithDepositsOfUser = async (
    address: string
  ): Promise<PositionsResponse[]> => {
    if (!v3StakerContract) return [];
    const totalPositions = await fetchTotalPositions();
    if (!totalPositions) return [];

    setIsLoading(true);
    const ownPositions = totalPositions.filter(
      (pos) => pos.owner.id.toLowerCase() === address.toLowerCase()
    );

    const v3StakerPositions = totalPositions.filter(
      (pos) => pos.owner.id.toLowerCase() === STAKER_ADDRESS.toLowerCase()
    );

    let depositedButOwnedPositions: PositionsResponse[] = [];

    for (let i = 0; i < v3StakerPositions.length; i++) {
      const depositWithId: PositionDetails = await v3StakerContract.deposits(
        v3StakerPositions[i].id
      );
      if (depositWithId.owner.toLowerCase() === address.toLowerCase()) {
        depositedButOwnedPositions.push({
          id: v3StakerPositions[i].id,
          owner: {
            id: depositWithId.owner,
          },
        });
      }
    }

    setIsLoading(false);
    return ownPositions.concat(depositedButOwnedPositions);
  };

  return {
    isLoading,
    fetchTotalPositions,
    getPositionsOfUser,
    getPositionsWithDepositsOfUser,
  };
};

export default useTotalPositions;
