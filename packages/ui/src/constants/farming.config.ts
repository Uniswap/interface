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
            address: string
            name: string
            /**
             * `isLpToken` - this affect the way for our evaluation of the staked asset
             */
            isLpToken: boolean,
            backedAsset?: [string, string]
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
                address: '0x0093d164e9C57dc0EbC00d58E429AdCf383B65d1',
                name: 'USDC-USDT LP',
                isLpToken: true,
                /**
                 * I will fake it with USDT and USDC image
                 * @todo will need to checksum on these address
                 */
                backedAsset: ['0xdAC17F958D2ee523a2206206994597C13D831ec7', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48']
            }
        }]
    }
}