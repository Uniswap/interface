import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

interface QRCodeHandlerProps {
  data: string
  onSuccess?: () => void
  onFail?: () => void
}

export default function QRCodeHandler({ data, onSuccess, onFail }: QRCodeHandlerProps) {
  const [qrCodeDataURL, setQRCodeDataURL] = useState('')

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(data)
        setQRCodeDataURL(url)
      } catch (err) {
        console.error('Error generating QR Code:', err)
      }
    }

    if (data) {
      generateQRCode()
      const url = new URL(JSON.parse(data).body.callbackUrl)
      console.log(JSON.parse(data))
      const sessionId = url.searchParams.get('sessionId')
      if (sessionId) {
        const interval = setInterval(async () => {
          try {
            const response = await fetch(`https://verifier-v2.polygonid.me/api/status?id=${sessionId}`)
            console.log(`Response status: ${response.status}`)
            if (response.status === 200) {
              onSuccess && onSuccess()
              clearInterval(interval)
            }
          } catch (error) {
            onFail && onFail()
            clearInterval(interval)
          }
        }, 3000)
        return () => {
          clearInterval(interval)
        }
      }
    }
    return
  }, [data, onSuccess, onFail])

  return (
    <Container>
      <img src={qrCodeDataURL} alt="Generated QR Code" />
    </Container>
  )
}
