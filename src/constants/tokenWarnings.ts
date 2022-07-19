export enum WarningTypes {
  Verfied,
  MEDIUM,
  STRONG,
  BLOCKED,
}

export const WARNING_TO_NAMES = {
  [WarningTypes.Verfied]: 'Verified',
  [WarningTypes.MEDIUM]: 'Caution',
  [WarningTypes.STRONG]: 'Warning',
  [WarningTypes.BLOCKED]: 'Not available',
}
