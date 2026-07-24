export const getIsButtonDisabled = ({ disabled, loading }: { disabled?: boolean; loading?: boolean }): boolean =>
  (disabled || loading) ?? false
