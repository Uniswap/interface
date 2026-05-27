import { FeatureFlags, useFeatureFlag } from '@universe/gating'

export type CreatePositionProtocolVersion = 'v2' | 'v3' | 'v4'

/**
 * Builds the create-position route.
 * `protocolVersion` only applies to the legacy `/positions/create/:version` route;
 * the revamp flow always uses `/positions/add`.
 */
export function buildCreatePositionHref({
  entryPoint,
  isAddLiquidityRevampEnabled,
  protocolVersion = 'v4',
}: {
  entryPoint?: string
  isAddLiquidityRevampEnabled: boolean
  protocolVersion?: CreatePositionProtocolVersion
}): string {
  const path = isAddLiquidityRevampEnabled ? '/positions/add' : `/positions/create/${protocolVersion}`
  const search = entryPoint ? new URLSearchParams({ entryPoint }).toString() : ''
  return search ? `${path}?${search}` : path
}

export function useCreatePositionHref({
  entryPoint,
  protocolVersion,
}: {
  entryPoint?: string
  protocolVersion?: CreatePositionProtocolVersion
} = {}): string {
  const isAddLiquidityRevampEnabled = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)

  return buildCreatePositionHref({
    entryPoint,
    isAddLiquidityRevampEnabled,
    protocolVersion,
  })
}
