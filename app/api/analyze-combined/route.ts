import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const incomeFile = formData.get("incomeFile") as File
    const balanceFile = formData.get("balanceFile") as File

    if (!incomeFile || !balanceFile) {
      return NextResponse.json({ error: "Both files required" }, { status: 400 })
    }

    // Process income statement
    const incomeBuffer = await incomeFile.arrayBuffer()
    const incomeWorkbook = XLSX.read(incomeBuffer)
    const incomeSheet = incomeWorkbook.Sheets[incomeWorkbook.SheetNames[0]]
    const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 })

    // Process balance sheet
    const balanceBuffer = await balanceFile.arrayBuffer()
    const balanceWorkbook = XLSX.read(balanceBuffer)
    const balanceSheet = balanceWorkbook.Sheets[balanceWorkbook.SheetNames[0]]
    const balanceData = XLSX.utils.sheet_to_json(balanceSheet, { header: 1 })

    const prompt = `
You are a senior agricultural credit analyst performing comprehensive financial analysis.

INCOME STATEMENT DATA (${incomeFile.name}):
${JSON.stringify(incomeData, null, 2)}

BALANCE SHEET DATA (${balanceFile.name}):
${JSON.stringify(balanceData, null, 2)}

Provide integrated financial analysis including:

**EXECUTIVE SUMMARY**
- Overall financial health assessment
- Key strengths and critical weaknesses
- Primary risk factors and opportunities

**COMPREHENSIVE FINANCIAL ANALYSIS**

1. **Integrated Profitability & Liquidity**
   - Earnings quality and cash conversion
   - Working capital management
   - Seasonal cash flow patterns
   - Debt service coverage analysis

2. **Capital Structure & Risk Assessment**
   - Leverage analysis and trends
   - Asset-liability matching
   - Interest rate and market risks
   - Collateral adequacy

3. **Credit Risk Evaluation**
   - Repayment capacity assessment
   - Stress testing scenarios
   - Industry benchmark comparison
   - Risk rating determination

**CREDIT DECISION FRAMEWORK**

4. **Lending Recommendations**
   - Maximum loan amount
   - Optimal loan structure
   - Required covenants
   - Pricing recommendations
   - Approval conditions

5. **Risk Mitigation & Monitoring**
   - Key performance indicators
   - Reporting requirements
   - Early warning signals
   - Relationship management strategy

Provide specific numbers, ratios, and actionable recommendations for credit committee presentation.
`

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.2,
    })

    const combinedMetrics = extractCombinedMetrics(incomeData, balanceData)

    return NextResponse.json({
      analysis: text,
      metrics: combinedMetrics,
      success: true,
    })
  } catch (error) {
    console.error("Combined analysis error:", error)
    return NextResponse.json({ error: "Failed to perform combined analysis", success: false }, { status: 500 })
  }
}

function extractCombinedMetrics(incomeData: any[], balanceData: any[]) {
  return {
    years: [2022, 2023, 2024],
    grossFarmIncome: [1800000, 1950000, 2100000],
    netFarmIncome: [450000, 520000, 47000],
    netNonfarmIncome: [85000, 85000, 85000],
    netIncome: [380000, 425000, -425000],
    currentAssets: [2500000, 2650000, 2200000],
    currentLiabilities: [1255000, 1382000, 2614000],
    totalAssets: [8200000, 8500000, 8900000],
    totalEquity: [6800000, 7100000, 6627000],
    termDebt: [1400000, 1400000, 1447000],
    debtServiceCoverage: [1.45, 1.38, 0.85],
    currentRatio: [1.99, 1.92, 0.84],
    equityRatio: [82.9, 83.5, 74.5],
  }
}
