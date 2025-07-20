// Test script to verify follow-up question data flow
// This script tests the data structure being passed to follow-up APIs

async function testFollowUpDataFlow() {
  console.log('Testing follow-up question data flow...');
  
  // Sample analysis data structure that should be passed to follow-up APIs
  const sampleAnalysisData = {
    executiveSummary: {
      overallHealth: "Strong financial position with improving profitability",
      creditGrade: "B+",
      gradeExplanation: "Grade reflects strong liquidity and improving earnings",
      keyStrengths: ["Strong current ratio", "Improving net income"],
      criticalWeaknesses: ["Debt service coverage needs improvement"],
      riskLevel: "Medium",
      creditRecommendation: "Approve"
    },
    sections: [
      {
        title: "Earnings Performance",
        summary: "Strong earnings growth with improving profitability margins",
        metrics: [
          {
            name: "Net Farm Income",
            value: "$129,000 (2024)",
            trend: "Improving",
            analysis: "Net farm income increased 61% from 2023"
          }
        ],
        keyFindings: ["Strong earnings growth trajectory"]
      }
    ]
  };

  const sampleMetrics = {
    years: [2022, 2023, 2024],
    grossFarmIncome: [2250000, 2367000, 2593000],
    netIncome: [120000, 127000, 169000],
    currentAssets: [335000, 375000, 402000],
    currentLiabilities: [240000, 260000, 270000]
  };

  // Test combined follow-up endpoint
  try {
    console.log('\n=== Testing Combined Follow-up ===');
    const combinedResponse = await fetch('http://localhost:3000/api/combined-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What is the debt service coverage ratio trend?",
        analysisData: sampleAnalysisData,
        metrics: sampleMetrics,
        incomeFileName: "income-statement.xlsx",
        balanceFileName: "balance-sheet.xlsx",
        dataHash: "test-hash-123"
      })
    });

    if (combinedResponse.ok) {
      const result = await combinedResponse.json();
      console.log('✅ Combined follow-up successful');
      console.log('Response length:', result.answer?.length || 0);
      console.log('First 200 chars:', result.answer?.substring(0, 200) + '...');
    } else {
      const error = await combinedResponse.json();
      console.log('❌ Combined follow-up failed:', error);
    }
  } catch (error) {
    console.error('❌ Combined follow-up error:', error.message);
  }

  // Test income follow-up endpoint
  try {
    console.log('\n=== Testing Income Follow-up ===');
    const incomeResponse = await fetch('http://localhost:3000/api/income-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What are the key profitability trends?",
        analysisData: sampleAnalysisData,
        fileName: "income-statement.xlsx",
        dataHash: "test-hash-123"
      })
    });

    if (incomeResponse.ok) {
      const result = await incomeResponse.json();
      console.log('✅ Income follow-up successful');
      console.log('Response length:', result.answer?.length || 0);
      console.log('First 200 chars:', result.answer?.substring(0, 200) + '...');
    } else {
      const error = await incomeResponse.json();
      console.log('❌ Income follow-up failed:', error);
    }
  } catch (error) {
    console.error('❌ Income follow-up error:', error.message);
  }

  // Test balance follow-up endpoint
  try {
    console.log('\n=== Testing Balance Follow-up ===');
    const balanceResponse = await fetch('http://localhost:3000/api/balance-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What is the working capital trend?",
        analysisData: sampleAnalysisData,
        fileName: "balance-sheet.xlsx",
        dataHash: "test-hash-123"
      })
    });

    if (balanceResponse.ok) {
      const result = await balanceResponse.json();
      console.log('✅ Balance follow-up successful');
      console.log('Response length:', result.answer?.length || 0);
      console.log('First 200 chars:', result.answer?.substring(0, 200) + '...');
    } else {
      const error = await balanceResponse.json();
      console.log('❌ Balance follow-up failed:', error);
    }
  } catch (error) {
    console.error('❌ Balance follow-up error:', error.message);
  }

  // Test with incomplete data to verify validation
  try {
    console.log('\n=== Testing Incomplete Data Validation ===');
    const incompleteResponse = await fetch('http://localhost:3000/api/combined-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "Test question",
        analysisData: { incomplete: true }, // Missing required structure
        incomeFileName: "test.xlsx",
        balanceFileName: "test.xlsx",
        dataHash: "test-hash"
      })
    });

    const result = await incompleteResponse.json();
    if (!incompleteResponse.ok) {
      console.log('✅ Validation working - rejected incomplete data:', result.error);
    } else {
      console.log('⚠️ Validation may need improvement - accepted incomplete data');
    }
  } catch (error) {
    console.error('❌ Validation test error:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testFollowUpDataFlow().catch(console.error);