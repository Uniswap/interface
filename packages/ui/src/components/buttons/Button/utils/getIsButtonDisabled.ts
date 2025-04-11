export const getIsButtonDisabled = ({ isDisabled, loading }: { isDisabled?: boolean; loading?: boolean }): boolean =>
  (isDisabled || loading) ?? false
