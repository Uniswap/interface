import { STAKER_ADDRESS, useV3StakerContract } from "hooks/useV3StakerContract";
import { useCallback, useState } from "react";
import {
  indexerTaraswap,
  POSITIONS_QUERY,
  STAKED_POSITIONS_QUERY,
} from "components/Incentives/types";

export interface PositionsResponse {
  id: number;
  owner: {
    id: string;
  };
  minter: {
    id: string;
  };
  pool: {
    id: string;
    incentives: {
      id: string;
    }[];
  };
  liquidity: number;
  depositedToken0: string;
  token0: {
    symbol: string;
  };
  depositedToken1: string;
  token1: {
    symbol: string;
  };
  tickLower: {
    tickIdx: number;
  };
  tickUpper: {
    tickIdx: number;
  };
}

export interface PositionsResponseRaw {
  id: string;
  owner: {
    id: string;
  };
  minter: {
    id: string;
  };
  pool: {
    id: string;
    incentives: {
      id: string;
    }[];
  };
  liquidity: number;
  depositedToken0: string;
  token0: {
    symbol: string;
  };
  depositedToken1: string;
  token1: {
    symbol: string;
  };
  tickLower: {
    tickIdx: number;
  };
  tickUpper: {
    tickIdx: number;
  };
}

const parsePositions = (r: PositionsResponseRaw) => {
  return {
    id: parseInt(r.id, 16),
    owner: {
      id: r.owner.id,
    },
    minter: {
      id: r.minter.id,
    },
    pool: {
      id: r.pool.id,
      incentives: r.pool.incentives.map((i) => ({
        id: i.id,
      })),
    },
    liquidity: r.liquidity,
    depositedToken0: r.depositedToken0,
    token0: {
      symbol: r.token0.symbol,
    },
    depositedToken1: r.depositedToken1,
    token1: {
      symbol: r.token1.symbol,
    },
    tickLower: {
      tickIdx: r.tickLower.tickIdx,
    },
    tickUpper: {
      tickIdx: r.tickUpper.tickIdx,
    },
  };
};

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
      return raw.map((r) => parsePositions(r));
    }
    return null;
  }, [indexerTaraswap, POSITIONS_QUERY, setIsLoading]);

  const fetchStakedPositions = useCallback(async (): Promise<
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
        query: STAKED_POSITIONS_QUERY,
      }),
    });
    const data = await response.json();
    setIsLoading(false);
    if (data && data.data && data.data.positions) {
      const raw: PositionsResponseRaw[] = data.data.positions;
      return raw.map((r) => parsePositions(r));
    }
    return null;
  }, [indexerTaraswap, STAKED_POSITIONS_QUERY, setIsLoading]);

  const getPositionsOfUser = async (
    address: string
  ): Promise<PositionsResponse[]> => {
    const totalPositions = await fetchTotalPositions();
    if (!totalPositions) return [];
    return totalPositions.filter(
      (pos) => pos.owner.id.toLowerCase() === address.toLowerCase()
    );
  };

  const getStakerOwnedPositions = async (
    address: string
  ): Promise<PositionsResponse[]> => {
    if (!v3StakerContract) return [];
    const totalPositions = await fetchTotalPositions();
    if (!totalPositions) return [];

    setIsLoading(true);
    const ownPositions = totalPositions.filter(
      (pos) => pos.owner.id.toLowerCase() === address.toLowerCase()
    );

    const stakedPositions = totalPositions.filter(
      (pos) =>
        pos.owner.id.toLowerCase() === STAKER_ADDRESS.toLowerCase() &&
        pos.minter.id.toLowerCase() === address.toLowerCase()
    );

    setIsLoading(false);
    return ownPositions.concat(stakedPositions);
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

    const stakedPositions = totalPositions.filter(
      (pos) =>
        pos.owner.id.toLowerCase() === STAKER_ADDRESS.toLowerCase() &&
        pos.minter.id.toLowerCase() === address.toLowerCase()
    );

    setIsLoading(false);
    return ownPositions.concat(stakedPositions);
  };

  return {
    isLoading,
    fetchTotalPositions,
    fetchStakedPositions,
    getPositionsOfUser,
    getStakerOwnedPositions,
    getPositionsWithDepositsOfUser,
  };
};

export default useTotalPositions;
