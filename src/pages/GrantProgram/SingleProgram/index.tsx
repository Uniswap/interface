import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { MEDIA_WIDTHS } from 'theme'
import { GrantProgram } from 'types/grantProgram'

import Banner from '../Banner'
import CountdownTimer from '../CountdownTimer'
import InformationSection from './InformationSection'
import LeaderBoardSection from './LeaderBoardSection'
import RewardSection from './RewardSection'
import Stats from './Stats'

type Props = {
  program?: GrantProgram
}

const SingleProgram: React.FC<Props> = ({ program }) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const now = Date.now() / 1000

  const isCampaignOngoing = program ? program.startTime <= now && now <= program.endTime : false

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <Flex
        flexWrap="wrap"
        justifyContent="center"
        marginBottom="12px"
        width="100%"
        sx={{
          position: 'relative',
          gap: '4px',
        }}
      >
        <Banner src={upToExtraSmall ? program?.mobileBanner : program?.desktopBanner} alt={program?.name} />

        {program ? <CountdownTimer startTime={program.startTime} endTime={program.endTime} /> : null}
      </Flex>

      <Stats participants={program?.totalParticipants} trades={program?.totalTrades} volume={program?.totalVolume} />
      <LeaderBoardSection programId={program?.id} showRefreshTimer={isCampaignOngoing} />
      <RewardSection rewardDetails={program?.rewardDetails} />
      <InformationSection rules={program?.rules} terms={program?.termsAndConditions} faq={program?.faq} />
    </Flex>
  )
}

export default SingleProgram
