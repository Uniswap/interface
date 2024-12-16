import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { appRatingStateSelector } from 'wallet/src/features/appRating/selectors'

export const useAppRating = (): {
  appRatingModalVisible: boolean
  onAppRatingModalClose: () => void
} => {
  const appRatingEnabled = useFeatureFlag(FeatureFlags.ExtensionAppRating)
  const { shouldPrompt } = useSelector(appRatingStateSelector)
  const [appRatingModalVisible, setAppRatingModalVisible] = useState(false)

  useEffect(() => {
    if (shouldPrompt && appRatingEnabled) {
      setAppRatingModalVisible(true)
    }
  }, [appRatingEnabled, shouldPrompt])

  const onAppRatingModalClose = (): void => {
    setAppRatingModalVisible(false)
  }

  return {
    appRatingModalVisible,
    onAppRatingModalClose,
  }
}
