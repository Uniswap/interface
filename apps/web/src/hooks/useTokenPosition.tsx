import { useAccount } from "hooks/useAccount";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useCallback, useState } from "react";
import { PositionDetails } from "./usePosition";

const useTokenPosition = (tokenId: number) => {
  const { address } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getDepositData =
    useCallback(async (): Promise<PositionDetails | null> => {
      if (!(v3StakerContract && address)) return null;

      try {
        setIsLoading(true);
        const depositData: PositionDetails = await v3StakerContract.deposits(
          tokenId
        );
        return depositData;
      } catch (e) {
        console.warn(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [tokenId, address, v3StakerContract]);

  return {
    isLoading,
    getDepositData,
  };
};

export default useTokenPosition;
