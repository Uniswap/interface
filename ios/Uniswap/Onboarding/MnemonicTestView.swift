//
//  MnemonicTestView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/1/22.
//

import React
import SwiftUI

@objcMembers class MnemonicTestView: NSObject {
  private var vc = UIHostingController(rootView: MnemonicTest())
    
    static let storage = NSMutableDictionary()

   var mnemonicId: String {
     set { vc.rootView.props.mnemonicId = newValue }
     get { return vc.rootView.props.mnemonicId }
   }

   var onTestComplete: RCTDirectEventBlock {
     set { vc.rootView.props.onTestComplete = newValue }
     get { return vc.rootView.props.onTestComplete }
   }
    
    var view: UIView {
      return vc.view
    }
}

class MnemonicTestProps : ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var onTestComplete: RCTDirectEventBlock = { _ in }
}

struct MnemonicTest: View {
    
    @ObservedObject var props = MnemonicTestProps()
    
    var body: some View {

      //TODO: Update this to proper seed phrase test UI
        VStack() {
            Text("Recovery phrase test")
                .font(.largeTitle).foregroundColor(Color.black)
                .padding([.top, .bottom], 40)
            Button("Continue") {
              
              self.props.onTestComplete(["complete": "yes"])
            }
                .foregroundColor(.white)
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .center)
                .background(Color.blue)
                .cornerRadius(16)
                .padding(24)
        }
    }
}
