import React, { useContext } from 'react'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import { Flex } from 'rebass'
import { ButtonText } from 'theme/components'
import { X } from 'react-feather'
import LiveChart from 'components/LiveChart'
import { ThemeContext } from 'styled-components'
import { MobileView } from 'react-device-detect'
import { useDerivedSwapInfoV2 } from '../../state/swap/useAggregator'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'

function MobileLiveChart({ handleRotateClick }: { handleRotateClick: () => void }) {
  const theme = useContext(ThemeContext)
  const { currencies } = useDerivedSwapInfoV2()
  const isOpen = useModalOpen(ApplicationModal.MOBILE_LIVE_CHART)
  const toggle = useToggleModal(ApplicationModal.MOBILE_LIVE_CHART)

  return (
    <MobileView>
      <MobileModalWrapper isOpen={isOpen} onDismiss={toggle}>
        <Flex flexDirection="column" padding="20px" alignItems={'center'} width="100%">
          <ButtonText onClick={toggle} style={{ alignSelf: 'flex-end' }}>
            <X color={theme.text} />
          </ButtonText>
          <LiveChart currencies={currencies} onRotateClick={handleRotateClick} />
        </Flex>
      </MobileModalWrapper>
    </MobileView>
  )
}

export default MobileLiveChart
