//
//  MnemonicDisplay.swift
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

import Foundation
import UIKit

class MnemonicDisplayView: UIView {
  
  @objc var address: String = ""
  
  override init(frame: CGRect) {
    super.init(frame: frame)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override public func layoutSubviews() {
    super.layoutSubviews()
    self.setupView()
  }
  
  private func setupView() {
    let rnEthersRs = RNEthersRS()

    guard let mnemonic = rnEthersRs.retrieveMnemonic(mnemonicId: address) else {
      let wordLabel = UILabel(frame: CGRect(x: 0, y: 0, width: 300, height: 50))
      wordLabel.text = "Error loading recovery phrase"
      wordLabel.textColor = UIColor.lightGray
      wordLabel.font = UIFont.init(name: "Inter-Regular", size: 16)
      wordLabel.textAlignment = .center
      self.addSubview(wordLabel)
      
      return
    }
  
    let mnemonicArray = mnemonic.components(separatedBy: " ")

    let parentStackView = UIStackView()
    parentStackView.translatesAutoresizingMaskIntoConstraints = false
    parentStackView.alignment = .fill
    parentStackView.axis = .horizontal
    parentStackView.distribution = .equalSpacing
    self.addSubview(parentStackView)
    
    let leftStackView = UIStackView()
    leftStackView.translatesAutoresizingMaskIntoConstraints = false
    leftStackView.alignment = .fill
    leftStackView.axis = .vertical
    leftStackView.distribution = .fillEqually
    leftStackView.spacing = 10
    parentStackView.addSubview(leftStackView)
    
    let rightStackView = UIStackView()
    rightStackView.translatesAutoresizingMaskIntoConstraints = false
    rightStackView.alignment = .fill
    rightStackView.axis = .vertical
    rightStackView.distribution = .fillEqually
    rightStackView.spacing = 10
    parentStackView.addSubview(rightStackView)
    
    let halfway = mnemonicArray.count/2
    for index in 0...halfway-1 {
      let wordView = MnemonicWordView(index: index+1, word: mnemonicArray[index])
      leftStackView.addArrangedSubview(wordView)
    }
    
    for index in halfway...mnemonicArray.count-1 {
      let wordView = MnemonicWordView(index: index+1, word: mnemonicArray[index])
      rightStackView.addArrangedSubview(wordView)
    }
    
    NSLayoutConstraint.activate([
      parentStackView.topAnchor.constraint(equalTo: self.topAnchor),
      parentStackView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
      parentStackView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
      parentStackView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
      
      leftStackView.heightAnchor.constraint(equalTo: parentStackView.heightAnchor),
      rightStackView.heightAnchor.constraint(equalTo: parentStackView.heightAnchor),
      leftStackView.widthAnchor.constraint(equalTo: rightStackView.widthAnchor),
      
      leftStackView.trailingAnchor.constraint(equalTo: rightStackView.leadingAnchor, constant: -20),
      leftStackView.leadingAnchor.constraint(equalTo: parentStackView.leadingAnchor),
      rightStackView.trailingAnchor.constraint(equalTo: parentStackView.trailingAnchor)
    ])
  }
}
