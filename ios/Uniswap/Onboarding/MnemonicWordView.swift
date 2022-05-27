//
//  MnemonicWord.swift
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

import Foundation

class MnemonicWordView: UIView {
  private var index: Int?
  private var word: String?
  
  required init(index: Int, word: String) {
    super.init(frame: CGRect(x: 0, y: 0, width: 0, height: 0))
    self.index = index
    self.word = word
    self.setupView()
  }
  
  required override init(frame: CGRect) {
    super.init(frame: frame)
    self.setupView()
  }
  
  required init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
    self.setupView()
  }
  
  private func setupView() {
    self.layer.borderWidth = 1
    self.layer.backgroundColor = UIColor.clear.cgColor
    self.layer.cornerRadius = 20
    self.layer.masksToBounds = true
    
    let indexLabel = UILabel()
    indexLabel.text = String(describing: self.index!)
    indexLabel.adjustsFontSizeToFitWidth = true
    indexLabel.font = UIFont.init(name: "Inter-Regular", size: 16)
    
    let wordLabel = UILabel()
    wordLabel.text = self.word
    wordLabel.adjustsFontSizeToFitWidth = true
    wordLabel.font = UIFont.init(name: "Inter-Regular", size: 16)
    
    let stackView = UIStackView(arrangedSubviews: [indexLabel, wordLabel])
    stackView.axis = .horizontal
    stackView.distribution = .equalSpacing
    stackView.alignment = .leading
    stackView.spacing = 15.0
    stackView.translatesAutoresizingMaskIntoConstraints = false
    stackView.isLayoutMarginsRelativeArrangement = true
    stackView.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 0, leading: 15, bottom: 0, trailing: 15)
    self.addSubview(stackView)
    
    stackView.centerYAnchor.constraint(equalTo: self.centerYAnchor).isActive = true
    
    if traitCollection.userInterfaceStyle == .light {
      self.layer.borderColor = UIColor.init(red: 94/255.0, green: 104/255.0, blue: 135/255.0, alpha: 0.24).cgColor
      indexLabel.textColor = UIColor.lightGray
      wordLabel.textColor = UIColor.black
    } else {
      self.layer.borderColor = UIColor.init(red: 153/255.0, green: 161/255.0, blue: 189/255.0, alpha: 0.24).cgColor
      indexLabel.textColor = UIColor.lightGray
      wordLabel.textColor = UIColor.white
    }
  }
}
