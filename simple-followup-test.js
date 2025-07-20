// Simple test for follow-up question API
const testData = {
  question: "What is the current ratio?",
  analysisData: {
    executiveSummary: {
      overallHealth: "Strong financial position",
      creditGrade: "B+",
      keyStrengths: ["Strong current ratio of 1.49"]
    },
    sections: [{
      title: "Liquidity Analysis",
      metrics: [{
        name: "Current Ratio",
        value: "1.49",
        trend: "Improving"
      }]
    }]
  },
  fileName: "test.xlsx",
  dataHash: "test123"
};

console.log('Testing follow-up API with sample data...');
console.log('Data structure:', JSON.stringify(testData, null, 2));