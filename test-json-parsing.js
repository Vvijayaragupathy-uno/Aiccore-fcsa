// Test the JSON parsing fix
const testResponse = `Creating a comprehensive analysis based on the provided balance sheet data requires a detailed examination of each financial metric, trend, and its implications for agricultural lending. Below is a structured JSON response that encapsulates the analysis:

\`\`\`json
{
  "executiveSummary": {
    "overallHealth": "The financial position shows a mixed trend with declining asset values and fluctuating working capital, indicating potential liquidity challenges.",
    "creditGrade": "C",
    "gradeExplanation": "The credit grade is primarily due to the declining current ratio and working capital."
  },
  "sections": [
    {
      "title": "Working Capital Trend Analysis",
      "summary": "The working capital trend shows a decline.",
      "keyFindings": ["Significant decline in working capital"]
    }
  ]
}
\`\`\`

This JSON response provides a detailed analysis of the financial data.`

// Test extraction
function extractJsonFromMarkdown(text) {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1])
    } catch (error) {
      console.error('Failed to parse extracted JSON:', error)
      return null
    }
  }
  return null
}

const result = extractJsonFromMarkdown(testResponse)
console.log('Extraction successful:', !!result)
console.log('Has executiveSummary:', !!result?.executiveSummary)
console.log('Has sections:', !!result?.sections)
console.log('Credit Grade:', result?.executiveSummary?.creditGrade)
