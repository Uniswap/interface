import { ApprovalState } from 'hooks/useApproveCallback'

import { selectRouterVersion } from './selectRouterVersion'

const getApprovalState = (approved: string[]) => ({
  v2: approved.includes('v2') ? ApprovalState.APPROVED : ApprovalState.NOT_APPROVED,
  v3: approved.includes('v3') ? ApprovalState.APPROVED : ApprovalState.NOT_APPROVED,
  v2V3: approved.includes('v2V3') ? ApprovalState.APPROVED : ApprovalState.NOT_APPROVED,
})

describe(selectRouterVersion, () => {
  it('always selects v2v3 when approved', () => {
    expect(
      selectRouterVersion({
        onlyV2Routes: true,
        onlyV3Routes: false,
        routeHasSplits: false,
        approvalStates: getApprovalState(['v2V3']),
      })
    ).toEqual('v2V3')
    expect(
      selectRouterVersion({
        onlyV2Routes: false,
        onlyV3Routes: true,
        routeHasSplits: false,
        approvalStates: getApprovalState(['v2V3']),
      })
    ).toEqual('v2V3')
    expect(
      selectRouterVersion({
        onlyV2Routes: false,
        onlyV3Routes: true,
        routeHasSplits: false,
        approvalStates: getApprovalState(['v2', 'v3', 'v2V3']),
      })
    ).toEqual('v2V3')
  })

  it('selects the right router when only v2 routes', () => {
    const base = { onlyV3Routes: false }

    // selects v2
    expect(
      selectRouterVersion({
        ...base,
        onlyV2Routes: true,
        routeHasSplits: false,
        approvalStates: getApprovalState(['v2', 'v3']),
      })
    ).toEqual('v2')

    // selects v2V3
    expect(
      selectRouterVersion({
        ...base,
        onlyV2Routes: true,
        routeHasSplits: true,
        approvalStates: getApprovalState(['v2']),
      })
    ).toEqual('v2V3')
    expect(
      selectRouterVersion({
        ...base,
        onlyV2Routes: true,
        routeHasSplits: true,
        approvalStates: getApprovalState(['v2', 'v2V3']),
      })
    ).toEqual('v2V3')
  })

  it('selects the right router when only v3 routes', () => {
    const base = { onlyV2Routes: false }

    // select v3
    expect(
      selectRouterVersion({
        ...base,
        onlyV3Routes: true,
        routeHasSplits: false,
        approvalStates: getApprovalState(['v2', 'v3']),
      })
    ).toEqual('v3')
    expect(
      selectRouterVersion({
        ...base,
        onlyV3Routes: true,
        routeHasSplits: true,
        approvalStates: getApprovalState(['v3']),
      })
    ).toEqual('v3')

    // selects v2V3
    expect(
      selectRouterVersion({
        ...base,
        onlyV3Routes: true,
        routeHasSplits: true,
        approvalStates: getApprovalState(['v2', 'v2V3']),
      })
    ).toEqual('v2V3')
  })
})
