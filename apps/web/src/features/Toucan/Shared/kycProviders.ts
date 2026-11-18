import { KycProvider } from 'uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet'

interface KycProviderInfo {
  name: string
  termsUrl: string
  privacyUrl: string
}

export const KYC_PROVIDER_INFO: Record<KycProvider, KycProviderInfo> = {
  [KycProvider.Predicate]: {
    name: 'Predicate',
    termsUrl: 'https://predicate.io/terms-of-service',
    privacyUrl: 'https://predicate.io/privacy-policy',
  },
  [KycProvider.ZkPassport]: {
    name: 'ZKPassport',
    termsUrl: 'https://zkpassport.id/terms',
    privacyUrl: 'https://zkpassport.id/privacy-policy',
  },
}
