import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { appRatingStateSelector } from 'wallet/src/features/appRating/selectors'

export const useAppRating = (): {
  appRatingModalVisible: boolean
  onAppRatingModalClose: () => void
} => {
  const { shouldPrompt } = useSelector(appRatingStateSelector)
  const [appRatingModalVisible, setAppRatingModalVisible] = useState(false)

  useEffect(() => {
    if (shouldPrompt) {
      setAppRatingModalVisible(true)
    }
  }, [shouldPrompt])

  const onAppRatingModalClose = (): void => {
    setAppRatingModalVisible(false)
  }

  return {
    appRatingModalVisible,
    onAppRatingModalClose,
  }
}
