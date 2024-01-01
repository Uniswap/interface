// import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { toast, ToastContainer as ToastContainerBase } from 'react-toastify'
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
        <span style={{ fontWeight: 'bold', color: 'white', textAlign: 'center', fontSize: '1.3vw' }}>
          {props.title}
        </span>
      </div>
      <div>
        <span style={{ whiteSpace: 'pre', color: 'white', textAlign: 'center', fontSize: '0.9vw' }}>
          {props.description}
        </span>
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
          <span
            style={{ color: '#475dc0', textAlign: 'center', fontSize: '1vw', fontWeight: 'bold' }}
            onClick={() => window.open(props.ctaUrl, '_blank')}
          >
            {props.ctaText}
          </span>
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
      toastId: 'warofdex', // Prevent duplicate toasts // Closes windows on click
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
    position: 'absolute',
    bottom: 0,
    right: '0px',
  },
})``

const CloseButton = ({ closeToast }: any) => (
  <p className="toastify__close" style={{ color: 'white', marginTop: '2px', fontWeight: 'bold' }} onClick={closeToast}>
    X
  </p>
)

export default function ToastContainer() {
  const [closed, setClosed] = useState(false)
  return (
    <>
      {!closed && (
        <StyledToastContainer style={{ zIndex: 999 }} onClick={() => setClosed(true)} closeButton={CloseButton} />
      )}
    </>
  )
}
