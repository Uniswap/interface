#import "RCTThemeModule.h"
#import <React/RCTConvert.h>

@implementation ThemeModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setColorScheme : (NSString *)style) {
  UIUserInterfaceStyle userInterfaceStyle;

  if ([style isEqualToString:@"dark"]) {
    userInterfaceStyle = UIUserInterfaceStyleDark;
  } else if ([style isEqualToString:@"light"]) {
    userInterfaceStyle = UIUserInterfaceStyleLight;
  } else {
    userInterfaceStyle = UIUserInterfaceStyleUnspecified;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    for (UIWindow *window in [UIApplication sharedApplication].windows) {
      window.overrideUserInterfaceStyle = userInterfaceStyle;
    }
  });
}

@end
