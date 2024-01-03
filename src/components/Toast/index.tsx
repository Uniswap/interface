// import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { toast, ToastContainer as ToastContainerBase } from 'react-toastify'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { isMobile } from '../../utils/userAgent'

interface ToastInterface {
  title: string
  description: string
  imageUrl: string
  // could be anything, just make it different from other toast
  toastId: string
  ctaText?: string
  ctaUrl?: string
}

export const setToast = (props: ToastInterface) => {
  toast(
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        zIndex: 999,
      }}
    >
      <div className="" style={{ marginBottom: '10px', marginTop: '-5px' }}>
        <Text fontWeight={800} fontSize={17} style={{ whiteSpace: 'pre', color: 'white' }}>
          {props.title}
        </Text>
      </div>
      <div>
        <Text fontWeight={300} fontSize={13} style={{ whiteSpace: 'pre', color: 'white' }}>
          {props.description}
        </Text>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', width: '100%' }}>
        <div
          style={{
            width: '60%',
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'center',
            verticalAlign: 'middle',
          }}
        >
          <Text fontWeight={400} fontSize={15} style={{ color: '#475dc0' }}>
            {props.ctaText}
          </Text>
        </div>
        <div
          style={{
            width: '40%',
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            verticalAlign: 'middle',
            marginRight: '-50px',
          }}
        >
          <img src={props.imageUrl} style={{ display: 'block', marginRight: '-10px' }} width="100%" height="100%" />
        </div>
      </div>
    </div>,
    {
      position: isMobile ? 'top-center' : 'bottom-right',
      toastId: props.toastId, // Prevent duplicate toasts // Closes windows on click
      autoClose: false, // Prevents toast from auto closing
    }
  )
}

const StyledToastContainer = styled(ToastContainerBase).attrs({
  autoClose: false,
  position: isMobile ? 'top-center' : 'bottom-right',
  toastStyle: {
    background: '#1e1e1e',
    borderRadius: '15px',
    padding: '20px',
    width: '400px',
    height: '160px',
    marginBottom: '20px',
    // position: 'absolute',
    // right: '0px',
    // bottom: 0,
  },
})``

const CloseButton = ({ closeToast }: any) => (
  <p className="toastify__close" style={{ color: 'white', marginTop: '2px', fontWeight: 'bold' }} onClick={closeToast}>
    X
  </p>
)

export default function ToastContainer() {
  // const [closed, setClosed] = useState(false)
  const ResponsiveToastContainerStyle = isMobile
    ? {
        zIndex: 999,
        width: '100vw',
      }
    : {
        zIndex: 999,
        width: '400px',
      }
  return (
    <>
      <StyledToastContainer
        style={ResponsiveToastContainerStyle}
        // onClick={() => setClosed(true)}
        closeButton={CloseButton}
      />
    </>
  )
}
