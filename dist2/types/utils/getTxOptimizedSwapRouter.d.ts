import { ApprovalState } from 'lib/hooks/useApproval';
export declare enum SwapRouterVersion {
    V2 = 0,
    V3 = 1,
    V2V3 = 2
}
/**
 * Returns the swap router that will result in the least amount of txs (less gas) for a given swap.
 * Heuristic:
 * - if trade contains a single v2-only trade & V2 SwapRouter is approved: use V2 SwapRouter
 * - if trade contains only v3 & V3 SwapRouter is approved: use V3 SwapRouter
 * - else: approve and use V2+V3 SwapRouter
 */
export declare function getTxOptimizedSwapRouter({ onlyV2Routes, onlyV3Routes, tradeHasSplits, approvalStates, }: {
    onlyV2Routes: boolean | undefined;
    onlyV3Routes: boolean | undefined;
    tradeHasSplits: boolean | undefined;
    approvalStates: {
        v2: ApprovalState;
        v3: ApprovalState;
        v2V3: ApprovalState;
    };
}): SwapRouterVersion | undefined;
