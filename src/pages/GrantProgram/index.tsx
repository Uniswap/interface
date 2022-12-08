import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flex } from 'rebass'

import { APP_PATHS } from 'constants/index'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { getCampaignIdFromSlug } from 'utils/campaign'

import EndedPrograms from './EndedPrograms'
import LatestProgram from './LatestProgram'
import SpecificProgram from './SpecificProgram'
import { Container, PageWrapper, TabButton } from './styleds'

enum Tab {
  Latest = 'latest',
  Ended = 'ended',
}

const getActiveTab = (programId?: string, tab?: any) => {
  if (programId) {
    return undefined
  }

  if (tab === undefined || tab === Tab.Latest) {
    return Tab.Latest
  }

  if (tab === Tab.Ended) {
    return Tab.Ended
  }

  return undefined
}

const GrantProgramPage = () => {
  const navigate = useNavigate()
  const params = useParams() as any
  const slug = params.slug
  const { tab } = useParsedQueryString()
  const programId = slug ? getCampaignIdFromSlug(slug) : undefined

  const activeTab = getActiveTab(programId, tab)

  const handleClickTab = (tab: Tab) => {
    navigate(`${APP_PATHS.GRANT_PROGRAMS}/?tab=${tab}`)
  }

  useEffect(() => {
    if (!activeTab && !programId) {
      navigate(APP_PATHS.GRANT_PROGRAMS)
    }
  }, [activeTab, navigate, programId])

  return (
    <PageWrapper>
      <Container>
        <Flex
          sx={{
            gap: '36px',
            marginBottom: '16px',
          }}
        >
          <TabButton
            active={activeTab === Tab.Latest}
            onClick={() => handleClickTab(Tab.Latest)}
          >{t`Latest`}</TabButton>
          <TabButton active={activeTab === Tab.Ended} onClick={() => handleClickTab(Tab.Ended)}>{t`Ended`}</TabButton>
        </Flex>

        {activeTab === Tab.Latest ? <LatestProgram /> : null}
        {activeTab === Tab.Ended ? <EndedPrograms /> : null}
        {activeTab === undefined && programId ? <SpecificProgram id={programId} /> : null}
      </Container>
    </PageWrapper>
  )
}

export default GrantProgramPage
