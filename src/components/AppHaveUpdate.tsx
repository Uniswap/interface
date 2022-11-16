import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { Z_INDEXS } from 'constants/styles'
import { useServiceWorkerRegistration } from 'state/application/hooks'

import { ButtonPrimary } from './Button'

const Wrapper = styled.div`
  padding: 20px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: ${({ theme }) => theme.tableHeader};
  z-index: ${Z_INDEXS.MODAL};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
  text-align: center;
  border-radius: 1rem;
`
const AppHaveUpdate = () => {
  const serviceWorkerRegistration = useServiceWorkerRegistration()

  const updateServiceWorker = () => {
    if (!serviceWorkerRegistration) return
    const registrationWaiting = serviceWorkerRegistration.waiting

    if (registrationWaiting) {
      registrationWaiting.postMessage({ type: 'SKIP_WAITING' })

      registrationWaiting.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') {
          window.location.reload()
        }
      })
    } else {
      window.location.reload()
    }
  }
  if (!serviceWorkerRegistration?.waiting) return null

  return (
    <Wrapper>
      <Text>
        <Trans>New contents are available</Trans>
      </Text>
      <ButtonPrimary
        style={{ width: 'fit-content', padding: '8px 20px', margin: 'auto', marginTop: '1rem' }}
        onClick={updateServiceWorker}
      >
        Reload
      </ButtonPrimary>
    </Wrapper>
  )
}

export default AppHaveUpdate
