import { AvatarUploadResponse } from '@universe/api'
import { useEffect, useState } from 'react'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { AVATAR_UPLOAD_CREDS_EXPIRY_SECONDS } from 'uniswap/src/features/unitags/constants'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

export const useAvatarUploadCredsWithRefresh = ({
  unitag,
  account,
  signerManager,
}: {
  unitag: string
  account: Account
  signerManager: SignerManager
}): {
  avatarUploadUrlLoading: boolean
  avatarUploadUrlResponse?: AvatarUploadResponse
} => {
  const [avatarUploadUrlLoading, setAvatarUploadUrlLoading] = useState(false)
  const [avatarUploadUrlResponse, setAvatarUploadUrlResponse] = useState<AvatarUploadResponse>()

  // Re-fetch the avatar upload pre-signed URL every 110 seconds to ensure it's always fresh
  useEffect(() => {
    const fetchAvatarUploadUrl = async (): Promise<void> => {
      try {
        setAvatarUploadUrlLoading(true)
        const data = await unitagsApiClient.getUnitagAvatarUploadUrl({
          data: { username: unitag }, // Assuming unitag is the username you're working with
          address: account.address,
          signMessage: generateSignerFunc(account, signerManager),
        })
        setAvatarUploadUrlResponse(new AvatarUploadResponse(data))
      } catch (e) {
        logger.error(e, {
          tags: { file: 'EditUnitagProfileScreen', function: 'fetchAvatarUploadUrl' },
        })
      } finally {
        setAvatarUploadUrlLoading(false)
      }
    }

    // Call immediately on component mount
    fetchAvatarUploadUrl().catch((e) => {
      logger.error(e, {
        tags: { file: 'EditUnitagProfileScreen', function: 'fetchAvatarUploadUrl' },
      })
    })

    // Set up the interval to refetch creds 10 seconds before expiry
    const intervalId = setInterval(fetchAvatarUploadUrl, (AVATAR_UPLOAD_CREDS_EXPIRY_SECONDS - 10) * ONE_SECOND_MS)

    // Clear the interval on component unmount
    return () => clearInterval(intervalId)
  }, [unitag, account, signerManager])

  return { avatarUploadUrlLoading, avatarUploadUrlResponse }
}
