import React from 'react';
import { generateIntegratedAssessment } from './lib/combined-metrics';

/**
 * Test component to demonstrate improved combined analysis
 */
const TestCombinedAnalysis: React.FC = () => {
  // Sample data representing combined metrics from income statement and balance sheet
  const sampleCombinedMetrics = {
    years: [2023, 2024, 2025],
    grossFarmIncome: [2250000, 2367000, 2593000],
    netFarmIncome: [80000, 81000, 129000],
    netIncome: [120000, 127000, 169000],
    currentAssets: [335000, 375000, 402000],
    currentLiabilities: [240000, 260000, 270000],
    totalAssets: [3515000, 3712000, 3958000],
    totalEquity: [2365000, 2619000, 2931000],
    totalLiabilities: [1150000, 1093000, 1027000],
    workingCapital: [95000, 115000, 132000],
    currentRatio: [1.40, 1.44, 1.49],
    debtServiceCoverage: [0.89, 0.94, 1.17],
    equityRatio: [67.3, 70.6, 74.1],
    returnOnAssets: [3.4, 3.4, 4.3],
    returnOnEquity: [5.1, 4.8, 5.8],
    assetTurnover: [0.64, 0.64, 0.66],
    operatingProfitMargin: [3.6, 3.4, 5.0]
  };

  // Generate integrated assessment
  const integratedAssessment = generateIntegratedAssessment(sampleCombinedMetrics);

  // Calculate year-over-year changes for key metrics
  const calculateYoYChange = (values: number[]): string[] => {
    return values.map((value, index) => {
      if (index === 0) return "N/A";
      const prevValue = values[index - 1];
      const change = ((value - prevValue) / Math.abs(prevValue)) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    });
  };

  const roaChanges = calculateYoYChange(sampleCombinedMetrics.returnOnAssets);
  const roeChanges = calculateYoYChange(sampleCombinedMetrics.returnOnEquity);
  const dscrChanges = calculateYoYChange(sampleCombinedMetrics.debtServiceCoverage);
  const equityRatioChanges = calculateYoYChange(sampleCombinedMetrics.equityRatio);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Improved Combined Financial Analysis</h1>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Integrated Financial Assessment</h2>
        <div className="whitespace-pre-line text-gray-700">
          {integratedAssessment}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Profitability Metrics</h2>
          <p className="text-sm text-gray-600 mb-4">
            These metrics combine income statement and balance sheet data to assess how efficiently the operation generates profit from its assets and equity.
          </p>
          
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Metric</th>
                {sampleCombinedMetrics.years.map(year => (
                  <th key={year} className="text-right py-2">{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Return on Assets (ROA)</td>
                {sampleCombinedMetrics.returnOnAssets.map((value, i) => (
                  <td key={i} className="text-right py-2">
                    {value}%
                    <span className={`ml-1 text-xs ${
                      i > 0 && roaChanges[i].startsWith('+') ? 'text-green-600' : 
                      i > 0 && !roaChanges[i].startsWith('N') ? 'text-red-600' : ''
                    }`}>
                      {i > 0 ? `(${roaChanges[i]})` : ''}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Return on Equity (ROE)</td>
                {sampleCombinedMetrics.returnOnEquity.map((value, i) => (
                  <td key={i} className="text-right py-2">
                    {value}%
                    <span className={`ml-1 text-xs ${
                      i > 0 && roeChanges[i].startsWith('+') ? 'text-green-600' : 
                      i > 0 && !roeChanges[i].startsWith('N') ? 'text-red-600' : ''
                    }`}>
                      {i > 0 ? `(${roeChanges[i]})` : ''}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Asset Turnover</td>
                {sampleCombinedMetrics.assetTurnover.map((value, i) => (
                  <td key={i} className="text-right py-2">{value}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2">Operating Profit Margin</td>
                {sampleCombinedMetrics.operatingProfitMargin.map((value, i) => (
                  <td key={i} className="text-right py-2">{value}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Solvency & Liquidity Metrics</h2>
          <p className="text-sm text-gray-600 mb-4">
            These metrics assess the operation's ability to meet short-term obligations and long-term debt commitments using both income and balance sheet data.
          </p>
          
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Metric</th>
                {sampleCombinedMetrics.years.map(year => (
                  <th key={year} className="text-right py-2">{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Debt Service Coverage</td>
                {sampleCombinedMetrics.debtServiceCoverage.map((value, i) => (
                  <td key={i} className="text-right py-2">
                    {value}
                    <span className={`ml-1 text-xs ${
                      i > 0 && dscrChanges[i].startsWith('+') ? 'text-green-600' : 
                      i > 0 && !dscrChanges[i].startsWith('N') ? 'text-red-600' : ''
                    }`}>
                      {i > 0 ? `(${dscrChanges[i]})` : ''}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Current Ratio</td>
                {sampleCombinedMetrics.currentRatio.map((value, i) => (
                  <td key={i} className="text-right py-2">{value}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Equity Ratio</td>
                {sampleCombinedMetrics.equityRatio.map((value, i) => (
                  <td key={i} className="text-right py-2">
                    {value}%
                    <span className={`ml-1 text-xs ${
                      i > 0 && equityRatioChanges[i].startsWith('+') ? 'text-green-600' : 
                      i > 0 && !equityRatioChanges[i].startsWith('N') ? 'text-red-600' : ''
                    }`}>
                      {i > 0 ? `(${equityRatioChanges[i]})` : ''}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2">Working Capital</td>
                {sampleCombinedMetrics.workingCapital.map((value, i) => (
                  <td key={i} className="text-right py-2">${value.toLocaleString()}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold mb-4">Key Insights from Combined Analysis</h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">
              <strong>Improving Debt Service Coverage:</strong> The operation's ability to service debt from income has improved from {sampleCombinedMetrics.debtServiceCoverage[0]} to {sampleCombinedMetrics.debtServiceCoverage[2]}, indicating strengthening financial resilience.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">
              <strong>Return on Assets Trend:</strong> ROA has increased from {sampleCombinedMetrics.returnOnAssets[0]}% to {sampleCombinedMetrics.returnOnAssets[2]}%, showing improved efficiency in using assets to generate income.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">
              <strong>Capital Structure Improvement:</strong> The equity ratio has strengthened from {sampleCombinedMetrics.equityRatio[0]}% to {sampleCombinedMetrics.equityRatio[2]}%, reducing financial risk and enhancing long-term stability.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">
              <strong>Liquidity Enhancement:</strong> Working capital has increased from ${sampleCombinedMetrics.workingCapital[0].toLocaleString()} to ${sampleCombinedMetrics.workingCapital[2].toLocaleString()}, providing greater short-term financial flexibility.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">
              <strong>Integrated Performance Assessment:</strong> The combined analysis reveals a business with improving profitability (ROA/ROE) alongside strengthening financial structure (equity ratio), indicating sustainable growth.
            </span>
          </li>
        </ul>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Recommendations Based on Combined Analysis</h2>
        <p className="text-sm text-gray-600 mb-4">
          These recommendations are derived from analyzing both income statement and balance sheet data together:
        </p>
        
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Capital Structure Optimization</h3>
              <span className="text-xs px-2 py-1 rounded font-medium bg-yellow-100 text-yellow-800">Medium Priority</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">Consider refinancing short-term debt to long-term to better match asset life cycles and improve working capital position.</p>
            <p className="text-xs text-gray-600"><strong>Rationale:</strong> While debt service coverage has improved to {sampleCombinedMetrics.debtServiceCoverage[2]}, optimizing the debt structure could further enhance financial stability.</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Asset Utilization Improvement</h3>
              <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-800">High Priority</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">Implement strategies to increase asset turnover from current {sampleCombinedMetrics.assetTurnover[2]} to target of 0.75+.</p>
            <p className="text-xs text-gray-600"><strong>Rationale:</strong> Improved asset utilization would directly enhance ROA, which has already shown positive movement from {sampleCombinedMetrics.returnOnAssets[0]}% to {sampleCombinedMetrics.returnOnAssets[2]}%.</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Liquidity Management</h3>
              <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800">Ongoing</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">Maintain current ratio above 1.5 while continuing to build working capital reserves.</p>
            <p className="text-xs text-gray-600"><strong>Rationale:</strong> Current ratio of {sampleCombinedMetrics.currentRatio[2]} is adequate but could be strengthened to provide additional buffer against short-term obligations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCombinedAnalysis;
