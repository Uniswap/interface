import { BaseVariant } from '../index'

export function usePermit2Flag(): BaseVariant {
  return BaseVariant.Enabled
}

export function usePermit2Enabled(): boolean {
  return true
}

export { BaseVariant as Permit2Variant }
