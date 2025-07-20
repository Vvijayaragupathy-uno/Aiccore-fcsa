/**
 * Utility functions for calculating and analyzing combined financial metrics
 * from both income statement and balance sheet data
 */

/**
 * Calculate Return on Assets (ROA)
 * ROA = Net Income / Total Assets
 */
export function calculateROA(netIncome: number, totalAssets: number): number {
  if (!totalAssets || totalAssets === 0) return 0;
  return Number(((netIncome / totalAssets) * 100).toFixed(1));
}

/**
 * Calculate Return on Equity (ROE)
 * ROE = Net Income / Total Equity
 */
export function calculateROE(netIncome: number, totalEquity: number): number {
  if (!totalEquity || totalEquity === 0) return 0;
  return Number(((netIncome / totalEquity) * 100).toFixed(1));
}

/**
 * Calculate Asset Turnover Ratio
 * Asset Turnover = Gross Farm Income / Total Assets
 */
export function calculateAssetTurnover(grossFarmIncome: number, totalAssets: number): number {
  if (!totalAssets || totalAssets === 0) return 0;
  return Number((grossFarmIncome / totalAssets).toFixed(2));
}

/**
 * Calculate Debt Service Coverage Ratio
 * DSCR = Net Farm Income / Annual Debt Service
 * Note: This is a simplified calculation assuming annual debt service is 10% of current liabilities
 */
export function calculateDSCR(netFarmIncome: number, currentLiabilities: number): number {
  if (!currentLiabilities || currentLiabilities === 0) return 0;
  const estimatedDebtService = currentLiabilities * 0.1; // Simplified assumption
  return Number((netFarmIncome / estimatedDebtService).toFixed(2));
}

/**
 * Calculate Working Capital
 * Working Capital = Current Assets - Current Liabilities
 */
export function calculateWorkingCapital(currentAssets: number, currentLiabilities: number): number {
  return currentAssets - currentLiabilities;
}

/**
 * Calculate Current Ratio
 * Current Ratio = Current Assets / Current Liabilities
 */
export function calculateCurrentRatio(currentAssets: number, currentLiabilities: number): number {
  if (!currentLiabilities || currentLiabilities === 0) return 0;
  return Number((currentAssets / currentLiabilities).toFixed(2));
}

/**
 * Calculate Equity Ratio
 * Equity Ratio = Total Equity / Total Assets
 */
export function calculateEquityRatio(totalEquity: number, totalAssets: number): number {
  if (!totalAssets || totalAssets === 0) return 0;
  return Number(((totalEquity / totalAssets) * 100).toFixed(1));
}

/**
 * Calculate Debt-to-Equity Ratio
 * Debt-to-Equity = Total Liabilities / Total Equity
 */
export function calculateDebtToEquity(totalLiabilities: number, totalEquity: number): number {
  if (!totalEquity || totalEquity === 0) return 0;
  return Number((totalLiabilities / totalEquity).toFixed(2));
}

/**
 * Calculate Operating Profit Margin
 * Operating Profit Margin = Net Farm Income / Gross Farm Income
 */
export function calculateOperatingProfitMargin(netFarmIncome: number, grossFarmIncome: number): number {
  if (!grossFarmIncome || grossFarmIncome === 0) return 0;
  return Number(((netFarmIncome / grossFarmIncome) * 100).toFixed(1));
}

/**
 * Calculate Net Profit Margin
 * Net Profit Margin = Net Income / Gross Farm Income
 */
export function calculateNetProfitMargin(netIncome: number, grossFarmIncome: number): number {
  if (!grossFarmIncome || grossFarmIncome === 0) return 0;
  return Number(((netIncome / grossFarmIncome) * 100).toFixed(1));
}

/**
 * Calculate Interest Coverage Ratio
 * Interest Coverage = EBIT / Interest Expense
 * Note: This is a simplified calculation assuming EBIT is Net Farm Income + Interest Expense
 * and Interest Expense is estimated as 5% of total liabilities
 */
export function calculateInterestCoverage(netFarmIncome: number, totalLiabilities: number): number {
  if (!totalLiabilities || totalLiabilities === 0) return 0;
  const estimatedInterestExpense = totalLiabilities * 0.05; // Simplified assumption
  const estimatedEBIT = netFarmIncome + estimatedInterestExpense;
  return Number((estimatedEBIT / estimatedInterestExpense).toFixed(2));
}

/**
 * Calculate Financial Leverage
 * Financial Leverage = Total Assets / Total Equity
 */
export function calculateFinancialLeverage(totalAssets: number, totalEquity: number): number {
  if (!totalEquity || totalEquity === 0) return 0;
  return Number((totalAssets / totalEquity).toFixed(2));
}

/**
 * Analyze trend direction
 * @returns "Improving" | "Stable" | "Declining"
 */
export function analyzeTrend(values: number[], isHigherBetter: boolean = true): string {
  if (!values || values.length < 2) return "Stable";
  
  const lastValue = values[values.length - 1];
  const previousValue = values[values.length - 2];
  
  // Calculate percentage change
  const percentChange = ((lastValue - previousValue) / Math.abs(previousValue)) * 100;
  
  // If change is less than 2%, consider it stable
  if (Math.abs(percentChange) < 2) return "Stable";
  
  // Determine if trend is improving or declining based on whether higher values are better
  const isImproving = isHigherBetter ? percentChange > 0 : percentChange < 0;
  
  return isImproving ? "Improving" : "Declining";
}

/**
 * Generate integrated financial health assessment
 */
export function generateIntegratedAssessment(metrics: any): string {
  try {
    // Extract the most recent year's data
    const latestIndex = metrics.years.length - 1;
    
    // Profitability assessment
    const roa = metrics.returnOnAssets?.[latestIndex] || 0;
    const roe = metrics.returnOnEquity?.[latestIndex] || 0;
    const operatingMargin = calculateOperatingProfitMargin(
      metrics.netFarmIncome?.[latestIndex] || 0, 
      metrics.grossFarmIncome?.[latestIndex] || 0
    );
    
    // Liquidity assessment
    const currentRatio = metrics.currentRatio?.[latestIndex] || 0;
    const workingCapital = metrics.workingCapital?.[latestIndex] || 0;
    
    // Solvency assessment
    const equityRatio = metrics.equityRatio?.[latestIndex] || 0;
    const dscr = metrics.debtServiceCoverage?.[latestIndex] || 0;
    
    // Efficiency assessment
    const assetTurnover = metrics.assetTurnover?.[latestIndex] || 0;
    
    // Generate assessment text
    let assessment = "Integrated Financial Health Assessment:\n\n";
    
    // Profitability
    assessment += "Profitability: ";
    if (roa >= 5 && roe >= 10) {
      assessment += "Strong - The operation demonstrates excellent profitability with ROA of " + 
        roa + "% and ROE of " + roe + "%, indicating efficient use of assets and equity.\n";
    } else if (roa >= 3 && roe >= 5) {
      assessment += "Adequate - The operation shows reasonable profitability with ROA of " + 
        roa + "% and ROE of " + roe + "%, though there may be room for improvement.\n";
    } else {
      assessment += "Weak - The operation's profitability metrics are concerning with ROA of " + 
        roa + "% and ROE of " + roe + "%, suggesting inefficient use of resources.\n";
    }
    
    // Liquidity
    assessment += "\nLiquidity: ";
    if (currentRatio >= 2 && workingCapital > 0) {
      assessment += "Strong - With a current ratio of " + currentRatio + 
        " and working capital of $" + workingCapital.toLocaleString() + 
        ", the operation has excellent short-term financial flexibility.\n";
    } else if (currentRatio >= 1.5 && workingCapital > 0) {
      assessment += "Adequate - With a current ratio of " + currentRatio + 
        " and working capital of $" + workingCapital.toLocaleString() + 
        ", the operation has sufficient short-term liquidity.\n";
    } else {
      assessment += "Weak - With a current ratio of " + currentRatio + 
        " and working capital of $" + workingCapital.toLocaleString() + 
        ", the operation may face challenges meeting short-term obligations.\n";
    }
    
    // Solvency
    assessment += "\nSolvency: ";
    if (equityRatio >= 60 && dscr >= 1.5) {
      assessment += "Strong - With an equity ratio of " + equityRatio + 
        "% and debt service coverage of " + dscr + 
        ", the operation has a solid capital structure and strong debt repayment capacity.\n";
    } else if (equityRatio >= 40 && dscr >= 1.1) {
      assessment += "Adequate - With an equity ratio of " + equityRatio + 
        "% and debt service coverage of " + dscr + 
        ", the operation has a reasonable capital structure and acceptable debt repayment capacity.\n";
    } else {
      assessment += "Weak - With an equity ratio of " + equityRatio + 
        "% and debt service coverage of " + dscr + 
        ", the operation may face challenges with its capital structure and debt repayment.\n";
    }
    
    // Efficiency
    assessment += "\nEfficiency: ";
    if (assetTurnover >= 0.7) {
      assessment += "Strong - Asset turnover of " + assetTurnover + 
        " indicates efficient use of assets to generate revenue.\n";
    } else if (assetTurnover >= 0.5) {
      assessment += "Adequate - Asset turnover of " + assetTurnover + 
        " suggests reasonable efficiency in asset utilization.\n";
    } else {
      assessment += "Weak - Asset turnover of " + assetTurnover + 
        " indicates inefficient use of assets to generate revenue.\n";
    }
    
    // Overall assessment
    assessment += "\nOverall: ";
    const overallScore = (
      (roa >= 3 ? 1 : 0) + 
      (roe >= 5 ? 1 : 0) + 
      (currentRatio >= 1.5 ? 1 : 0) + 
      (equityRatio >= 40 ? 1 : 0) + 
      (dscr >= 1.1 ? 1 : 0)
    );
    
    if (overallScore >= 4) {
      assessment += "The operation demonstrates strong overall financial health, with solid performance across profitability, liquidity, and solvency metrics. The integrated analysis of income statement and balance sheet data reveals a sustainable business model with good capacity to service debt from operations.";
    } else if (overallScore >= 2) {
      assessment += "The operation shows mixed financial health, with strengths in some areas but weaknesses in others. The integrated analysis suggests that management should focus on improving the weaker aspects of financial performance to enhance overall sustainability.";
    } else {
      assessment += "The operation faces significant financial challenges across multiple dimensions. The integrated analysis of income and balance sheet data indicates that substantial improvements are needed to ensure long-term viability and debt servicing capacity.";
    }
    
    return assessment;
  } catch (error) {
    console.error("Error generating integrated assessment:", error);
    return "Unable to generate integrated financial health assessment due to insufficient data.";
  }
}
