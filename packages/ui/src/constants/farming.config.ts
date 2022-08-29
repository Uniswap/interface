import { ChainId } from "@teleswap/sdk";
import { Chef } from "./farm/chef.enum"

interface FarmConfig {
    chefType: Chef
    chainId: ChainId
    /**
     * @Note
     * here is the tricky part. `pools` must be added in the seqenuce of the `poolInfo` in chef's contract
     */
    pools: {
        /**
         * this control whether the pool will be hidden or not (if user have no deposit in this pool)
         */
        isHidden?: boolean

        stakingAsset: {
            name: string
            /**
             * `isLpToken` - this affect the way for our evaluation of the staked asset and its logo
             */
            isLpToken: boolean,
        }
    }[]

}

export const CHAINID_TO_FARMING_CONFIG: { [chainId in ChainId]?: FarmConfig } = {
    [ChainId.OP_GOERLI]: {
        chefType: Chef.MINICHEF,
        chainId: ChainId.OP_GOERLI,
        pools: [{
            // pid 0
            stakingAsset: {
                name: 'USDC-USDT LP',
                isLpToken: true,
            }
        }]
    }
}