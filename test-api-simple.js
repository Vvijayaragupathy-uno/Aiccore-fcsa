// Simple test to check if the combined analysis API is working
console.log('Testing Combined Analysis API...')

// Create a simple test to see what the API returns
const testData = {
  executiveSummary: {
    overallHealth: "Strong financial position with improving profitability",
    creditGrade: "B+",
    gradeExplanation: "Grade reflects strong liquidity and improving earnings",
    keyStrengths: ["Strong current ratio", "Improving net income"],
    criticalWeaknesses: ["Asset utilization could improve"],
    riskLevel: "Medium",
    creditRecommendation: "Approve"
  },
  sections: [
    {
      title: "Earnings Performance",
      summary: "Strong earnings growth with improving profitability",
      metrics: [
        {
          name: "Net Farm Income",
          value: "$129,000 (2024)",
          trend: "Improving",
          analysis: "Net farm income increased 61% from 2023"
        }
      ],
      keyFindings: ["Strong earnings growth trajectory"]
    },
    {
      title: "5 C's of Credit",
      summary: "Generally favorable credit profile",
      creditFactors: [
        {
          factor: "Character",
          score: "Strong",
          assessment: "Demonstrated financial discipline",
          supportingEvidence: "Regular financial reporting"
        }
      ],
      keyFindings: ["Strong overall credit profile"]
    }
  ]
}

console.log('Test data structure:')
console.log('Has executiveSummary:', !!testData.executiveSummary)
console.log('Has sections:', !!testData.sections)
console.log('Sections count:', testData.sections.length)
console.log('Section titles:', testData.sections.map(s => s.title))

// Test the 5 C's section specifically
const fiveCsSection = testData.sections.find(s => s.title.includes("5 C's"))
console.log('5 Cs section found:', !!fiveCsSection)
if (fiveCsSection) {
  console.log('Has creditFactors:', !!fiveCsSection.creditFactors)
  console.log('creditFactors length:', fiveCsSection.creditFactors?.length)
}

console.log('Test completed - this is the expected structure')
