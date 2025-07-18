// Test the balance sheet JSON parsing fix with the actual problematic response
const problematicResponse = `To provide a comprehensive analysis of the balance sheet data, I will break down the information into the required sections and provide detailed insights, calculations, and recommendations. Given the complexity and depth required, this analysis will be extensive. Let's start with the executive summary and then proceed to the detailed sections.

\`\`\`json
{
  "executiveSummary": {
    "overallHealth": "The financial position shows a mixed trend with declining working capital and current ratio, but strong equity position provides stability.",
    "creditGrade": "C",
    "gradeExplanation": "The credit grade reflects concerns over liquidity metrics while recognizing strong equity foundation.",
    "standardPrinciples": "GAAP standards applied with FCS agricultural lending criteria",
    "keyStrengths": ["Strong equity-to-asset ratio of 56.1%", "Stable long-term debt structure"],
    "criticalWeaknesses": ["Current ratio below 1.0 indicates liquidity challenges", "Negative working capital of -$413,774"],
    "riskLevel": "Medium",
    "businessDrivers": ["Seasonal agricultural cash flow patterns", "Commodity price volatility"],
    "industryContext": "Mixed performance compared to agricultural industry benchmarks"
  },
  "sections": [
    {
      "title": "Working Capital Trend Analysis",
      "summary": "Working capital has declined significantly, creating liquidity concerns.",
      "metrics": [
        {
          "name": "Current Ratio",
          "currentValue": "0.75:1",
          "previousValue": "1.30:1", 
          "trend": "Declining",
          "analysis": "The declining current ratio indicates increasing difficulty meeting short-term obligations.",
          "riskImplications": "High risk of cash flow shortages during critical agricultural periods"
        }
      ],
      "keyFindings": ["Significant liquidity deterioration requires immediate attention"]
    }
  ]
}
\`\`\`

This comprehensive analysis provides the detailed breakdown requested.`

// Enhanced extraction function matching the API logic
function extractJsonFromResponse(text) {
  console.log('Testing extraction with response length:', text.length)
  
  // First try direct parsing
  try {
    const result = JSON.parse(text)
    console.log('✓ Direct parsing successful')
    return result
  } catch (parseError) {
    console.log('✗ Direct parsing failed:', parseError.message)
  }
  
  // Try to extract JSON from markdown code blocks - try multiple patterns
  let jsonMatch = text.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/)
  
  // If no json block found, try looking for any code block that might contain JSON
  if (!jsonMatch) {
    jsonMatch = text.match(/\`\`\`\s*([\s\S]*?)\s*\`\`\`/)
    console.log('Trying generic code block extraction...')
  }
  
  // If still no match, try to find JSON-like content starting with {
  if (!jsonMatch) {
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonMatch = [null, text.substring(jsonStart, jsonEnd + 1)]
      console.log('Trying raw JSON extraction from position', jsonStart, 'to', jsonEnd)
    }
  }
  
  if (jsonMatch) {
    try {
      const jsonContent = jsonMatch[1].trim()
      console.log('Attempting to parse extracted content length:', jsonContent.length)
      console.log('Content preview:', jsonContent.substring(0, 100) + '...')
      const result = JSON.parse(jsonContent)
      console.log('✓ Successfully extracted and parsed JSON from markdown')
      return result
    } catch (extractError) {
      console.log('✗ Failed to parse extracted JSON:', extractError.message)
      console.log('Extracted content preview:', jsonMatch[1].substring(0, 200))
      return null
    }
  }
  
  console.log('✗ No JSON content found in response')
  return null
}

// Test the extraction
const result = extractJsonFromResponse(problematicResponse)
console.log('\n=== RESULTS ===')
console.log('Extraction successful:', !!result)
if (result) {
  console.log('Has executiveSummary:', !!result.executiveSummary)
  console.log('Has sections:', !!result.sections)
  console.log('Credit Grade:', result.executiveSummary?.creditGrade)
  console.log('Risk Implications type:', typeof result.sections?.[0]?.metrics?.[0]?.riskImplications)
  console.log('Risk Implications value:', result.sections?.[0]?.metrics?.[0]?.riskImplications)
}
