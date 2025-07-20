// Test script for follow-up question API endpoints

async function testFollowUpEndpoints() {
  console.log('Testing follow-up question API endpoints...');
  
  // Sample data for testing
  const sampleBalanceData = {
    executiveSummary: {
      overallHealth: "Balance sheet shows strong financial position with adequate liquidity and moderate leverage.",
      creditGrade: "B+",
      keyStrengths: ["Strong current ratio of 1.49", "Positive working capital of $132,000"],
      criticalWeaknesses: ["Asset utilization efficiency requires monitoring"]
    },
    visualizationData: {
      years: [2023, 2024, 2025],
      currentAssets: [335000, 375000, 402000],
      currentLiabilities: [240000, 260000, 270000],
      totalAssets: [3515000, 3712000, 3958000],
      totalLiabilities: [1150000, 1093000, 1027000],
      totalEquity: [2365000, 2619000, 2931000]
    }
  };
  
  // Test balance sheet follow-up endpoint
  try {
    console.log('Testing balance-followup endpoint...');
    const balanceResponse = await fetch('http://localhost:3000/api/balance-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What is the current ratio trend?",
        analysisData: sampleBalanceData,
        fileName: "test-balance.xlsx",
        dataHash: "test123"
      })
    });
    
    const balanceResult = await balanceResponse.json();
    console.log('Balance follow-up response:', balanceResult);
    
    // Test income statement follow-up endpoint
    console.log('\nTesting income-followup endpoint...');
    const incomeResponse = await fetch('http://localhost:3000/api/income-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What is the profitability trend?",
        analysisData: {
          executiveSummary: {
            overallHealth: "Income statement shows improving profitability with growing revenue.",
            creditGrade: "B",
            keyStrengths: ["Revenue growth of 9.5% year-over-year", "Improving net income margin"]
          },
          visualizationData: {
            years: [2023, 2024, 2025],
            grossFarmIncome: [2250000, 2367000, 2593000],
            netFarmIncome: [80000, 81000, 129000],
            netIncome: [120000, 127000, 169000]
          }
        },
        fileName: "test-income.xlsx",
        dataHash: "test456"
      })
    });
    
    const incomeResult = await incomeResponse.json();
    console.log('Income follow-up response:', incomeResult);
    
    // Test combined analysis follow-up endpoint
    console.log('\nTesting combined-followup endpoint...');
    const combinedResponse = await fetch('http://localhost:3000/api/combined-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What is the overall financial health?",
        analysisData: {
          executiveSummary: {
            overallHealth: "Combined analysis shows improving financial health with growing profitability and stable capital structure.",
            creditGrade: "B+",
            keyStrengths: ["Revenue growth of 9.5% year-over-year", "Strong current ratio of 1.49"]
          },
          visualizationData: {
            years: [2023, 2024, 2025],
            grossFarmIncome: [2250000, 2367000, 2593000],
            netIncome: [120000, 127000, 169000],
            currentRatio: [1.40, 1.44, 1.49],
            debtServiceCoverage: [0.89, 0.94, 1.17]
          }
        },
        incomeFileName: "test-income.xlsx",
        balanceFileName: "test-balance.xlsx",
        dataHash: "test789"
      })
    });
    
    const combinedResult = await combinedResponse.json();
    console.log('Combined follow-up response:', combinedResult);
    
  } catch (error) {
    console.error('Error testing follow-up endpoints:', error);
  }
}

// Run the test
testFollowUpEndpoints();
