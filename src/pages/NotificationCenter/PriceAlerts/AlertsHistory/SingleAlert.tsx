import { useClearSinglePriceAlertHistoryMutation } from 'services/priceAlert'

import { AnnouncementTemplatePriceAlert, PrivateAnnouncement } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'
import CommonSingleAlert from 'pages/NotificationCenter/PriceAlerts/CommonSingleAlert'
import DeleteSingleAlertButton from 'pages/NotificationCenter/PriceAlerts/DeleteSingleAlertButton'
import { formatTime } from 'utils/time'

type Props = {
  announcement: PrivateAnnouncement<AnnouncementTemplatePriceAlert>
}
const SingleAlert: React.FC<Props> = ({ announcement }) => {
  const { account } = useActiveWeb3React()
  const [clearAlert, result] = useClearSinglePriceAlertHistoryMutation()
  const { templateBody, sentAt, id } = announcement
  const historicalAlert = templateBody.alert
  return (
    <CommonSingleAlert
      renderDeleteButton={() => (
        <DeleteSingleAlertButton isDisabled={result.isLoading} onClick={() => account && clearAlert({ account, id })} />
      )}
      timeText={formatTime(sentAt)}
      alertData={historicalAlert}
      isHistorical
    />
  )
}

export default SingleAlert
