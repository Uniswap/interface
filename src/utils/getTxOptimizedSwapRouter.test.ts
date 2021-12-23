import { ApprovalState } from 'hooks/useApproveCallback'

import { getTxOptimizedSwapRouter, SwapRouterVersion } from './getTxOptimizedSwapRouter'

const getApprovalState = (approved: SwapRouterVersion[]) => ({
  v2: approved.includes(SwapRouterVersion.V2) ? ApprovalState.APPROVED : ApprovalState.NOT_APPROVED,
  v3: approved.includes(SwapRouterVersion.V3) ? ApprovalState.APPROVED : ApprovalState.NOT_APPROVED,
  v2V3: approved.includes(SwapRouterVersion.V2V3) ? ApprovalState.APPROVED : ApprovalState.NOT_APPROVED,
})

describe(getTxOptimizedSwapRouter, () => {
  it('always selects v2v3 when approved', () => {
    expect(
      getTxOptimizedSwapRouter({
        onlyV2Routes: true,
        onlyV3Routes: false,
        tradeHasSplits: false,
        approvalStates: getApprovalState([SwapRouterVersion.V2V3]),
      })
    ).toEqual(SwapRouterVersion.V2V3)
    expect(
      getTxOptimizedSwapRouter({
        onlyV2Routes: false,
        onlyV3Routes: true,
        tradeHasSplits: false,
        approvalStates: getApprovalState([SwapRouterVersion.V2V3]),
      })
    ).toEqual(SwapRouterVersion.V2V3)
    expect(
      getTxOptimizedSwapRouter({
        onlyV2Routes: false,
        onlyV3Routes: true,
        tradeHasSplits: false,
        approvalStates: getApprovalState([SwapRouterVersion.V2, SwapRouterVersion.V3, SwapRouterVersion.V2V3]),
      })
    ).toEqual(SwapRouterVersion.V2V3)
  })

  it('selects the right router when only v2 routes', () => {
    const base = { onlyV3Routes: false }

    // selects v2
    expect(
      getTxOptimizedSwapRouter({
        ...base,
        onlyV2Routes: true,
        tradeHasSplits: false,
        approvalStates: getApprovalState([SwapRouterVersion.V2, SwapRouterVersion.V3]),
      })
    ).toEqual(SwapRouterVersion.V2)

    // selects v2V3
    expect(
      getTxOptimizedSwapRouter({
        ...base,
        onlyV2Routes: true,
        tradeHasSplits: true,
        approvalStates: getApprovalState([SwapRouterVersion.V2]),
      })
    ).toEqual(SwapRouterVersion.V2V3)
    expect(
      getTxOptimizedSwapRouter({
        ...base,
        onlyV2Routes: true,
        tradeHasSplits: true,
        approvalStates: getApprovalState([SwapRouterVersion.V2, SwapRouterVersion.V2V3]),
      })
    ).toEqual(SwapRouterVersion.V2V3)
  })

  it('selects the right router when only v3 routes', () => {
    const base = { onlyV2Routes: false }

    // select v3
    expect(
      getTxOptimizedSwapRouter({
        ...base,
        onlyV3Routes: true,
        tradeHasSplits: false,
        approvalStates: getApprovalState([SwapRouterVersion.V2, SwapRouterVersion.V3]),
      })
    ).toEqual(SwapRouterVersion.V3)
    expect(
      getTxOptimizedSwapRouter({
        ...base,
        onlyV3Routes: true,
        tradeHasSplits: true,
        approvalStates: getApprovalState([SwapRouterVersion.V3]),
      })
    ).toEqual(SwapRouterVersion.V3)

    // selects v2V3
    expect(
      getTxOptimizedSwapRouter({
        ...base,
        onlyV3Routes: true,
        tradeHasSplits: true,
        approvalStates: getApprovalState([SwapRouterVersion.V2, SwapRouterVersion.V2V3]),
      })
    ).toEqual(SwapRouterVersion.V2V3)
  })
})
