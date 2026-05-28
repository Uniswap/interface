import UIKit
import Expo
import ExpoModulesCore
import React
import ReactAppDependencyProvider
import Firebase
import ReactNativePerformance
import RNBootSplash
import UserNotifications

@main
class AppDelegate: ExpoAppDelegate {

  static let hasLaunchedOnceKey = "HasLaunchedOnce"

  var window: UIWindow?
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: ExpoReactNativeFactory?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    print("🚀 AppDelegate: Starting initialization")

    // Must be first line in startup routine
    ReactNativePerformance.onAppStarted()
    print("📊 ReactNativePerformance started")

    // Handle keychain cleanup on first launch
    handleKeychainCleanup()
    print("🔐 Keychain cleanup completed")

    // Configure Firebase
    FirebaseApp.configure()
    print("🔥 Firebase configured")

    // Handle OneSignal deep linking
    var newLaunchOptions = launchOptions ?? [:]
    if let remoteNotif = launchOptions?[UIApplication.LaunchOptionsKey.remoteNotification] as? [String: Any],
      let custom = remoteNotif["custom"] as? [String: Any],
      let initialURL = custom["u"] as? String,
      launchOptions?[UIApplication.LaunchOptionsKey.url] == nil {
      newLaunchOptions[UIApplication.LaunchOptionsKey.url] = URL(string: initialURL)
      print("🔗 OneSignal deep link processed")
    }

    // Set up Expo React Native factory
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "Uniswap",
      in: window,
      launchOptions: newLaunchOptions
    )

    let result = super.application(application, didFinishLaunchingWithOptions: newLaunchOptions)

    print("🏁 AppDelegate initialization complete")
    return result
  }

  // MARK: - Keychain Cleanup
  private func handleKeychainCleanup() {
    let defaults = UserDefaults.standard
    let isFirstRun = !defaults.bool(forKey: AppDelegate.hasLaunchedOnceKey)
    let canClearKeychainOnReinstall = KeychainUtils.getCanClearKeychainOnReinstall()

    if canClearKeychainOnReinstall && isFirstRun {
      KeychainUtils.clearKeychain()
    }

    if !canClearKeychainOnReinstall || isFirstRun {
      defaults.set(true, forKey: AppDelegate.hasLaunchedOnceKey)
      KeychainUtils.setCanClearKeychainOnReinstall()
    }
  }

  // MARK: - Deep Linking
  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }

  // MARK: - Push Notifications
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Handle device token registration
    // OneSignal and other services will handle this via swizzling
  }

  override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    // Handle registration failure
    print("Failed to register for remote notifications: \(error)")
  }

  override func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    if let aps = userInfo["aps"] as? [String: Any] {
      let contentAvailable = aps["content-available"] ?? aps["content_available"]
      
      if let contentNumber = contentAvailable as? NSNumber, contentNumber.intValue == 1 {
        // Convert obj-c payload to SilentPushEventEmitter
        let payload = userInfo.reduce(into: [String: Any]()) { result, entry in
          if let key = entry.key as? String {
            result[key] = entry.value
          }
        }
        
        SilentPushEventEmitter.emitEvent(with: payload)
      }
    }
    completionHandler(.noData)
  }

  // MARK: - Security
  @objc(application:shouldAllowExtensionPointIdentifier:)
  func application(_ application: UIApplication, shouldAllowExtensionPointIdentifier extensionPointIdentifier: UIApplication.ExtensionPointIdentifier) -> Bool {
    // Disable 3rd party keyboards
    if extensionPointIdentifier == .keyboard {
        return false
    }
    return true
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  // Override customize to initialize RNBootSplash BEFORE the window becomes visible
  public override func customize(_ rootView: UIView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("SplashScreen", rootView: rootView)
  }
}
