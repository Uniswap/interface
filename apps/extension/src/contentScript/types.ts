/* eslint-disable @typescript-eslint/naming-convention */
export enum WindowEventType {
  UniswapExtensionExists = 'uniswapExtensionExists',
  sendMessage = 'sendMessage',
  handleEthSendTransaction = 'handleEthSendTransaction',
  handleEthSignTransaction = 'handleEthSignTransaction',
  handleEthSignMessage = 'handleEthSignMessage',
  handleEthRequestAccounts = 'handleEthRequestAccounts',
  handleEthSendTransactionResponse = 'handleEthSendTransactionResponse',
  handleEthSignTransactionResponse = 'handleEthSignTransactionResponse',
  handleEthSignMessageResponse = 'handleEthSignMessageResponse',
}

// map WindowEventType to how their data payload should look like
export type WindowEventPayload = {
  [WindowEventType.UniswapExtensionExists]: {
    // exists: boolean;
  }
  [WindowEventType.sendMessage]: {
    // message: string;
  }
  [WindowEventType.handleEthSendTransaction]: {
    transaction: any
    address: string
  }
  [WindowEventType.handleEthSignTransaction]: {}
  [WindowEventType.handleEthSignMessage]: {}
  [WindowEventType.handleEthRequestAccounts]: {}
  [WindowEventType.handleEthSendTransactionResponse]: {}
  [WindowEventType.handleEthSignTransactionResponse]: {}
  [WindowEventType.handleEthSignMessageResponse]: {}
}
