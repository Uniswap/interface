//
//  MnemonicDisplayView.swift
//  Uniswap
//
//  Created by Gary Ye on 8/31/23.
//

import SwiftUI

@objcMembers class MnemonicDisplayView: NSObject {
  private var vc = UIHostingController(rootView: MnemonicDisplay())
  
  static let storage = NSMutableDictionary()
  
  var mnemonicId: String {
    set { vc.rootView.setMnemonicId(mnemonicId: newValue) }
    get { return vc.rootView.props.mnemonicId }
  }
    
  var view: UIView {
    vc.view.backgroundColor = .clear
    return vc.view
  }
}

class MnemonicDisplayProps : ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var mnemonicWords: [String] = Array(repeating: "", count: 12)
}


struct MnemonicDisplay: View {
  
  @ObservedObject var props = MnemonicDisplayProps()
  
  let rnEthersRS = RNEthersRS()
  let interFont = UIFont(name: "Basel-Semibold", size: 20)
  
  func setMnemonicId(mnemonicId: String) {
    props.mnemonicId = mnemonicId
    if let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: mnemonicId) {
      props.mnemonicWords = mnemonic.components(separatedBy: " ")
    }
  }
  
  var body: some View {
    if (props.mnemonicWords.count > 12) {
      ScrollView {
        content
      }.fadeOutBottom(fadeLength: 50)
    } else {
      content
    }
  }
  
  @ViewBuilder
  var content: some View {
    let end = props.mnemonicWords.count - 1
    let middle = end / 2
    
    VStack(alignment: HorizontalAlignment.leading, spacing: 0) {
        HStack(alignment: VerticalAlignment.center, spacing: 12) {
          VStack(alignment: .leading, spacing: 12) {
            ForEach((0...middle), id: \.self) {index in
              MnemonicTextField(index: index + 1,
                                initialText: props.mnemonicWords[index]
              )
              .frame(maxWidth: .infinity, alignment: .leading)
            }
          }.frame(maxWidth: .infinity)
          VStack(alignment: .leading, spacing: 12) {
            ForEach((middle + 1...end), id: \.self) {index in
              MnemonicTextField(index: index + 1,
                                initialText: props.mnemonicWords[index]
              )
              .frame(maxWidth: .infinity, alignment: .leading)
            }
          }.frame(maxWidth: .infinity)
        }.frame(maxWidth: .infinity)
    }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .padding(EdgeInsets(top: 0, leading: 16, bottom: 32, trailing: 16))
  }
}
