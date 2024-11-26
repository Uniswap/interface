//
//  SeedPhraseInputManager.swift
//  Uniswap
//
//  Created by Gary Ye on 9/15/23.
//

// Using a view manager written in Swift instead of bridging headers
// because couldn't get RCT_EXTERN_METHOD to work with that approach
@objc(SeedPhraseInputManager)
class SeedPhraseInputManager: RCTViewManager {

  override func view() -> UIView! {
    return SeedPhraseInputView()
  }
  
  // Required by RN to initialize on main thread
  override class func requiresMainQueueSetup() -> Bool {
    true
  }
  
  @objc func handleSubmit(_ node: NSNumber) -> Void {
    DispatchQueue.main.async {
      let component = self.bridge.uiManager.view(
        forReactTag: node
      ) as? SeedPhraseInputView
      component?.handleSubmit()
      // TODO garydebug add error logging for view not found
    }
  }
}
