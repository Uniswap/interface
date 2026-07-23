/**
 * Standards for a token logo upload. Intentionally distinct from `AVATAR_IMAGE_STANDARDS`:
 * - The original file is uploaded as-is (no resize/re-encode) so animated GIFs are preserved.
 * - `image/gif` is allowed.
 * - The 2 MB cap mirrors the Pinata server-side limit, so we fail fast before presigning/uploading.
 */
export const TOKEN_IMAGE_STANDARDS = {
  maxFileSizeBytes: 2 * 1024 * 1024,
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
} as const

/** Result of validating a picked file, before any network work. */
export type TokenImageValidationResult =
  | { kind: 'selected'; file: File }
  | { kind: 'invalid-type' }
  | { kind: 'too-large' }

/** Result of the full picker flow — adds the picker-only `cancelled` outcome. */
export type SelectTokenImageResult = TokenImageValidationResult | { kind: 'cancelled' }

/**
 * Pure validation for a picked file. Type is checked before size, so a wrong-type file that also
 * happens to be oversized reports `invalid-type` (the more actionable message). Kept separate from
 * the DOM picker below so it can be unit-tested without a real file dialog.
 */
export function validateTokenImageFile(file: File): TokenImageValidationResult {
  if (!TOKEN_IMAGE_STANDARDS.allowedTypes.some((type) => type === file.type)) {
    return { kind: 'invalid-type' }
  }
  if (file.size > TOKEN_IMAGE_STANDARDS.maxFileSizeBytes) {
    return { kind: 'too-large' }
  }
  return { kind: 'selected', file }
}

/**
 * Opens a native image picker and resolves with a discriminated result. Resolves `cancelled` when the
 * user dismisses the dialog (or selects nothing). Validation is delegated to `validateTokenImageFile`.
 * Web-only: the entire Create-Auction page is web, so no platform suffix is needed.
 */
export async function selectTokenImageFile(): Promise<SelectTokenImageResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = TOKEN_IMAGE_STANDARDS.allowedTypes.join(',')

    input.onchange = (event: Event): void => {
      const file = (event.target as HTMLInputElement).files?.[0]
      resolve(file ? validateTokenImageFile(file) : { kind: 'cancelled' })
    }
    input.oncancel = (): void => resolve({ kind: 'cancelled' })

    input.click()
  })
}
