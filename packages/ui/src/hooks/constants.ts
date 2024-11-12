import { spacing } from 'ui/src/theme'

export const DEFAULT_BOTTOM_INSET = spacing.spacing20

// Disabling eslint rules for PascalCase enum Member name as IPhoneSE feels wrong
export enum MobileDeviceHeight {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iPhoneSE = 667,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iPhone12 = 812,
}
