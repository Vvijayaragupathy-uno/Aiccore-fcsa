import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import { processExcelFile, processPDFFile, cleanMarkdownFormatting, createFileFingerprint, extractFinancialData } from "@/lib/file-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const incomeFile = formData.get("incomeFile") as File
    const balanceFile = formData.get("balanceFile") as File

    // Enhanced input validation
    if (!incomeFile || !balanceFile) {
      return NextResponse.json({ error: "Both income statement and balance sheet files are required" }, { status: 400 })
    }

    // Validate file sizes (max 10MB each)
    if (incomeFile.size > 10 * 1024 * 1024 || balanceFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Validate file types
    const allowedTypes = ['.xlsx', '.xls', '.pdf']
    const incomeExtension = incomeFile.name.toLowerCase().substring(incomeFile.name.lastIndexOf('.'))
    const balanceExtension = balanceFile.name.toLowerCase().substring(balanceFile.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(incomeExtension) || !allowedTypes.includes(balanceExtension)) {
      return NextResponse.json({ error: "Unsupported file type. Please upload Excel (.xlsx, .xls) or PDF files only." }, { status: 400 })
    }

    let incomeData = ""
    let balanceData = ""
    let incomeHash = ""
    let balanceHash = ""

    // Process files with improved consistency
    try {
      // Process income statement
      if (incomeExtension === ".xlsx" || incomeExtension === ".xls") {
        const result = await processExcelFile(incomeFile)
        incomeData = result.data
        incomeHash = result.hash
      } else if (incomeExtension === ".pdf") {
        const result = await processPDFFile(incomeFile)
        incomeData = result.data
        incomeHash = result.hash
      }

      // Process balance sheet
      if (balanceExtension === ".xlsx" || balanceExtension === ".xls") {
        const result = await processExcelFile(balanceFile)
        balanceData = result.data
        balanceHash = result.hash
      } else if (balanceExtension === ".pdf") {
        const result = await processPDFFile(balanceFile)
        balanceData = result.data
        balanceHash = result.hash
      }
    } catch (processingError) {
      console.error('File processing error:', processingError)
      return NextResponse.json({ 
        error: "Failed to process files. Please ensure they are valid formats.", 
        success: false 
      }, { status: 400 })
    }

    // Validate extracted data
    if (!incomeData || incomeData.trim().length < 50) {
      return NextResponse.json({ 
        error: "Income statement data could not be extracted properly. Please ensure the file contains readable financial data.", 
        success: false 
      }, { status: 400 })
    }

    if (!balanceData || balanceData.trim().length < 50) {
      return NextResponse.json({ 
        error: "Balance sheet data could not be extracted properly. Please ensure the file contains readable financial data.", 
        success: false 
      }, { status: 400 })
    }

    // Create combined hash for consistency
    const incomeFingerprint = await createFileFingerprint(incomeFile, incomeData)
    const balanceFingerprint = await createFileFingerprint(balanceFile, balanceData)
    const combinedHash = incomeFingerprint + "-" + balanceFingerprint

    const prompt = `
You are a senior agricultural credit analyst performing comprehensive integrated financial analysis. Analyze both income statement and balance sheet data to provide a complete credit assessment using the 5 C's of Credit framework.

INCOME STATEMENT DATA (${incomeFile.name}):
Data Hash: ${incomeHash}
${incomeData}

BALANCE SHEET DATA (${balanceFile.name}):
Data Hash: ${balanceHash}
${balanceData}

Combined Analysis Hash: ${combinedHash}

COMPREHENSIVE INTEGRATED ANALYSIS REQUIREMENTS:

1. EARNINGS ANALYSIS (from Income Statement):
   - Gross Farm Income trends and year-over-year changes
   - Net Farm Income profitability analysis
   - Net Nonfarm Income composition and stability
   - Net Income (NIAT) overall performance
   - Term Interest and Principal Demand burden analysis
   - Margin after Servicing with 1.25:1 DCR assessment

2. CASH FLOW ANALYSIS (integrated view):
   - Three-year average cash DCR calculation
   - Projected vs historical cash flow comparison
   - Operating expense ratio analysis (target 65-75%)
   - Family living expense adequacy
   - Working capital impact on cash flow

3. CAPITAL ANALYSIS (from Balance Sheet):
   - Working Capital trends and Current Ratio analysis (target 1.5:1)
   - Machinery and Equipment valuation and trends
   - Total Non-Current Assets composition
   - Debt structure analysis (FCSAmerica vs Other loans)
   - Earned Equity changes and equity position
   - Overall leverage assessment (Owner's Equity ratio)

4. THE 5 C'S OF CREDIT COMPREHENSIVE ASSESSMENT:
   - CHARACTER: Management quality, payment history, operational competence
   - CAPACITY: Integrated cash flow analysis, debt service coverage, repayment ability
   - CAPITAL: Equity position, working capital adequacy, retained earnings trends
   - COLLATERAL: Asset quality, real estate values, equipment condition and marketability
   - CONDITIONS: Market environment, commodity prices, economic outlook, regulatory factors

5. LENDING STANDARDS COMPLIANCE:
   - Current Ratio: Target 1.5:1 (calculate gap to standard)
   - Debt Coverage Ratio: Target 1.25:1 minimum
   - Owner's Equity Ratio: Acceptable leverage assessment
   - Working Capital adequacy for operations
   - Term debt structure and maturity analysis

6. NARRATIVE REQUIREMENTS (similar to provided example):
   - Generate detailed narrative covering Earnings, Cash, and Capital sections
   - Include specific dollar amounts, percentages, and variance calculations
   - Compare current performance to multi-year averages
   - Identify specific operational challenges and successes
   - Provide actionable recommendations for improvement
   - Address risk factors and mitigation strategies

IMPORTANT INSTRUCTIONS:
- Assign a credit grade (A, B, C, D, or F) based on comprehensive integrated analysis
- Provide detailed explanation for the grade assignment with specific ratios and benchmarks
- Generate narrative similar to the example provided, focusing on integrated Earnings, Cash, and Capital analysis
- Reference relevant accounting standards (GAAP/IFRS) and agricultural lending principles
- Focus on agricultural credit lending perspective with actionable insights
- Include specific calculations and variance analysis throughout

Return your analysis in the following JSON schema format:

{
  "executiveSummary": {
    "overallHealth": "string",
    "creditGrade": "A|B|C|D|F",
    "gradeExplanation": "string - detailed explanation of why this grade was assigned, including specific financial ratios and benchmarks used",
    "standardPrinciples": "string - mention relevant accounting standards (GAAP/IFRS) and agricultural lending principles applied in the analysis",
    "keyStrengths": ["string"],
    "criticalWeaknesses": ["string"],
    "riskLevel": "Low|Medium|High",
    "creditRecommendation": "Approve|Conditional|Decline"
  },
  "sections": [
    {
      "title": "Earnings",
      "summary": "Comprehensive analysis of farm income performance, profitability trends, and operational efficiency",
      "narrative": "string - detailed narrative analysis similar to example provided, including specific dollar amounts, yield data, price impacts, and operational challenges",
      "metrics": [
        {
          "name": "Gross Farm Income",
          "value": "string - with dollar amounts and trends",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - yield analysis, price impacts, year-over-year changes"
        },
        {
          "name": "Net Farm Income",
          "value": "string - with dollar amounts and margins",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - profitability analysis, operational efficiency"
        },
        {
          "name": "Earned Equity DCR (3-year avg)",
          "value": "string - ratio with margin after servicing",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - debt coverage analysis, comparison to 1.25:1 standard"
        }
      ],
      "keyFindings": ["string - key earnings insights with specific dollar impacts"]
    },
    {
      "title": "Cash",
      "summary": "Cash flow analysis, debt service capacity, and liquidity assessment",
      "narrative": "string - detailed cash flow narrative including 3-year average DCR, projected performance, operating expense ratios, and cash adequacy analysis",
      "metrics": [
        {
          "name": "Cash DCR (3-year avg)",
          "value": "string - ratio with margin after servicing",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - historical cash flow performance analysis"
        },
        {
          "name": "Projected Cash DCR",
          "value": "string - projected ratio and margin",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - forward-looking cash flow assessment"
        },
        {
          "name": "Operating Expense Ratio",
          "value": "string - percentage with benchmark comparison",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - efficiency analysis vs 65-75% benchmark"
        }
      ],
      "keyFindings": ["string - cash flow insights and adequacy assessment"]
    },
    {
      "title": "Capital",
      "summary": "Working capital position, asset composition, debt structure, and equity analysis",
      "narrative": "string - detailed capital analysis including working capital trends, current ratio assessment, capital expenditures, debt structure, and equity position",
      "metrics": [
        {
          "name": "Working Capital",
          "value": "string - dollar amount with trend analysis",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - working capital adequacy and trend analysis"
        },
        {
          "name": "Current Ratio",
          "value": "string - ratio with gap to 1.5:1 standard",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - liquidity assessment and gap analysis to 1.5:1 target"
        },
        {
          "name": "Owner's Equity Ratio",
          "value": "string - percentage with leverage assessment",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - leverage position and equity adequacy"
        },
        {
          "name": "Net Worth",
          "value": "string - total net worth with composition",
          "trend": "Improving|Stable|Declining",
          "analysis": "string - asset composition and valuation analysis"
        }
      ],
      "keyFindings": ["string - capital structure insights and recommendations"]
    },
    {
      "title": "5 C's of Credit Assessment",
      "summary": "Comprehensive credit evaluation using the 5 C's framework",
      "creditFactors": [
        {
          "factor": "Character",
          "assessment": "string - management quality, payment history, operational competence evaluation",
          "score": "Strong|Adequate|Weak",
          "supportingEvidence": "string - specific examples and observations"
        },
        {
          "factor": "Capacity",
          "assessment": "string - integrated cash flow analysis, debt service coverage, repayment ability",
          "score": "Strong|Adequate|Weak",
          "supportingEvidence": "string - DCR calculations, cash flow trends, debt service history"
        },
        {
          "factor": "Capital",
          "assessment": "string - equity position, working capital adequacy, retained earnings trends",
          "score": "Strong|Adequate|Weak",
          "supportingEvidence": "string - equity ratios, capital trends, financial strength indicators"
        },
        {
          "factor": "Collateral",
          "assessment": "string - asset quality, real estate values, equipment condition and marketability",
          "score": "Strong|Adequate|Weak",
          "supportingEvidence": "string - asset valuations, collateral coverage, marketability assessment"
        },
        {
          "factor": "Conditions",
          "assessment": "string - market environment, commodity prices, economic outlook, regulatory factors",
          "score": "Favorable|Neutral|Unfavorable",
          "supportingEvidence": "string - market analysis, economic indicators, industry outlook"
        }
      ],
      "keyFindings": ["string - overall credit assessment insights"]
    },
    {
      "title": "Lending Standards Compliance",
      "summary": "Evaluation against agricultural lending benchmarks and regulatory standards",
      "complianceMetrics": [
        {
          "standard": "Current Ratio (1.5:1 target)",
          "currentValue": "string - actual ratio",
          "compliance": "Meets|Below|Exceeds",
          "gapAnalysis": "string - dollar amount needed to meet standard or excess above standard"
        },
        {
          "standard": "Debt Coverage Ratio (1.25:1 minimum)",
          "currentValue": "string - actual DCR",
          "compliance": "Meets|Below|Exceeds",
          "gapAnalysis": "string - margin above/below standard"
        },
        {
          "standard": "Operating Expense Ratio (65-75% target)",
          "currentValue": "string - actual percentage",
          "compliance": "Meets|Below|Exceeds",
          "gapAnalysis": "string - efficiency assessment vs benchmark"
        }
      ],
      "keyFindings": ["string - compliance insights and recommendations"]
    },
    {
      "title": "Credit Recommendations",
      "summary": "Comprehensive lending recommendations based on integrated analysis",
      "recommendations": [
        {
          "category": "string - recommendation category",
          "recommendation": "string - specific actionable recommendation",
          "priority": "High|Medium|Low",
          "rationale": "string - detailed rationale with supporting financial data",
          "timeline": "string - implementation timeframe"
        }
      ],
      "monitoringRequirements": [
        {
          "metric": "string - key metric to monitor",
          "frequency": "string - monitoring frequency",
          "threshold": "string - trigger threshold",
          "action": "string - required action if threshold breached"
        }
      ],
      "keyFindings": ["string - lending decision insights"]
    }
  ]
}

Provide specific numbers, ratios, and actionable recommendations for credit committee presentation. Ensure the JSON is valid and properly formatted.
`

    const { text } = await Promise.race([
      generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.05, // Very low temperature for maximum consistency
        maxTokens: 4096,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI generation timeout')), 60000)
      )
    ]) as { text: string }

    console.log('AI Response length:', text.length)
    console.log('AI Response preview:', text.substring(0, 200) + '...')

    // Parse the JSON response with improved error handling
    let structuredAnalysis
    try {
      // Clean the text response first
      let cleanedText = text.trim()
      
      // Remove any markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      console.log('Attempting to parse JSON response...')
      console.log('Response length:', cleanedText.length)
      console.log('First 200 chars:', cleanedText.substring(0, 200))
      console.log('Last 200 chars:', cleanedText.substring(cleanedText.length - 200))
      
      structuredAnalysis = JSON.parse(cleanedText)
      
      console.log('JSON parsed successfully!')
      console.log('Has executiveSummary:', !!structuredAnalysis.executiveSummary)
      console.log('Has sections:', !!structuredAnalysis.sections)
      console.log('Sections count:', structuredAnalysis.sections?.length)
      
      // Validate that the response matches our exact schema
      if (!structuredAnalysis.executiveSummary || !structuredAnalysis.sections) {
        console.warn('Invalid JSON schema structure - missing required fields')
        throw new Error('Invalid JSON schema structure')
      }
      
      console.log('Schema validation passed!')
      
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      console.error('Raw AI response:', text)
      console.error('Response length:', text.length)
      
      // Try to extract JSON from markdown or other formatting
      let extractedJson = text
      
      // Look for JSON within the text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedJson = jsonMatch[0]
        console.log('Found JSON match, attempting to parse...')
        try {
          structuredAnalysis = JSON.parse(extractedJson)
          console.log('✅ Successfully parsed extracted JSON!')
        } catch (secondParseError) {
          console.error('❌ Second parse attempt failed:', secondParseError)
          // Final fallback
          structuredAnalysis = createFallbackStructure(text)
        }
      } else {
        console.log('No JSON pattern found, using fallback structure')
        structuredAnalysis = createFallbackStructure(text)
      }
    }

    const combinedMetrics = extractCombinedMetrics(incomeData, balanceData)

    return NextResponse.json({
      analysis: structuredAnalysis,
      metrics: combinedMetrics,
      dataHash: combinedHash,
      incomeFileName: incomeFile.name,
      balanceFileName: balanceFile.name,
      success: true,
    })
  } catch (error) {
    console.error("Combined analysis error:", error)
    return NextResponse.json({ error: "Failed to perform combined analysis", success: false }, { status: 500 })
  }
}

function createFallbackStructure(text: string) {
  const cleanedAnalysis = cleanMarkdownFormatting(text)
  return {
    executiveSummary: {
      overallHealth: "Analysis completed with limited data parsing",
      creditGrade: "C",
      gradeExplanation: "Grade assigned based on available combined analysis. Detailed financial ratios and benchmarks require further review.",
      standardPrinciples: "Analysis follows GAAP accounting standards and agricultural lending best practices for comprehensive financial evaluation.",
      keyStrengths: ["Data processed successfully"],
      criticalWeaknesses: ["Limited data parsing capability"],
      riskLevel: "Medium",
      creditRecommendation: "Conditional"
    },
    sections: [
      {
        title: "Earnings",
        summary: "Farm income analysis based on available data",
        narrative: cleanedAnalysis,
        metrics: [],
        keyFindings: ["Analysis requires manual review"]
      },
      {
        title: "Cash",
        summary: "Cash flow assessment based on available data",
        narrative: "Cash flow analysis pending detailed data parsing",
        metrics: [],
        keyFindings: ["Cash flow analysis requires manual review"]
      },
      {
        title: "Capital",
        summary: "Capital structure analysis based on available data",
        narrative: "Capital analysis pending detailed data parsing",
        metrics: [],
        keyFindings: ["Capital analysis requires manual review"]
      },
      {
        title: "5 C's of Credit Assessment",
        summary: "Credit evaluation framework assessment",
        creditFactors: [
          { factor: "Character", assessment: "Requires manual evaluation", score: "Adequate", supportingEvidence: "Data parsing limitations" },
          { factor: "Capacity", assessment: "Requires manual evaluation", score: "Adequate", supportingEvidence: "Data parsing limitations" },
          { factor: "Capital", assessment: "Requires manual evaluation", score: "Adequate", supportingEvidence: "Data parsing limitations" },
          { factor: "Collateral", assessment: "Requires manual evaluation", score: "Adequate", supportingEvidence: "Data parsing limitations" },
          { factor: "Conditions", assessment: "Requires manual evaluation", score: "Neutral", supportingEvidence: "Data parsing limitations" }
        ],
        keyFindings: ["Manual credit assessment required"]
      },
      {
        title: "Lending Standards Compliance",
        summary: "Compliance assessment based on available data",
        complianceMetrics: [
          { standard: "Current Ratio (1.5:1 target)", currentValue: "Requires calculation", compliance: "Below", gapAnalysis: "Manual calculation required" },
          { standard: "Debt Coverage Ratio (1.25:1 minimum)", currentValue: "Requires calculation", compliance: "Below", gapAnalysis: "Manual calculation required" },
          { standard: "Operating Expense Ratio (65-75% target)", currentValue: "Requires calculation", compliance: "Below", gapAnalysis: "Manual calculation required" }
        ],
        keyFindings: ["Compliance assessment requires manual review"]
      },
      {
        title: "Credit Recommendations",
        summary: "Lending recommendations based on available analysis",
        recommendations: [{
          category: "Data Review",
          recommendation: "Manual review of financial statements required",
          priority: "High",
          rationale: "Automated parsing limitations require manual intervention",
          timeline: "Immediate"
        }],
        monitoringRequirements: [{
          metric: "Data Quality",
          frequency: "Ongoing",
          threshold: "Complete data parsing",
          action: "Re-run automated analysis"
        }],
        keyFindings: ["Manual review recommended"]
      }
    ]
  }
}

function extractCombinedMetrics(incomeData: string, balanceData: string) {
  try {
    // Extract financial data from both income and balance sheet data
    const incomeMetrics = extractFinancialData(incomeData)
    const balanceMetrics = extractFinancialData(balanceData)
    
    // Combine metrics from both sources
    const combinedYears = [...new Set([...incomeMetrics.years, ...balanceMetrics.years])].sort()
    
    // Calculate derived metrics
    const calculateRatios = (assets: number[], liabilities: number[], equity: number[]) => {
      const currentRatio = assets.map((asset, i) => 
        liabilities[i] > 0 ? Number((asset / liabilities[i]).toFixed(2)) : 0
      )
      const equityRatio = equity.map((eq, i) => 
        assets[i] > 0 ? Number(((eq / assets[i]) * 100).toFixed(1)) : 0
      )
      return { currentRatio, equityRatio }
    }
    
    const { currentRatio, equityRatio } = calculateRatios(
      balanceMetrics.currentAssets,
      balanceMetrics.currentLiabilities,
      balanceMetrics.totalEquity
    )
    
    // Calculate debt service coverage (simplified)
    const debtServiceCoverage = incomeMetrics.netIncome.map((income, i) => {
      const totalDebt = balanceMetrics.currentLiabilities[i] || 0
      return totalDebt > 0 ? Number((income / (totalDebt * 0.1)).toFixed(2)) : 0 // Assuming 10% debt service
    })
    
    return {
      years: combinedYears.length > 0 ? combinedYears : incomeMetrics.years,
      grossFarmIncome: incomeMetrics.revenue, // Using revenue as gross farm income
      netFarmIncome: incomeMetrics.netIncome,
      netNonfarmIncome: incomeMetrics.netIncome.map(() => 0), // Would need specific extraction logic
      netIncome: incomeMetrics.netIncome,
      currentAssets: balanceMetrics.currentAssets,
      currentLiabilities: balanceMetrics.currentLiabilities,
      totalAssets: balanceMetrics.totalAssets,
      totalEquity: balanceMetrics.totalEquity,
      termDebt: balanceMetrics.currentLiabilities, // Simplified - would need specific term debt extraction
      debtServiceCoverage,
      currentRatio,
      equityRatio,
    }
  } catch (error) {
    console.error('Error extracting combined financial data:', error)
    // Return empty data structure on error
    const currentYear = new Date().getFullYear()
    const defaultYears = [currentYear - 2, currentYear - 1, currentYear]
    return {
      years: defaultYears,
      grossFarmIncome: [0, 0, 0],
      netFarmIncome: [0, 0, 0],
      netNonfarmIncome: [0, 0, 0],
      netIncome: [0, 0, 0],
      currentAssets: [0, 0, 0],
      currentLiabilities: [0, 0, 0],
      totalAssets: [0, 0, 0],
      totalEquity: [0, 0, 0],
      termDebt: [0, 0, 0],
      debtServiceCoverage: [0, 0, 0],
      currentRatio: [0, 0, 0],
      equityRatio: [0, 0, 0],
    }
  }
}
