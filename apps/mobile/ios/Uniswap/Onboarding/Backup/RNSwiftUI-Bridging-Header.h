//
//  RNSwiftUI-Bridging-Header.h
//  Uniswap
//
//  Created by Thomas Thachil on 8/3/22.
//
//

#ifndef RNSwiftUI_Bridging_Header_h
#define RNSwiftUI_Bridging_Header_h


#import "React/RCTViewManager.h"
#import "React/RCTConvert.h"
#import "React/RCTComponentData.h"
#import "React/RCTBridgeModule.h"
#import "React/UIView+React.h"

#define RCT_EXPORT_SWIFTUI_PROPERTY(name, type, proxyClass)                                                 \
RCT_CUSTOM_VIEW_PROPERTY(name, type, proxyClass) {                                                          \
  NSMutableDictionary *storage = [proxyClass storage];                                                    \
  proxyClass *proxy = storage[[NSValue valueWithNonretainedObject:view]];                                 \
  proxy.name = [RCTConvert type:json];                                                                  \
}

#define RCT_EXPORT_SWIFTUI_CALLBACK(name, type, proxyClass)                                                 \
RCT_REMAP_VIEW_PROPERTY(name, __custom__, type)                                                             \
- (void)set_##name:(id)json forView:(UIView *)view withDefaultView:(UIView *)defaultView RCT_DYNAMIC {      \
  NSMutableDictionary *storage = [proxyClass storage];                                                      \
  proxyClass *proxy = storage[[NSValue valueWithNonretainedObject:view]];                                   \
  void (^eventHandler)(NSDictionary *event) = ^(NSDictionary *event) {                                      \
  RCTComponentEvent *componentEvent = [[RCTComponentEvent alloc] initWithName:@""#name                      \
                                                                        viewTag:view.reactTag               \
                                                                           body:event];                     \
    [self.bridge.eventDispatcher sendEvent:componentEvent];                                                 \
  };                                                                                                        \
  proxy.name = eventHandler;                                                                                \
}

#endif /* RNSwiftUI_Bridging_Header_h */
