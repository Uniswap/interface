import { BigNumber } from "ethers";

export interface Farm {
    pid: number;
    /**
     * indicate whether is LP token or not
     * which will affect how the 'total staked value' was evaluated
     */
    isLpToken: boolean;
    // fetch from PoolInfo
    stakedToken: string;
    allocPoint: BigNumber;
    lastRewardBlock: BigNumber;
    accSushiPerShare: BigNumber;
}