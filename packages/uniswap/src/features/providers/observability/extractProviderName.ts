const PROVIDER_PATTERNS: [RegExp, string][] = [
  // Paid providers
  [/quiknode\.pro/, 'quicknode'],
  [/infura\.io/, 'infura'],
  [/alchemy\.com/, 'alchemy'],
  [/ankr\.com/, 'ankr'],
  [/blastapi\.io/, 'blastapi'],
  [/mevblocker\.io/, 'mev-blocker'],
  [/flashbots\.net/, 'flashbots'],
  [/cloudflare-eth\.com/, 'cloudflare'],
  [/tenderly\.co/, 'tenderly'],
  [/drpc\.org/, 'drpc'],
  [/1rpc\.io/, '1rpc'],
  [/publicnode\.com/, 'publicnode'],
  [/meowrpc\.com/, 'meowrpc'],
  [/public-rpc\.com/, 'public-rpc'],
  // Chain-native RPCs
  [/unichain\.org/, 'unichain-native'],
  [/optimism\.io/, 'optimism-native'],
  [/arbitrum\.io/, 'arbitrum-native'],
  [/base\.org/, 'base-native'],
  [/avax\.network/, 'avalanche-native'],
  [/bnbchain\.org/, 'bnb-native'],
  [/zksync\.io/, 'zksync-native'],
  [/polygon-rpc\.com/, 'polygon-native'],
  [/zora\.energy/, 'zora-native'],
  [/soneium\.org/, 'soneium-native'],
  [/blast\.io/, 'blast-native'],
  [/forno\.celo\.org/, 'celo-native'],
]

export function extractProviderName(url: string): string {
  for (const [pattern, name] of PROVIDER_PATTERNS) {
    if (pattern.test(url)) {
      return name
    }
  }
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}
