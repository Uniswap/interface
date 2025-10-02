import { addWindowMessageListener } from 'src/background/messagePassing/messageUtils'
import {
  ETH_PROVIDER_CONFIG,
  isValidContentScriptToProxyEmission,
  isValidWindowEthereumConfigResponse,
  WindowEthereumConfigResponse,
} from 'src/contentScript/types'
import { WindowEthereumProxy } from 'src/contentScript/WindowEthereumProxy'
import { logger } from 'utilities/src/logger/logger'
import { v4 as uuid } from 'uuid'
import { defineContentScript } from 'wxt/utils/define-content-script'

declare global {
  interface Window {
    isStretchInstalled?: boolean
    // We declare this as readonly to force the use of `assignWindowEthereum` to override it.
    readonly ethereum?: unknown
  }
}

function makeEthereum(): void {
  // Guard against running in Node environment during WXT prepare
  if (typeof window === 'undefined') {
    return
  }
  // TODO(xtine): Get this working by importing the svg file directly. The svg text comes from packages/ui/src/assets/icons/uniswap-logo.svg
  const UNISWAP_LOGO = `data:image/svg+xml,${encodeURIComponent(`<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="96" height="96" rx="18" fill="#FEF4FF"/>
<g filter="url(#filter0_d_12393_20043)">
<path d="M71.9367 18.39C72.0482 16.4526 72.3145 15.1746 72.8497 14.0075C73.0616 13.5456 73.2601 13.1675 73.2907 13.1675C73.3214 13.1675 73.2293 13.5085 73.086 13.9252C72.6969 15.0578 72.633 16.607 72.901 18.4094C73.2413 20.6963 73.4348 21.0263 75.8841 23.4967C77.0329 24.6554 78.3692 26.1168 78.8536 26.7443L79.7343 27.8851L78.8536 27.0698C77.7764 26.0728 75.2992 24.1283 74.7521 23.8503C74.3852 23.6639 74.3306 23.6671 74.1043 23.8894C73.8958 24.0943 73.8519 24.4021 73.8229 25.8572C73.7778 28.125 73.4646 29.5807 72.7087 31.0362C72.2998 31.8234 72.2354 31.6554 72.6053 30.7668C72.8816 30.1034 72.9096 29.8117 72.9076 27.6163C72.9033 23.2052 72.3727 22.1447 69.2607 20.3281C68.4724 19.8678 67.1734 19.2041 66.3742 18.8531C65.575 18.502 64.9401 18.1962 64.9633 18.1734C65.0514 18.0868 68.0863 18.961 69.3077 19.4247C71.1247 20.1145 71.4247 20.2039 71.6454 20.1207C71.7933 20.0649 71.8648 19.6398 71.9367 18.39Z" fill="#F50DB4"/>
<path d="M33.5466 11.9727C32.4688 11.808 32.4233 11.7887 32.9306 11.7119C33.9026 11.5647 36.1979 11.7653 37.7796 12.1358C41.4722 13.0004 44.8322 15.2153 48.4188 19.1488L49.3717 20.1938L50.7348 19.978C56.4773 19.0689 62.3192 19.7914 67.2054 22.0148C68.5495 22.6265 70.6689 23.8441 70.9337 24.157C71.018 24.2568 71.173 24.8987 71.2779 25.5837C71.6408 27.9534 71.4591 29.7699 70.7234 31.1265C70.3229 31.8648 70.3006 32.0988 70.5698 32.7306C70.7847 33.2348 71.3838 33.608 71.9771 33.6072C73.1913 33.6056 74.4983 31.6721 75.1038 28.9818L75.3443 27.9131L75.8209 28.4448C78.4346 31.3619 80.4876 35.34 80.8403 38.1716L80.9321 38.9099L80.4928 38.2387C79.7366 37.0838 78.9769 36.2976 78.0041 35.6635C76.2504 34.5205 74.3961 34.1315 69.4853 33.8766C65.0501 33.6464 62.5399 33.2732 60.0509 32.4737C55.816 31.1137 53.6812 29.3023 48.6508 22.8012C46.4164 19.9135 45.0354 18.3159 43.6616 17.0293C40.5401 14.1058 37.4729 12.5726 33.5466 11.9727Z" fill="#F50DB4"/>
<path d="M35.6404 25.9564C33.4522 22.9889 32.0983 18.4391 32.3914 15.0379L32.482 13.9854L32.9801 14.0749C33.9155 14.243 35.5283 14.8343 36.2835 15.2861C38.3559 16.5259 39.253 18.1582 40.1658 22.3496C40.4332 23.5773 40.7839 24.9666 40.9454 25.437C41.2052 26.194 42.1871 27.9624 42.9854 29.1109C43.5605 29.938 43.1785 30.33 41.9074 30.217C39.9662 30.0444 37.3367 28.2568 35.6404 25.9564Z" fill="#F50DB4"/>
<path d="M69.2799 48.0419C59.0538 43.9862 55.4521 40.4658 55.4521 34.5259C55.4521 33.6517 55.4827 32.9365 55.5199 32.9365C55.5572 32.9365 55.9528 33.225 56.3991 33.5776C58.4728 35.216 60.7949 35.9157 67.2233 36.8395C71.0061 37.3831 73.1349 37.8222 75.0986 38.4637C81.3402 40.5027 85.2018 44.6406 86.1227 50.2766C86.3903 51.9143 86.2334 54.9854 85.7995 56.6039C85.457 57.8824 84.4118 60.1868 84.1346 60.2751C84.0578 60.2996 83.9824 60.0094 83.9626 59.6147C83.8575 57.4983 82.7718 55.438 80.9485 53.8946C78.8754 52.1399 76.0901 50.7428 69.2799 48.0419Z" fill="#F50DB4"/>
<path d="M62.1008 49.7268C61.9727 48.9758 61.7505 48.0167 61.607 47.5954L61.3461 46.8296L61.8307 47.3655C62.5014 48.107 63.0314 49.0559 63.4806 50.3197C63.8234 51.2843 63.862 51.5711 63.8594 53.1386C63.8568 54.6774 63.814 55 63.4974 55.8682C62.9983 57.2373 62.3788 58.208 61.3392 59.2501C59.4712 61.1228 57.0696 62.1596 53.6039 62.5896C53.0015 62.6643 51.2456 62.7902 49.7019 62.8693C45.8118 63.0686 43.2515 63.4803 40.9508 64.276C40.6201 64.3905 40.3247 64.4601 40.2948 64.4305C40.2017 64.3393 41.768 63.4195 43.0618 62.8056C44.8862 61.94 46.7021 61.4676 50.7709 60.8002C52.7809 60.4704 54.8566 60.0704 55.3837 59.9112C60.3612 58.4079 62.9197 54.5286 62.1008 49.7268Z" fill="#F50DB4"/>
<path d="M66.7886 57.9275C65.4299 55.0505 65.1179 52.2726 65.8623 49.6821C65.942 49.4053 66.07 49.1787 66.1471 49.1787C66.224 49.1787 66.5447 49.3495 66.8594 49.5581C67.4855 49.9732 68.7412 50.6725 72.0866 52.4692C76.2612 54.7111 78.6414 56.4472 80.2599 58.4306C81.6775 60.1677 82.5547 62.1459 82.9769 64.5583C83.2159 65.9248 83.0759 69.2128 82.7199 70.5889C81.5975 74.9275 78.9889 78.3356 75.2682 80.3242C74.7231 80.6155 74.2337 80.8547 74.1807 80.8558C74.1278 80.8569 74.3264 80.3594 74.6222 79.7503C75.8738 77.173 76.0163 74.6661 75.07 71.8756C74.4906 70.1671 73.3092 68.0823 70.924 64.5588C68.1507 60.4623 67.4708 59.3721 66.7886 57.9275Z" fill="#F50DB4"/>
<path d="M28.3782 73.4506C32.173 70.2943 36.8948 68.0521 41.1958 67.3639C43.0494 67.0672 46.1372 67.185 47.8537 67.6178C50.605 68.3113 53.0662 69.8648 54.3462 71.7156C55.5971 73.5245 56.1338 75.1008 56.6925 78.6081C56.913 79.9916 57.1527 81.3809 57.2252 81.6954C57.6449 83.5131 58.4614 84.966 59.4733 85.6957C61.0805 86.8544 63.8479 86.9265 66.5704 85.8804C67.0325 85.7028 67.4336 85.5801 67.4618 85.6078C67.5605 85.7044 66.1896 86.6083 65.2225 87.0842C63.9212 87.7245 62.8864 87.972 61.5115 87.972C59.0181 87.972 56.948 86.7226 55.2206 84.175C54.8807 83.6736 54.1167 82.1718 53.5228 80.8378C51.699 76.7403 50.7984 75.4921 48.6809 74.126C46.8381 72.9374 44.4615 72.7245 42.6736 73.588C40.325 74.7223 39.6698 77.6786 41.3518 79.5521C42.0204 80.2967 43.2671 80.939 44.2865 81.0638C46.1936 81.2975 47.8326 79.8684 47.8326 77.9717C47.8326 76.7402 47.352 76.0374 46.1423 75.4996C44.4901 74.7652 42.7141 75.6237 42.7226 77.1526C42.7263 77.8045 43.0145 78.214 43.6779 78.5097C44.1036 78.6994 44.1134 78.7144 43.7664 78.6434C42.2504 78.3337 41.8952 76.5335 43.1141 75.3383C44.5776 73.9036 47.6037 74.5367 48.6428 76.4951C49.0794 77.3177 49.1301 78.956 48.7495 79.9452C47.8976 82.1593 45.4138 83.3237 42.8941 82.6901C41.1787 82.2587 40.4801 81.7915 38.4119 79.6931C34.8179 76.0462 33.4226 75.3396 28.2413 74.5428L27.2484 74.3902L28.3782 73.4506Z" fill="#F50DB4"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5147 8.18128C23.517 22.5305 31.7835 28.4507 32.7022 29.7015C33.4607 30.7343 33.1752 31.6628 31.8758 32.3905C31.1532 32.7951 29.6676 33.205 28.9238 33.205C28.0825 33.205 27.7936 32.8853 27.7936 32.8853C27.3058 32.4296 27.0311 32.5093 24.5261 28.1293C21.0483 22.8137 18.1379 18.4041 18.0585 18.3303C17.8749 18.1596 17.878 18.1653 24.1715 29.2574C25.1883 31.5693 24.3737 32.4179 24.3737 32.7471C24.3737 33.417 24.1882 33.7691 23.3494 34.6907C21.951 36.2274 21.3259 37.954 20.8746 41.5274C20.3687 45.5332 18.9462 48.3629 15.0041 53.2057C12.6965 56.0406 12.3189 56.5602 11.7366 57.7028C11.0032 59.1416 10.8015 59.9475 10.7198 61.7645C10.6334 63.6855 10.8016 64.9265 11.3975 66.7632C11.9191 68.3712 12.4636 69.433 13.8555 71.5567C15.0568 73.3894 15.7484 74.7513 15.7484 75.2841C15.7484 75.708 15.8306 75.7085 17.692 75.2945C22.1466 74.3036 25.7638 72.5609 27.7981 70.4252C29.0571 69.1033 29.3527 68.3733 29.3623 66.5619C29.3686 65.377 29.3263 65.1289 29.0011 64.4473C28.4718 63.3379 27.5083 62.4154 25.3845 60.9853C22.6019 59.1115 21.4133 57.603 21.085 55.5285C20.8157 53.8263 21.1282 52.6253 22.6676 49.4472C24.2609 46.1575 24.6558 44.7557 24.9229 41.4399C25.0954 39.2977 25.3343 38.4528 25.9591 37.7747C26.6108 37.0676 27.1975 36.8281 28.8103 36.611C31.4396 36.2572 33.1139 35.5871 34.4901 34.3379C35.6839 33.2543 36.1835 32.2101 36.2602 30.6382L36.3184 29.4468L35.6512 28.6806C33.2352 25.9057 9.89667 6 9.74799 6C9.71623 6 10.5113 6.98164 11.5147 8.18128ZM17.1047 63.9381C17.6509 62.9852 17.3607 61.7601 16.447 61.1617C15.5836 60.5962 14.2424 60.8625 14.2424 61.5994C14.2424 61.8243 14.3687 61.9879 14.6532 62.1322C15.1322 62.375 15.167 62.648 14.7901 63.2061C14.4084 63.7712 14.4392 64.2681 14.877 64.6057C15.5826 65.15 16.5815 64.8507 17.1047 63.9381Z" fill="#F50DB4"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M37.9777 37.236C36.7433 37.6095 35.5435 38.8981 35.172 40.2493C34.9454 41.0736 35.074 42.5196 35.4134 42.9662C35.9617 43.6874 36.492 43.8774 37.9277 43.8675C40.7388 43.8482 43.1825 42.6606 43.4666 41.176C43.6994 39.9591 42.6262 38.2726 41.1478 37.5321C40.385 37.1502 38.7626 36.9987 37.9777 37.236ZM41.2638 39.7671C41.6973 39.1604 41.5076 38.5047 40.7704 38.0611C39.3664 37.2167 37.2432 37.9155 37.2432 39.222C37.2432 39.8724 38.3504 40.5819 39.3653 40.5819C40.0408 40.5819 40.9652 40.1851 41.2638 39.7671Z" fill="#F50DB4"/>
</g>
</svg>`)}`
  const UNISWAP_NAME = 'Uniswap Extension'
  const UNISWAP_RDNS = 'org.uniswap.app'

  enum EIP6963EventNames {
    Announce = 'eip6963:announceProvider',
    Request = 'eip6963:requestProvider',
  }

  interface EIP6963ProviderInfo {
    uuid: string
    name: string
    icon: string
    rdns: string
  }

  function assignWindowEthereum(provider: unknown): void {
    try {
      // We need to try/catch this because some sneaky wallet extensions set `window.ethereum` to a getter,
      // which throws an error when trying to override it.
      // In these cases, our wallet will only work with dapps that suppport EIP-6963.
      // @ts-expect-error: we're intentionally trying to override this.
      window.ethereum = provider
    } catch (error) {
      if (__DEV__) {
        // Only log in dev env for debugging purposes to avoid spamming DD with these errors.
        // eslint-disable-next-line no-restricted-syntax
        logger.error(error, { tags: { file: 'ethereum.ts', function: 'assignWindowEthereum' } })
      }
    }
  }

  const oldProvider = window.ethereum

  const uniswapProvider = new WindowEthereumProxy()
  assignWindowEthereum(uniswapProvider)

  addWindowMessageListener({
    validator: isValidContentScriptToProxyEmission,
    handler: (message) => {
      logger.debug('ethereum.ts', `Emitting ${message.emitKey} via WindowEthereumProxy`, message.emitValue)
      uniswapProvider.emit(message.emitKey, message.emitValue)
    },
  })

  const providerUuid = uuid()

  function announceProvider(): void {
    const info: EIP6963ProviderInfo = {
      uuid: providerUuid,
      name: UNISWAP_NAME,
      icon: UNISWAP_LOGO,
      rdns: UNISWAP_RDNS,
    }

    window.dispatchEvent(
      new CustomEvent(EIP6963EventNames.Announce, {
        detail: Object.freeze({ info, provider: uniswapProvider }),
      }),
    )
  }

  const handle6963Request = (event: Event): void => {
    if (!isValidRequestProviderEvent(event)) {
      throw new Error(
        `Invalid EIP-6963 RequestProviderEvent object received from ${EIP6963EventNames.Request} event. See https://eips.ethereum.org/EIPS/eip-6963 for requirements.`,
      )
    }

    announceProvider()
  }

  const create6963Listener = (): void => {
    // remove the old listener if present
    window.removeEventListener(EIP6963EventNames.Request, handle6963Request)

    window.addEventListener(EIP6963EventNames.Request, handle6963Request)

    announceProvider()
  }

  create6963Listener()

  // override logic impl details in src/app/utils/provider.ts
  // get config from sister content script
  addWindowMessageListener<WindowEthereumConfigResponse>({
    validator: isValidWindowEthereumConfigResponse,
    handler: async (request) => {
      const isDefaultProvider = request.config.isDefaultProvider

      // if default provider is false, restore old provider for 1193 and unspoof 6963 provider
      if (isDefaultProvider === false) {
        uniswapProvider.isMetaMask = false
        if (oldProvider) {
          assignWindowEthereum(oldProvider)
          create6963Listener()
        }
      }
    },
    options: { removeAfterHandled: true },
  })

  window.postMessage({ type: ETH_PROVIDER_CONFIG.REQUEST })

  type EIP6963RequestProviderEvent = Event & {
    type: EIP6963EventNames.Request
  }

  function isValidRequestProviderEvent(event: unknown): event is EIP6963RequestProviderEvent {
    return event instanceof Event && event.type === EIP6963EventNames.Request
  }
}

// eslint-disable-next-line import/no-unused-modules
export default defineContentScript({
  matches:
    __DEV__ || process.env.BUILD_ENV === 'dev'
      ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
      : ['https://*/*'],
  runAt: 'document_start',
  // TODO(INFRA-1010): not supported by firefox
  world: 'MAIN',
  main() {
    makeEthereum()
  },
})
