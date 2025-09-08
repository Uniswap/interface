// Simplified RecentlyConnectedModal without embedded wallet functionality

export function RecentlyConnectedModal() {
  // Simplified implementation without embedded wallet functionality
  return null
}

// Hook to get wallet display information
export function useWalletDisplay(address?: string) {
  return {
    displayName: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
  }
}
