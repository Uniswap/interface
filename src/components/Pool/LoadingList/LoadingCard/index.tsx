import React from 'react'
import styled from 'styled-components'
import Skeleton from 'react-loading-skeleton'
import { DarkCard } from '../../../Card'
import { Box, Flex } from 'rebass'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import { useWindowSize } from '../../../../hooks/useWindowSize'
import { MEDIA_WIDTHS } from '../../../../theme'

const SizedCard = styled(DarkCard)<{ isMobile: boolean }>`
  width: 100%;
  height: 80px;
  padding: 17px 20px;
  ${props =>
    props.isMobile &&
    `
   height:128px;
       overflow: hidden;
  `};
`
const MobileHidden = styled(Box)<{ isMobile: boolean }>`
  display: flex;
  align-items: center;
  min-width: auto !important;
  ${props =>
    props.isMobile &&
    `
    display: none;
  `};
`
const DesktopHidden = styled(Box)<{ isMobile: boolean }>`
  display: none;
  ${props =>
    props.isMobile &&
    `
    display: block;
  `}
`
const ResponsiveLogoAndTextWrapper = styled(Flex)<{ isMobile: boolean }>`
  ${props =>
    props.isMobile &&
    `
   flex-direction:column;
   height:auto;
  `}
`
const BottomFlex = styled(Flex)<{ isMobile: boolean }>`
  width: 70%;

  ${props =>
    props.isMobile &&
    `
    align-self:flex-start;
    width:auto;
    
  `};
`
const ResponsiveText = styled(Flex)<{ isMobile: boolean }>`
  justify-content: flex-start;
  flex-direction: column;

  ${props =>
    props.isMobile &&
    `
   flex-direction:row;
   align-self: flex-start;
   margin-left:0 !important;
  `};
`

export default function LoadingCard({ isMobile }: { isMobile: boolean }) {
  const { width } = useWindowSize()

  const mobileLogic = isMobile ? true : width ? width < MEDIA_WIDTHS.upToExtraSmall : false

  return (
    <SizedCard isMobile={mobileLogic} selectable>
      <Flex alignItems="center" flexDirection="row" justifyContent="space-between" height="100%">
        <ResponsiveLogoAndTextWrapper
          isMobile={mobileLogic}
          height="100%"
          alignItems="center"
          justifyContent="flex-start"
        >
          <Flex>
            <Box>
              <DesktopHidden isMobile={mobileLogic}>
                <DoubleCurrencyLogo spaceBetween={-12} loading marginLeft={-101} top={-27} size={64} />
              </DesktopHidden>
              <MobileHidden isMobile={mobileLogic}>
                <DoubleCurrencyLogo spaceBetween={-12} loading size={45} />
              </MobileHidden>
            </Box>
          </Flex>

          <ResponsiveText isMobile={mobileLogic} ml="25px" height="100%">
            <Skeleton height="20px" width="35px" />

            <Skeleton height="20px" width="48px" />
          </ResponsiveText>
          <DesktopHidden isMobile={mobileLogic}>
            <Skeleton height="14px" width="132px" />
          </DesktopHidden>
        </ResponsiveLogoAndTextWrapper>
        <BottomFlex isMobile={mobileLogic} flexDirection="column">
          <DesktopHidden isMobile={mobileLogic}>
            <Skeleton height="14px" width="137px" />
          </DesktopHidden>
          <MobileHidden isMobile={mobileLogic} style={{ justifyContent: 'space-around' }}>
            <Flex flexDirection="column">
              <Skeleton height="12px" width="73px" />
              <Flex alignItems="center">
                <Skeleton height="15px" width="66px" />
                <Skeleton style={{ marginLeft: '4px' }} height="15px" width="65px" />
              </Flex>
            </Flex>

            <Flex flexDirection="column">
              <Skeleton height="12px" width="23px" />
              <Skeleton height="17px" width="91px" />
            </Flex>
            <Flex flexDirection="column">
              <Skeleton height="12px" width="79px" />
              <Skeleton height="17px" width="112px" />
            </Flex>
            <Flex flexDirection="column">
              <Skeleton height="12px" width="23px" />
              <Skeleton height="22px" width="48px" />
            </Flex>
          </MobileHidden>
        </BottomFlex>
      </Flex>
    </SizedCard>
  )
}
