export enum PortName {
    Popup = 'popup',
    Store = 'store',
}




export enum MessageType {
    GetLocalStorage = "getLocalStorage",
    SetLocalStorage = "setLocalStorage",
    SendTransaction = "sendTransaction",
    SendTransactionResponse = "sendTransactionResponse",
    UndoTransaction = "undoTransaction",
    ScriptInjectionAlert = "scriptInjectionAlert",
    UpdateIcon = "updateIcon",
    UpdateNotifications = "UpdateNotifications",
    ViewNotificationData = "ViewNotificationData",
    SignMessage = "SignMessage",
    SignTransaction = "SignTransaction",
    SignedTransaction = "SignedTransaction",
    SignMessageResponse = "SignMessageResponse",
    ValidatePassword = "ValidatePassword"
}
