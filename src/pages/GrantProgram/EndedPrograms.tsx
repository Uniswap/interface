import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import HourGlass from 'assets/images/hourglass.png'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import useGetGrantPrograms from 'hooks/campaigns/useGetGrantPrograms'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { GrantProgram } from 'types/grantProgram'
import { convertToSlug } from 'utils/string'

import Banner from './Banner'
import CountdownTimer from './CountdownTimer'
import Stats from './SingleProgram/Stats'

const SeeMoreWrapper = styled.div`
  position: absolute;
  right: 8px;
  bottom: 8px;

  height: 36px;

  display: flex;
  align-items: center;
  gap: 8px;

  color: ${({ theme }) => theme.white};
  transition: color 100ms linear;
`

const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  cursor: pointer;

  &:hover {
    ${SeeMoreWrapper} {
      color: ${({ theme }) => theme.primary};
    }
  }
`

const SeeMore = () => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          position: 'absolute',
          right: '8px',
          bottom: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: rgba(255, 255, 255, 0.15),
          borderRadius: '999px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(5px)',
          color: theme.white,
        }}
      >
        <ChevronRight />
      </Flex>
    )
  }

  return (
    <SeeMoreWrapper>
      <Text
        sx={{
          fontWeight: 400,
          fontSize: '20px',
          whiteSpace: 'nowrap',
          marginTop: '-4px', // horizontally aligned with ">"
        }}
      >
        <Trans>See more</Trans>
      </Text>
      <ChevronRight size={20} />
    </SeeMoreWrapper>
  )
}

const EndedProgram: React.FC<{ program: GrantProgram }> = ({ program }) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const navigate = useNavigate()

  const handleClick = () => {
    const longName = convertToSlug(program.name)
    const url = `${APP_PATHS.GRANT_PROGRAMS}/${longName}-${program.id}`
    navigate(url)
  }

  return (
    <Flex
      sx={{
        width: '100%',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <Flex
        flexWrap="wrap"
        justifyContent="center"
        width="100%"
        sx={{
          position: 'relative',
          gap: '4px',
        }}
      >
        <BannerWrapper role="button" onClick={handleClick}>
          <Banner src={upToExtraSmall ? program?.mobileBanner : program?.desktopBanner} alt={program?.name} />
          <SeeMore />
        </BannerWrapper>
        <CountdownTimer startTime={program.startTime} endTime={program.endTime} />
      </Flex>

      {upToExtraSmall ? null : (
        <Stats participants={program.totalParticipants} trades={program.totalTrades} volume={program.totalVolume} />
      )}
    </Flex>
  )
}

const StyledImage = styled.img`
  transform: rotate(11deg);
  width: 100%;
  height: auto;
`

const EmptyState = () => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        paddingTop: '48px',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <Flex width="320px">
        <StyledImage alt="reward" src={HourGlass} />
      </Flex>
      <Text
        sx={{
          fontWeight: 500,
          fontSize: '16px',
          lineHeight: '24px',
          color: theme.subText,
        }}
      >
        <Trans>Currently there are no campaigns</Trans>
      </Text>
    </Flex>
  )
}

const EndedPrograms: React.FC = () => {
  const now = Date.now() / 1000
  const { data, isValidating } = useGetGrantPrograms()
  const programs = (data?.data?.competitions || []).filter(prog => prog.endTime < now)

  if (isValidating) {
    return <Loader />
  }

  if (programs.length > 0) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          width: '100%',
          gap: '48px',
        }}
      >
        {programs.map((prog, i) => {
          return <EndedProgram key={i} program={prog} />
        })}
      </Flex>
    )
  }

  return <EmptyState />
}

export default EndedPrograms
