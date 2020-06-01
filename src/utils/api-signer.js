import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { SUPPORTED_WALLETS } from '../constants'
import React from 'react'
import { injected } from '../connectors'

const host = 'https://api.defimoneymarket.com'

export const sessionId = uuidv4()

export const routes = {
  insertReferral: {
    method: 'POST',
    url: `${host}/v1/dmg-sale/insert-referral`,
  },
  insertEvent: {
    method: 'POST',
    url: `${host}/v1/analytics/insert-event`,
  },
  verifyPrivateSalePassword: {
    method: 'POST',
    url: `${host}/v1/dmg-sale/verify-password`,
  },
  getIpAddress: {
    method: 'GET',
    url: 'https://api.defimoneymarket.com/ip-address',
  }
}

export const createApiKeySignature = () => {
  const timestamp = new Date().getTime()
  const key = new Buffer(process.env.REACT_APP_ADMIN_API_KEY, 'utf-8')
  const hash = crypto
    .createHmac('sha256', key)
    .update(timestamp.toString(10))
    .digest('base64')
  return { signature: hash, timestamp }
}

export const getIpAddress = () => {
  return fetch(routes.getIpAddress.url)
    .then(result => result.json())
    .then(json => json['ip'])
}

export const getDefaultApiKeyHeaders = () => {
  const { signature, timestamp } = createApiKeySignature()
  return {
    'X-Dmm-Api-Signature': signature,
    'X-Dmm-Api-Timestamp': timestamp,
    'Content-Type': 'application/json'
  }
}

export const getConnectorName = (connector) => {
  const isMetaMask = window.ethereum && window.ethereum.isMetaMask
  return Object.keys(SUPPORTED_WALLETS)
    .filter(k => {
      return SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
    })
    .map(k => SUPPORTED_WALLETS[k].type)[0]
}
