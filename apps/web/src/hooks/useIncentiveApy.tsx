import { Incentive } from "components/Incentives/types";
import { useTokenUsdPrice } from "./useTokenUsdPrice";

export const useIncentiveApy = (incentive: Incentive, totalRewardsToken: string) => {
  const { usdPrice: tokenPrice } = useTokenUsdPrice(incentive.rewardToken.id);
  
  const calculateApy = () => {
    if (!tokenPrice) return 0;
    const rewardAmount = parseFloat(totalRewardsToken);
    const rewardValue = rewardAmount * tokenPrice;
    const daysInYear = 365;
    return (rewardValue * daysInYear) / 100;
  };

  return calculateApy();
}; 