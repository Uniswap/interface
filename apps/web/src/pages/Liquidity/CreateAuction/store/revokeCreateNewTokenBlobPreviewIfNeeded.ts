import { TokenMode, type TokenFormState } from '~/pages/Liquidity/CreateAuction/types'

/** Revokes an active create-new `blob:` preview when abandoning or replacing token form state. */
export function revokeCreateNewTokenBlobPreviewIfNeeded(tokenForm: TokenFormState): void {
  if (tokenForm.mode === TokenMode.CREATE_NEW) {
    const uri = tokenForm.localImagePreviewUri
    if (uri.startsWith('blob:')) {
      URL.revokeObjectURL(uri)
    }
  }
}
