import { Currency } from '@kyberswap/ks-sdk-core'
import React from 'react'
import { MobileView } from 'react-device-detect'
import { X } from 'react-feather'
import { Flex } from 'rebass'

import LiveChart from 'components/LiveChart'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { ButtonText } from 'theme/components'

function MobileLiveChart({
  handleRotateClick,
  currencies,
}: {
  handleRotateClick: () => void
  currencies: { [field in Field]?: Currency }
}) {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.MOBILE_LIVE_CHART)
  const toggle = useToggleModal(ApplicationModal.MOBILE_LIVE_CHART)
  const isHorizontal = window.orientation === 90 || window.orientation === -90
  return (
    <MobileView>
      <MobileModalWrapper
        isOpen={isOpen}
        onDismiss={toggle}
        transition={false}
        maxHeight={90}
        height={isHorizontal ? `${window.innerHeight}px` : undefined}
        minHeight={70}
      >
        <Flex flexDirection="column" padding="20px" alignItems="center" width="100%">
          <LiveChart
            currencies={currencies}
            onRotateClick={handleRotateClick}
            mobileCloseButton={
              <ButtonText onClick={toggle} style={{ alignSelf: 'flex-end', padding: '5px 0 5px 15px' }}>
                <X color={theme.text} />
              </ButtonText>
            }
          />
        </Flex>
      </MobileModalWrapper>
    </MobileView>
  )
}

export default MobileLiveChart
