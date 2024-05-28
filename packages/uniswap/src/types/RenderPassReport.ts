// Copied and adapted from @shopify/react-native-performance/src/RenderPassReport.ts
// to avoid bringing this code into web code

interface ResourceAcquisitionStatus {
  totalTimeMillis: number
  components: {
    [operationName: string]:
      | {
          durationMillis: number
          status: 'completed' | 'cancelled'
        }
      | {
          durationMillis?: never
          status: 'ongoing'
        }
  }
}

type RenderPassEndInfo =
  | {
      renderPassName: string
      timeToRenderMillis: number
      timeToAbortMillis?: never
      interactive: boolean
    }
  | {
      renderPassName?: never
      timeToRenderMillis?: never
      timeToAbortMillis: number
      interactive: false
    }

type RenderPassStartInfo = {
  flowStartTimeSinceEpochMillis: number
} & (
  | {
      timeToConsumeTouchEventMillis: number | undefined
      timeToBootJsMillis?: never
    }
  | {
      timeToConsumeTouchEventMillis?: never
      timeToBootJsMillis: number
    }
)

interface FlowInfo {
  flowInstanceId: string
  sourceScreen: string | undefined
  destinationScreen: string
}

interface SnapshotInfo {
  reportId: string
  resourceAcquisitionStatus: ResourceAcquisitionStatus
}

export type RenderPassReport = SnapshotInfo & FlowInfo & RenderPassStartInfo & RenderPassEndInfo
