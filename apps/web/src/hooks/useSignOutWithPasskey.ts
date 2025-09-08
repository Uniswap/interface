// Stub hook for useSignOutWithPasskey since passkey functionality was removed

export function useSignOutWithPasskey() {
  return {
    signOutWithPasskey: async () => {
      // No-op since passkey functionality was removed
    },
  }
}