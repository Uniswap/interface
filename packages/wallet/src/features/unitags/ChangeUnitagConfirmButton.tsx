import { PlatformSplitStubError } from 'utilities/src/errors'

export type ChangeUnitagConfirmButtonProps = {
  isSubmitButtonDisabled: boolean
  isCheckingUnitag: boolean
  isChangeResponseLoading: boolean
  onPressSaveChanges: () => void
}

export const ChangeUnitagConfirmButton = (_: ChangeUnitagConfirmButtonProps): JSX.Element => {
  throw new PlatformSplitStubError('ChangeUnitagConfirmButton')
}
