import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import { processExcelFile, processPDFFile, cleanMarkdownFormatting, createFileFingerprint, extractFinancialData } from "@/lib/file-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    // Enhanced input validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['.xlsx', '.xls', '.pdf']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ error: "Unsupported file type. Please upload Excel (.xlsx, .xls) or PDF files only." }, { status: 400 })
    }

    let extractedData = ""
    let dataHash = ""

    // Process files with improved consistency
    try {
      if (fileExtension === ".xlsx" || fileExtension === ".xls") {
        const result = await processExcelFile(file)
        extractedData = result.data
        dataHash = result.hash
      } else if (fileExtension === ".pdf") {
        const result = await processPDFFile(file)
        extractedData = result.data
        dataHash = result.hash
      }
    } catch (processingError) {
      console.error('File processing error:', processingError)
      return NextResponse.json({ 
        error: "Failed to process file. Please ensure it's a valid format.", 
        success: false 
      }, { status: 400 })
    }

    const prompt = `
You are an expert agricultural credit analyst specializing in agricultural lending. Analyze the following income statement data with focus on trend analysis and the 5 C's of Credit framework:

File: ${file.name}
Data Hash: ${dataHash}
Data: ${extractedData}

COMPREHENSIVE INCOME STATEMENT TREND ANALYSIS REQUIREMENTS:

1. SPECIFIC ITEMS TO ANALYZE (provide detailed trend analysis for each):
   - Gross Farm Income: trends, year-over-year changes, seasonal patterns
   - Net Farm Income: profitability trends, margin analysis, comparison to industry benchmarks
   - Net Nonfarm Income: analyze composition (wages vs other), stability, diversification benefits
   - Net Income (NIAT): overall profitability trends, tax efficiency analysis
   - Term Interest and Term Principal Demand (combined): debt service burden analysis
   - Margin after Servicing: years positive/negative, projected vs 3-year average, assessment relative to 1.25:1 Debt Coverage Ratio standard

2. THE 5 C'S OF CREDIT FRAMEWORK:
   - CHARACTER: Management quality, payment history, integrity
   - CAPACITY: Cash flow analysis, debt service coverage, repayment ability
   - CAPITAL: Equity position, retained earnings, capital adequacy
   - COLLATERAL: Asset backing, security position
   - CONDITIONS: Market conditions, economic environment, industry outlook

3. LENDING STANDARDS & BENCHMARKS:
   - Debt Coverage Ratio: Target 1.25:1 minimum
   - Operating Expense Ratio: Industry benchmarks (typically 65-75%)
   - Net Farm Income margins and trends
   - Cash flow adequacy for family living and capital expenditures

4. NARRATIVE REQUIREMENTS:
   - Provide specific dollar amounts and percentages
   - Compare current year to 3-year averages
   - Identify positive and negative trends with explanations
   - Address seasonal variations and cyclical patterns
   - Include actionable recommendations for improvement
   - Reference relevant accounting standards (GAAP/IFRS) and agricultural lending principles
   - Focus on agricultural credit lending perspective with actionable insights

IMPORTANT INSTRUCTIONS:
- Assign a credit grade (A, B, C, D, or F) based on comprehensive financial performance analysis
- Provide detailed explanation for the grade assignment, including specific ratios and benchmarks
- Generate narrative similar to the example provided, focusing on Earnings analysis
- Include specific calculations and variance analysis where applicable

Provide a comprehensive analysis in the following JSON format:

{
  "executiveSummary": {
    "overallPerformance": "Brief overall assessment",
    "creditGrade": "A|B|C|D|F",
    "gradeExplanation": "string - detailed explanation of why this grade was assigned, including specific financial ratios and benchmarks used",
    "standardPrinciples": "string - mention relevant accounting standards (GAAP/IFRS) and agricultural lending principles applied in the analysis",
    "profitabilityTrend": "Improving/Stable/Declining",
    "keyStrengths": ["strength1", "strength2", "strength3"],
    "criticalWeaknesses": ["weakness1", "weakness2"]
  },
  "sections": [
    {
      "title": "Earnings Analysis",
      "summary": "Comprehensive analysis of farm income trends and profitability patterns",
      "metrics": [
        {
          "name": "Gross Farm Income",
          "value": "string - with dollar amounts and trends",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - detailed trend analysis, year-over-year changes, seasonal patterns"
        },
        {
          "name": "Net Farm Income",
          "value": "string - with dollar amounts and margins",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - profitability trends, margin analysis, industry benchmarks"
        },
        {
          "name": "Net Nonfarm Income",
          "value": "string - with composition breakdown",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - composition analysis (wages vs other), stability assessment"
        },
        {
          "name": "Net Income (NIAT)",
          "value": "string - with dollar amounts",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - overall profitability trends, tax efficiency"
        }
      ],
      "keyFindings": ["string - key earnings insights"]
    },
    {
      "title": "Cash Flow and Debt Service Analysis",
      "summary": "Assessment of cash generation and debt service capacity",
      "metrics": [
        {
          "name": "Term Interest and Principal Demand",
          "value": "string - combined amounts",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - debt service burden analysis"
        },
        {
          "name": "Margin after Servicing",
          "value": "string - with DCR calculation",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - years positive/negative, projected vs 3-year average, 1.25:1 DCR assessment"
        },
        {
          "name": "Debt Coverage Ratio",
          "value": "string - ratio calculation",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - comparison to 1.25:1 standard, cash flow adequacy"
        }
      ],
      "keyFindings": ["string - cash flow insights"]
    },
    {
      "title": "5 C's of Credit Assessment",
      "summary": "Comprehensive credit evaluation using the 5 C's framework",
      "creditFactors": [
        {
          "factor": "Character",
          "assessment": "string - management quality, payment history evaluation",
          "score": "Strong|Adequate|Weak"
        },
        {
          "factor": "Capacity",
          "assessment": "string - cash flow analysis, debt service coverage, repayment ability",
          "score": "Strong|Adequate|Weak"
        },
        {
          "factor": "Capital",
          "assessment": "string - equity position, retained earnings analysis",
          "score": "Strong|Adequate|Weak"
        },
        {
          "factor": "Collateral",
          "assessment": "string - asset backing, security position",
          "score": "Strong|Adequate|Weak"
        },
        {
          "factor": "Conditions",
          "assessment": "string - market conditions, economic environment, industry outlook",
          "score": "Favorable|Neutral|Unfavorable"
        }
      ],
      "keyFindings": ["string - credit assessment insights"]
    },
    {
      "title": "Lending Standards Compliance",
      "summary": "Evaluation against agricultural lending benchmarks and standards",
      "metrics": [
        {
          "name": "Operating Expense Ratio",
          "value": "string - percentage with benchmark comparison",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - comparison to 65-75% industry benchmark"
        },
        {
          "name": "Family Living Adequacy",
          "value": "string - coverage assessment",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - cash flow adequacy for family living expenses"
        }
      ],
      "keyFindings": ["string - compliance insights"]
    },
    {
      "title": "Credit Recommendations",
      "summary": "Lending recommendations based on comprehensive analysis",
      "recommendations": [
        {
          "category": "string - recommendation category",
          "recommendation": "string - specific actionable recommendation",
          "priority": "High|Medium|Low",
          "rationale": "string - detailed rationale with supporting data"
        }
      ],
      "keyFindings": ["string - lending insights"]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No additional text, explanations, or markdown formatting.
`

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.05, // Very low temperature for maximum consistency
      maxTokens: 3000,
    })

    // Try to parse as JSON, fallback to cleaned text if parsing fails
    let analysisResult
    try {
      analysisResult = JSON.parse(text)
    } catch (parseError) {
      console.warn("Failed to parse JSON response, using fallback format:", parseError)
      // Fallback to structured format
      analysisResult = {
        executiveSummary: {
          overallPerformance: "Analysis completed with limited data parsing",
          creditGrade: "C",
          gradeExplanation: "Grade assigned based on available data analysis. Detailed financial ratios and benchmarks require further review.",
          standardPrinciples: "Analysis follows GAAP accounting standards and agricultural lending best practices for income statement evaluation.",
          profitabilityTrend: "Stable",
          keyStrengths: ["Data processed successfully"],
          criticalWeaknesses: ["Limited data parsing capability"]
        },
        sections: [
          {
            title: "Earnings Analysis",
            summary: "Farm income analysis based on available data",
            metrics: [],
            keyFindings: ["Analysis requires manual review"]
          },
          {
            title: "Cash Flow and Debt Service Analysis",
            summary: "Debt service capacity assessment based on available data",
            metrics: [],
            keyFindings: ["Cash flow analysis requires manual review"]
          },
          {
            title: "5 C's of Credit Assessment",
            summary: "Credit evaluation framework assessment",
            creditFactors: [
              { factor: "Character", assessment: "Requires manual evaluation", score: "Adequate" },
              { factor: "Capacity", assessment: "Requires manual evaluation", score: "Adequate" },
              { factor: "Capital", assessment: "Requires manual evaluation", score: "Adequate" },
              { factor: "Collateral", assessment: "Requires manual evaluation", score: "Adequate" },
              { factor: "Conditions", assessment: "Requires manual evaluation", score: "Neutral" }
            ],
            keyFindings: ["Manual credit assessment required"]
          },
          {
            title: "Lending Standards Compliance",
            summary: "Compliance assessment based on available data",
            metrics: [],
            keyFindings: ["Compliance assessment requires manual review"]
          },
          {
            title: "Credit Recommendations",
            summary: "Lending recommendations based on available analysis",
            recommendations: [{
              category: "Data Review",
              recommendation: "Manual review of income statement required",
              priority: "High",
              rationale: "Automated parsing limitations require manual intervention"
            }],
            keyFindings: ["Manual review recommended"]
          }
        ]
      }
    }

    // Extract financial metrics for visualization
    const financialMetrics = extractFinancialMetrics(extractedData)

    return NextResponse.json({
      analysis: analysisResult,
      metrics: financialMetrics,
      dataHash: dataHash,
      fileName: file.name,
      success: true,
    })
  } catch (error) {
    console.error("Income analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze income statement", success: false }, { status: 500 })
  }
}

function extractFinancialMetrics(data: string) {
  try {
    // Use the real financial data extraction function
    const financialData = extractFinancialData(data)
    
    // Calculate operating expenses (revenue - net income)
    const operatingExpenses = financialData.revenue.map((revenue, i) => {
      const netIncome = financialData.netIncome[i] || 0
      return Math.max(0, revenue - netIncome)
    })
    
    // Calculate debt service coverage (simplified)
    const debtServiceCoverage = financialData.netIncome.map((income, i) => {
      const expenses = operatingExpenses[i] || 0
      const estimatedDebtService = expenses * 0.1 // Assuming 10% of expenses for debt service
      return estimatedDebtService > 0 ? Number((income / estimatedDebtService).toFixed(2)) : 0
    })
    
    return {
      years: financialData.years,
      grossIncome: financialData.revenue,
      netIncome: financialData.netIncome,
      operatingExpenses,
      debtServiceCoverage,
    }
  } catch (error) {
    console.error('Error extracting financial metrics:', error)
    // Return empty data structure on error
    const currentYear = new Date().getFullYear()
    return {
      years: [currentYear - 2, currentYear - 1, currentYear],
      grossIncome: [0, 0, 0],
      netIncome: [0, 0, 0],
      operatingExpenses: [0, 0, 0],
      debtServiceCoverage: [0, 0, 0],
    }
  }
}
