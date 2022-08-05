import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { ButtonEmpty } from 'components/Button'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px;
  background-color: ${({ theme }) => theme.background};
`

const Btn = styled.button`
  outline: none;
  border: none;
  height: 36px;
  width: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => rgba(theme.subText, 0.4)};
  }
`

export enum TutorialType {
  ELASTIC_POOLS = 'elastic_pools',
  ELASTIC_FARMS = 'elastic_farms',
  ELASTIC_MY_POOLS = 'elastic_my_pools',

  ELASTIC_ADD_LIQUIDITY = 'elastic_add_liquidity',
  ELASTIC_REMOVE_LIQUIDITY = 'elastic_remove_liquidity',
  ELASTIC_INCREASE_LIQUIDITY = 'ELASTIC_INCREASE_LIQUIDITY',
  CLASSIC_ADD_LIQUIDITY = 'CLASSIC_ADD_LIQUIDITY',
  CLASSIC_CREATE_POOL = 'CLASSIC_CREATE_POOL',

  CLASSIC_POOLS = 'classic_pools',
  CLASSIC_FARMS = 'classic_farms',
  CLASSIC_MY_POOLS = 'classic_my_pools',

  SWAP = 'swap',
}

interface Props {
  type: TutorialType
  customIcon?: ReactNode
}

function Tutorial(props: Props) {
  const theme = useTheme()
  const [show, setShow] = useState(false)

  const title = (() => {
    switch (props.type) {
      case TutorialType.ELASTIC_POOLS:
        return <Trans>Navigating Pools Tutorial</Trans>
      case TutorialType.CLASSIC_POOLS:
        return <Trans>Navigating Pools Tutorial</Trans>

      case TutorialType.ELASTIC_FARMS:
        return <Trans>How to Farm Tutorial</Trans>
      case TutorialType.CLASSIC_FARMS:
        return <Trans>How to Farm Tutorial</Trans>

      case TutorialType.ELASTIC_MY_POOLS:
        return <Trans>Navigating My Pools Tutorial</Trans>
      case TutorialType.CLASSIC_MY_POOLS:
        return <Trans>Navigating My Pools Tutorial</Trans>
      default:
        return <Trans>Tutorial</Trans>
    }
  })()

  const subTitle = (() => {
    switch (props.type) {
      case TutorialType.CLASSIC_ADD_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to add liquidity to KyberSwap Classic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/Classic/guides/adding-liquidity-guide"> here</ExternalLink>
          </Trans>
        )

      case TutorialType.ELASTIC_ADD_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to add liquidity to KyberSwap Elastic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/creating-a-pool"> here</ExternalLink>
          </Trans>
        )

      case TutorialType.ELASTIC_INCREASE_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to increase liquidity to KyberSwap Elastic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/increase-liquidity"> here</ExternalLink>
          </Trans>
        )

      case TutorialType.ELASTIC_REMOVE_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to remove liquidity on KyberSwap Elastic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/remove-liquidity"> here</ExternalLink>
          </Trans>
        )

      default:
        return undefined
    }
  })()

  const videoId = (() => {
    switch (props.type) {
      case TutorialType.ELASTIC_POOLS:
        return 'HCTI3pNDXIM'
      case TutorialType.CLASSIC_POOLS:
        return 'HCTI3pNDXIM'
      case TutorialType.ELASTIC_MY_POOLS:
        return 'gANTlasXStA'
      case TutorialType.CLASSIC_MY_POOLS:
        return 'gANTlasXStA'
      case TutorialType.ELASTIC_ADD_LIQUIDITY:
        return 'EyFOiR1httA'
      case TutorialType.ELASTIC_REMOVE_LIQUIDITY:
        return 'VE58XeRVXgQ'
      case TutorialType.ELASTIC_INCREASE_LIQUIDITY:
        return 'goMNh3hsjt4'
      case TutorialType.SWAP:
        return '1cW_IhT4_dw'

      case TutorialType.ELASTIC_FARMS:
        return 'eWHTX5jrib8'
      case TutorialType.CLASSIC_FARMS:
        return 'FoQRGcf5tJc'
      case TutorialType.CLASSIC_CREATE_POOL:
        return 'wIMzSIKXUbs'
      case TutorialType.CLASSIC_ADD_LIQUIDITY:
        return '9Pudw0LqBQE'
      default:
        return ''
    }
  })()

  return (
    <>
      {props.customIcon ? (
        <div onClick={() => setShow(true)}>
          <MouseoverTooltip text={t`Tutorial`} placement="top" width="fit-content">
            {props.customIcon}
          </MouseoverTooltip>
        </div>
      ) : (
        <Btn onClick={() => setShow(true)}>
          <MouseoverTooltip text={t`Tutorial`} placement="top" width="fit-content">
            <TutorialIcon />
          </MouseoverTooltip>
        </Btn>
      )}

      <Modal isOpen={show} onDismiss={() => setShow(false)} maxWidth="808px" maxHeight={80} minHeight={50}>
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontWeight="500">{title}</Text>

            <ButtonEmpty onClick={() => setShow(false)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
          {subTitle && (
            <Text color={theme.subText} fontSize={12} marginTop="24px" marginBottom="16px">
              {subTitle}
            </Text>
          )}
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            title="Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </ModalContentWrapper>
      </Modal>
    </>
  )
}

export default Tutorial
