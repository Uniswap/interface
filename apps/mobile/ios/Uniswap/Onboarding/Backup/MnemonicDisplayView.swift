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
  
  var copyText: String {
    set { vc.rootView.props.copyText = newValue }
    get { return vc.rootView.props.copyText }
  }
  
  var copiedText: String {
    set { vc.rootView.props.copiedText = newValue }
    get { return vc.rootView.props.copiedText }
  }
  
  var onHeightMeasured: RCTDirectEventBlock? {
    didSet {
      vc.rootView.props.onHeightMeasured = { [weak self] height in
        self?.onHeightMeasured?([ "height": height ])
      }
    }
  }

  var onEmptyMnemonic: RCTDirectEventBlock? {
    didSet {
      vc.rootView.props.onEmptyMnemonic = { [weak self] mnemonicId in
        self?.onEmptyMnemonic?(["mnemonicId": mnemonicId])
      }
    }
  }
  
  var view: UIView {
    vc.view.backgroundColor = .clear
    return vc.view
  }
}

class MnemonicDisplayProps: ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var copyText: String = ""
  @Published var copiedText: String = ""
  @Published var mnemonicWords: [String] = Array(repeating: "", count: 12)
  var onHeightMeasured: ((CGFloat) -> Void)?
  var onEmptyMnemonic: ((String) -> Void)?
}

struct MnemonicDisplay: View {
  @ObservedObject var props = MnemonicDisplayProps()
  @State private var buttonPadding: CGFloat = 20
  
  let rnEthersRS = RNEthersRS()
  let interFont = UIFont(name: "BaselGrotesk-Medium", size: 20)
  
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
    
    VStack(alignment: .leading, spacing: 0) {
      ZStack {
        HStack(alignment: .center, spacing: 24) {
          VStack(alignment: .leading, spacing: 8) {
            ForEach((0...middle), id: \.self) { index in
              MnemonicTextField(index: index + 1,
                                word: props.mnemonicWords[index]
              )
              .frame(maxWidth: .infinity, alignment: .leading)
            }
          }.frame(maxWidth: .infinity)
          VStack(alignment: .leading, spacing: 8) {
            ForEach((middle + 1...end), id: \.self) { index in
              MnemonicTextField(index: index + 1,
                                word: props.mnemonicWords[index]
              )
              .frame(maxWidth: .infinity, alignment: .leading)
            }
          }.frame(maxWidth: .infinity)
        }
      }
      .frame(maxWidth: .infinity)
      .padding(EdgeInsets(top: 24, leading: 32, bottom: 24, trailing: 32))
      .background(Colors.surface2)
      .cornerRadius(20)
      .overlay(
        RoundedRectangle(cornerRadius: 20)
          .stroke(Colors.surface3, lineWidth: 1)
      )
      .overlay(
        HStack {
          Spacer()
          RelativeOffsetView(y: -0.5, onOffsetCalculated: { _, offsetY in
            buttonPadding = abs(offsetY)
          }) {
            CopyButton(
              copyButtonText: props.copyText,
              copiedButtonText: props.copiedText,
              textToCopy: props.mnemonicWords.joined(separator: " ")
            )
          }
          Spacer()
        },
        alignment: .top
      )
    }
    .frame(maxWidth: .infinity, alignment: .top)
    .padding(.top, buttonPadding)
    .overlay(
      GeometryReader { geometry in
        Color.clear
          .onAppear {
            props.onHeightMeasured?(geometry.size.height)
          }
          .onChange(of: geometry.size.height) { newValue in
            props.onHeightMeasured?(newValue)
          }
      }
    )
    .onAppear {
      if props.mnemonicWords.isEmpty || props.mnemonicWords.allSatisfy({ $0.isEmpty }) {
        props.onEmptyMnemonic?(props.mnemonicId)
      }
    }
  }
}
