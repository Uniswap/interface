import JSBI from 'jsbi';
import { FeeAmount } from '../constants';
export declare abstract class SwapMath {
    /**
     * Cannot be constructed.
     */
    private constructor();
    static computeSwapStep(sqrtRatioCurrentX96: JSBI, sqrtRatioTargetX96: JSBI, liquidity: JSBI, amountRemaining: JSBI, feePips: FeeAmount): [JSBI, JSBI, JSBI, JSBI];
}
