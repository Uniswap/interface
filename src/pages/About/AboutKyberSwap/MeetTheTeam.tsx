import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ImranMohamad from 'assets/images/kyber_members/imran_mohamad.png'
import Jane from 'assets/images/kyber_members/jane.png'
import LoiLuu from 'assets/images/kyber_members/loi_luu.png'
import MikeLe from 'assets/images/kyber_members/mike_le.png'
import NguyenKimTrong from 'assets/images/kyber_members/nguyen_kim_trong.png'
import PrakharAgarwal from 'assets/images/kyber_members/prakhar_agarwal.png'
import SashaMai from 'assets/images/kyber_members/sasha_mai.png'
import ShaneHong from 'assets/images/kyber_members/shane_hong.png'
import SpyrosVrettos from 'assets/images/kyber_members/spyros_vrettos.png'
import TuNguyen from 'assets/images/kyber_members/tu_nguyen.png'
import VictorTran from 'assets/images/kyber_members/victor_tran.png'
import { ReactComponent as LinkedInIcon } from 'assets/svg/linkedin.svg'
import { ReactComponent as TwitterIcon } from 'assets/svg/solid_twitter_icon.svg'
import useTheme from 'hooks/useTheme'

type Member = {
  name: string
  title: string
  avatarUrl: string

  handles: {
    twitter?: string
    linkedIn?: string
  }
}

const members: Member[] = [
  {
    name: 'Victor Tran',
    title: 'Co-Founder & CEO',
    avatarUrl: VictorTran,
    handles: {
      twitter: 'vutran54',
    },
  },
  {
    name: 'Loi Luu',
    title: 'Co-Founder & Chairman',
    avatarUrl: LoiLuu,
    handles: {
      twitter: 'loi_luu',
    },
  },
  {
    name: 'Mike Le',
    title: 'CTO',
    avatarUrl: MikeLe,
    handles: {
      twitter: 'manh3006',
      linkedIn: '',
    },
  },
  {
    name: 'Shane Hong',
    title: 'Head of Strategy for DAO & KNC',
    avatarUrl: ShaneHong,
    handles: {
      twitter: 'shaneMkt',
      linkedIn: 'shanehong',
    },
  },
  {
    name: 'Imran Mohamad',
    title: 'Head of Marketing',
    avatarUrl: ImranMohamad,
    handles: {
      twitter: 'imranfaststart',
      linkedIn: 'imranmohamad',
    },
  },
  {
    name: 'Prakhar Agarwal',
    title: 'Head of Product',
    avatarUrl: PrakharAgarwal,
    handles: {
      twitter: 'prakhar707',
      linkedIn: 'prakhar707',
    },
  },
  {
    name: 'Sasha Mai',
    title: 'Head of Business Development',
    avatarUrl: SashaMai,
    handles: {
      twitter: 'Mai_Defi',
      linkedIn: 'sashamai',
    },
  },
  {
    name: 'Spyros Vrettos',
    title: 'Head of Trading',
    avatarUrl: SpyrosVrettos,
    handles: {},
  },
  {
    name: 'Nguyen Kim Trong',
    title: 'Head of Research',
    avatarUrl: NguyenKimTrong,
    handles: {
      linkedIn: 'kim-trong-73285a195',
    },
  },
  {
    name: 'Tu Nguyen',
    title: 'Head of Engineering',
    avatarUrl: TuNguyen,
    handles: {
      linkedIn: 'ngtuna',
    },
  },
  {
    name: 'Jane',
    title: 'Head of People',
    avatarUrl: Jane,
    handles: {
      linkedIn: 'thanhdtp',
    },
  },
]

const StyledImage = styled.img`
  width: 100%;
  height: auto;
`

const MemberView: React.FC<Member> = props => {
  const theme = useTheme()
  const hasHandles = Object.keys(props.handles).length > 0

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: 'min-content',
        alignItems: 'center',
      }}
    >
      <Flex
        width="140px"
        height="140px"
        sx={{
          borderRadius: '16px',
        }}
      >
        <StyledImage src={props.avatarUrl} alt={props.name} />
      </Flex>

      <Text
        as="span"
        sx={{
          fontWeight: 700,
          fontSize: '14px',
          color: theme.text,
          marginTop: '12px',
        }}
      >
        {props.name}
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
          whiteSpace: 'normal',
          textAlign: 'center',
          marginTop: '4px',
        }}
      >
        {props.title}
      </Text>

      {hasHandles && (
        <Flex
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          {props.handles.twitter && (
            <a target="_blank" href={`https://twitter.com/${props.handles.twitter}/`} rel="noreferrer">
              <TwitterIcon color={theme.text} />
            </a>
          )}
          {props.handles.linkedIn && (
            <a target="_blank" href={`https://linkedin.com/in/${props.handles.linkedIn}`} rel="noreferrer">
              <LinkedInIcon color={theme.text} />
            </a>
          )}
        </Flex>
      )}
    </Flex>
  )
}

const ListWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 48px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 36px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 32px;
  `}
`

const MeetTheTeam = () => {
  return (
    <Flex
      marginTop={['100px', '160px']}
      sx={{
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
      }}
    >
      <Text
        sx={{
          fontWeight: 500,
          fontSize: '36px',
          lineHeight: '42px',
        }}
      >
        <Trans>Meet the team</Trans>
      </Text>
      <ListWrapper>
        {members.map((member, i) => (
          <MemberView {...member} key={i} />
        ))}
      </ListWrapper>
    </Flex>
  )
}

export default MeetTheTeam
