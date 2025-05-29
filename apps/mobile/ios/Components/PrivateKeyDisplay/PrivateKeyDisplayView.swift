//
//  PrivateKeyDisplayView.swift
//  Uniswap
//
//  Created by Chris Lee on 5/9/2025.
//
import React
import SwiftUI

@objcMembers class PrivateKeyDisplayView: UIView {
  static let storage = NSMutableDictionary()

  private var vc = UIHostingController(rootView: PrivateKeyDisplay())

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    vc.view.translatesAutoresizingMaskIntoConstraints = false
    vc.view.backgroundColor = .clear
    addSubview(vc.view)
    NSLayoutConstraint.activate([
      vc.view.topAnchor.constraint(equalTo: topAnchor),
      vc.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      vc.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      vc.view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  } 
  
  @objc
  var address: String {
    set { vc.rootView.setAddress(address: newValue) }
    get { return vc.rootView.props.address }
  }

  @objc
  var onHeightMeasured: RCTDirectEventBlock {
    set { vc.rootView.props.onHeightMeasured = newValue }
    get { return vc.rootView.props.onHeightMeasured }
  }
}

class PrivateKeyDisplayProps: ObservableObject {
  @Published var address: String = ""
  @Published var privateKey: String = ""
  @Published var height: CGFloat = 0
  var onHeightMeasured: RCTDirectEventBlock = { _ in }
}

struct PrivateKeyDisplay: View {
  @ObservedObject var props = PrivateKeyDisplayProps()
  @State private var buttonPadding: CGFloat = 20
  
  let rnEthersRS = RNEthersRS()
  let interFont = UIFont(name: "BaselGrotesk-Medium", size: 14)
  
  func setAddress(address: String) {
    props.address = address
    props.privateKey = rnEthersRS.retrievePrivateKey(address: address) ?? ""
  }
  
  var body: some View {
    HStack(spacing: 0) {
      Text(props.privateKey)
        .font(.system(.body, design: .monospaced))
        .lineLimit(nil)
        .fixedSize(horizontal: false, vertical: true)
        .padding(.trailing, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
      CopyIconButton(
        textToCopy: props.privateKey
      )
    }
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .overlay(
      RoundedRectangle(cornerRadius: 12)
        .stroke(Colors.surface3, lineWidth: 1)
    )
    .background(Colors.surface2)
    .cornerRadius(12)
    .overlay(
      GeometryReader { geometry in
        Color.clear
          .onAppear {
            props.onHeightMeasured(["height": geometry.size.height])
          }
          .onChange(of: geometry.size.height) { newValue in
            props.onHeightMeasured(["height": newValue])
          }
      }
    )
  }
}
