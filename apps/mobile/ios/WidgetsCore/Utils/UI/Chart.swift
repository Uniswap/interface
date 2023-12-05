//
//  Chart.swift
//  UniswapWidgetsCore
//
//  Created by Eric Huang on 7/21/23.
//

import Foundation
import SwiftUI
import Charts

public func widgetPriceHistoryChart(priceHistory: [PriceHistory], spotPrice: Double) -> some View {
  let priceValues: [Double] = priceHistory.map {$0.price}
  let timestampValues: [Int] = priceHistory.map {$0.timestamp}
  let minY = priceValues.min() ?? 0
  let maxY = priceValues.max() ?? 0
  let minX = timestampValues.min() ?? 0
  let maxX = timestampValues.max() ?? 0
  if #available(iOS 16.0, *) {
    return Chart {
      ForEach(priceHistory, id: \.timestamp) {
        dataPoint in
        LineMark(x: .value("Time",dataPoint.timestamp),
                 y: .value("Price", dataPoint.price))
        .foregroundStyle(.linearGradient(
          colors: [.clear, .white],
          startPoint: .leading,
          endPoint: .trailing))
        .lineStyle(StrokeStyle(lineWidth: 1))
        .interpolationMethod(.monotone)
      }

      PointMark(x: .value("Time", maxX),
                y: .value("Price", spotPrice))
      .foregroundStyle(Color(red: 1, green: 1, blue: 1).opacity(0.25))
      .symbolSize(150)

      PointMark(x: .value("Time", maxX),
                y: .value("Price", spotPrice))
      .foregroundStyle(Color(red: 1, green: 1, blue: 1).opacity(0.5))
      .symbolSize(75)

      PointMark(x: .value("Time", maxX),
                y: .value("Price", spotPrice))
      .foregroundStyle(.white)
      .symbolSize(20)
    }
    .chartXScale(domain: minX...maxX)
    .chartYScale(domain: minY...maxY)
    .chartXAxis(.hidden)
    .chartYAxis(.hidden)
  } else {
    return Spacer()
  }
}
