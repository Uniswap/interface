import { useEffect, useState } from 'react'
import { AVATAR_UPLOAD_CREDS_EXPIRY_SECONDS } from 'uniswap/src/features/unitags/constants'
import { UnitagGetAvatarUploadUrlResponse } from 'uniswap/src/features/unitags/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getUnitagAvatarUploadUrl } from 'wallet/src/features/unitags/api'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

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
  avatarUploadUrlResponse?: UnitagGetAvatarUploadUrlResponse
} => {
  const [avatarUploadUrlLoading, setAvatarUploadUrlLoading] = useState(false)
  const [avatarUploadUrlResponse, setAvatarUploadUrlResponse] = useState<UnitagGetAvatarUploadUrlResponse>()

  // Re-fetch the avatar upload pre-signed URL every 110 seconds to ensure it's always fresh
  useEffect(() => {
    const fetchAvatarUploadUrl = async (): Promise<void> => {
      try {
        setAvatarUploadUrlLoading(true)
        const { data } = await getUnitagAvatarUploadUrl({
          username: unitag, // Assuming unitag is the username you're working with
          account,
          signerManager,
        })
        setAvatarUploadUrlResponse(data)
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
