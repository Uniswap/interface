export function assertAuthenticatorAssertionResponse(
  response: AuthenticatorResponse,
): asserts response is AuthenticatorAssertionResponse {
  if (!('authenticatorData' in response) || !('signature' in response) || !('userHandle' in response)) {
    throw new Error('Expected `AuthenticatorAssertionResponse` but received different response type')
  }
}
