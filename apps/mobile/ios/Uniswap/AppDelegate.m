#import "AppDelegate.h"

#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

#import "Uniswap-Swift.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <ReactNativePerformance/ReactNativePerformance.h>
#import <RCTAppSetupUtils.h>
#import <RNBootSplash.h>

@implementation AppDelegate

static NSString *const hasLaunchedOnceKey = @"HasLaunchedOnce";

/**
 * Handles keychain cleanup on first run of the app. 
 * A migration flag is persisted in the keychain to avoid clearing the keychain for existing users, while the first run flag is saved in NSUserDefaults, which is cleared every install. 
 */
- (void)handleKeychainCleanup {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    BOOL isFirstRun = ![defaults boolForKey:hasLaunchedOnceKey];
    BOOL canClearKeychainOnReinstall = [KeychainUtils getCanClearKeychainOnReinstall];
    
    if (canClearKeychainOnReinstall && isFirstRun) {
        [KeychainUtils clearKeychain];
    }
    
    if (!canClearKeychainOnReinstall || isFirstRun) {
        [defaults setBool:YES forKey:hasLaunchedOnceKey];
        [KeychainUtils setCanClearKeychainOnReinstall];
    }
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Must be first line in startup routine
  [ReactNativePerformance onAppStarted];

  [self handleKeychainCleanup];

  [FIRApp configure];

  // This is needed so universal links opened from OneSignal notifications navigate to the proper page.
  // More details here:
  // https://documentation.onesignal.com/v7.0/docs/react-native-sdk in the deep linking warning section.
  NSMutableDictionary *newLaunchOptions = [NSMutableDictionary dictionaryWithDictionary:launchOptions];
  if (launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
    NSDictionary *remoteNotif = launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey];
    if (remoteNotif[@"custom"] && remoteNotif[@"custom"][@"u"]) {
        NSString *initialURL = remoteNotif[@"custom"][@"u"];
        if (!launchOptions[UIApplicationLaunchOptionsURLKey]) {
            newLaunchOptions[UIApplicationLaunchOptionsURLKey] = [NSURL URLWithString:initialURL];
        }
    }
  }
  
  self.moduleName = @"Uniswap";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.initialProps = @{};
  
  [self.window makeKeyAndVisible];
  
  if (@available(iOS 13.0, *)) {
    self.window.rootViewController.view.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    self.window.rootViewController.view.backgroundColor = [UIColor whiteColor];
  }
  
  [super application:application didFinishLaunchingWithOptions:newLaunchOptions];
  
  [[RCTI18nUtil sharedInstance] allowRTL:NO];
  [RNBootSplash initWithStoryboard:@"SplashScreen" rootView:self.window.rootViewController.view];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

// Enable deep linking
- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Enable universal links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

// Disable 3rd party keyboard
-(BOOL)application:(UIApplication *)application shouldAllowExtensionPointIdentifier:(NSString *)extensionPointIdentifier
{
  if (extensionPointIdentifier == UIApplicationKeyboardExtensionPointIdentifier)
  {
      return NO;
  }

  return YES;
}

- (void)application:(UIApplication *)application
    didReceiveRemoteNotification:(NSDictionary *)userInfo
          fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  NSDictionary *aps = userInfo[@"aps"];
  NSNumber *contentAvailable = aps[@"content-available"] ?: aps[@"content_available"];
  if (contentAvailable != nil && contentAvailable.integerValue == 1) {
    [SilentPushEventEmitter emitEventWithPayload:userInfo ?: @{}];
  }
  completionHandler(UIBackgroundFetchResultNoData);
}

@end
