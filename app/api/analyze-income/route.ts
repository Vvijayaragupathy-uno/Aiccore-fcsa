import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    let extractedData = ""

    // Process Excel files
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      extractedData = JSON.stringify(jsonData, null, 2)
    }
    // Process PDF files (simplified - in production you'd use pdf-parse)
    else if (file.name.endsWith(".pdf")) {
      extractedData = "PDF processing would extract financial data here"
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    const prompt = `
You are an expert agricultural credit analyst. Analyze the following income statement data:

File: ${file.name}
Data: ${extractedData}

Provide a comprehensive analysis including:

**INCOME STATEMENT TREND ANALYSIS**

1. **Revenue Analysis:**
   - Gross farm income trends
   - Revenue diversification
   - Seasonal patterns
   - Market price impacts

2. **Profitability Assessment:**
   - Net farm income trends
   - Operating margins
   - Cost structure analysis
   - Efficiency ratios

3. **Cash Flow Evaluation:**
   - Operating cash flow
   - Debt service coverage ratio
   - Working capital needs
   - Seasonal cash flow patterns

4. **Risk Assessment:**
   - Earnings volatility
   - Weather dependency
   - Market risk exposure
   - Operational risks

5. **Lending Recommendations:**
   - Credit worthiness assessment
   - Loan structure suggestions
   - Risk mitigation strategies
   - Monitoring requirements

Format with clear sections, specific numbers, and actionable insights for credit decisions.
`

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.3,
    })

    // Extract financial metrics for visualization
    const financialMetrics = extractFinancialMetrics(extractedData)

    return NextResponse.json({
      analysis: text,
      metrics: financialMetrics,
      success: true,
    })
  } catch (error) {
    console.error("Income analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze income statement", success: false }, { status: 500 })
  }
}

function extractFinancialMetrics(data: string) {
  // In a real implementation, this would parse the actual financial data
  // For now, returning structured sample data that would come from parsing
  return {
    years: [2022, 2023, 2024],
    grossIncome: [1800000, 1950000, 2100000],
    netIncome: [380000, 425000, -425000],
    operatingExpenses: [1420000, 1525000, 2525000],
    debtServiceCoverage: [1.45, 1.38, 0.85],
  }
}
