import React, { useContext } from 'react'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import { Flex } from 'rebass'
import { ButtonText } from 'theme/components'
import { X } from 'react-feather'
import LiveChart from 'components/LiveChart'
import { ThemeContext } from 'styled-components'
import { MobileView } from 'react-device-detect'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { Field } from 'state/swap/actions'
import { Currency } from '@dynamic-amm/sdk'

function MobileLiveChart({
  handleRotateClick,
  currencies
}: {
  handleRotateClick: () => void
  currencies: { [field in Field]?: Currency }
}) {
  const theme = useContext(ThemeContext)
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
