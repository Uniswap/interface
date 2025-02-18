import UserNotifications
import OneSignalExtension
import Statsig

class NotificationService: UNNotificationServiceExtension {
    
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    let bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    let userInfo = request.content.userInfo
    
    // Fields per OneSignal docs
    let custom = userInfo["custom"] as? [String: Any]
    let additionalData = custom?["a"] as? [String: Any]
    
    let notificationType = additionalData?[Constants.fieldNotificationType] as? String
    let isGatedNotification = notificationType == Constants.typeUnfundedWallet
      || notificationType == Constants.typePriceAlert
    
    if (!isGatedNotification) {
      OneSignalExtension.didReceiveNotificationExtensionRequest(request, with: bestAttemptContent, withContentHandler: contentHandler)
      return
    }
    
    func handleGatedNotification() {
      let enabled: Bool
      switch notificationType {
        case Constants.typeUnfundedWallet:
          enabled = Statsig.checkGate(Constants.gateUnfundedWallet)
        case Constants.typePriceAlert:
          enabled = Statsig.checkGate(Constants.gatePriceAlert)
        default:
          enabled = true
      }
      
      // Passing in empty notification content will skip the notif
      OneSignalExtension.didReceiveNotificationExtensionRequest(
        request,
        with: enabled ? bestAttemptContent : UNMutableNotificationContent(),
        withContentHandler: contentHandler)
    }
    
    if (!Statsig.isInitialized()) {
      // The real sdk key is needed on iOS even though it's substituted in proxy
      // Because the key is used to hash the feature gate names and wouldn't work properly otherwise
      let statsigSdkKey = Env.STATSIG_API_KEY
      let statsigUser = StatsigUser(
        userID: UIDevice.current.identifierForVendor?.uuidString,
        custom: [
          "app": "mobile"
        ])
      
      Statsig.initialize(
        sdkKey: statsigSdkKey,
        user: statsigUser,
        options: StatsigOptions(
          environment: StatsigEnvironment(tier: getStatsigEnvironemntTier()),
          initializationURL: URL(string: "\(Constants.statsigProxyHost)/v1/statsig-proxy/initialize"),
          eventLoggingURL: URL(string: "\(Constants.statsigProxyHost)/v1/statsig-proxy/rgstr")
      )) { _errorMessage in
        handleGatedNotification()
      }
    } else {
      handleGatedNotification()
    }
  }
  
  func getStatsigEnvironemntTier() -> String {
    let bundleSuffix = Bundle.main.object(forInfoDictionaryKey: "BUNDLE_ID_SUFFIX") as? String
    
    switch bundleSuffix {
    case ".dev":
      return "development"
    case ".beta":
      return "beta"
    default:
      return "production"
    }
  }
}

struct Constants {
  static let statsigProxyHost = "https://gating.ios.wallet.gateway.uniswap.org"
  
  static let fieldNotificationType = "notification_type"
  
  static let typeUnfundedWallet = "unfunded_wallet_reminder"
  static let typePriceAlert = "price_alert"
  
  static let gateUnfundedWallet = "notification_unfunded_wallet_ios"
  static let gatePriceAlert = "notification_price_alerts_ios"
}
