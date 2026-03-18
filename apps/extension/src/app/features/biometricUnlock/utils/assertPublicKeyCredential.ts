export function assertPublicKeyCredential(credential: Credential | null): PublicKeyCredential {
  if (!credential) {
    throw new Error('Failed to create credential')
  }

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Created credential is not a `PublicKeyCredential`')
  }

  return credential
}
