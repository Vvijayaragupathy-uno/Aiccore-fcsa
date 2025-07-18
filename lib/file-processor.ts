export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: number
  hash: string
}

export interface ProcessedFileResult {
  content: string
  metadata: FileMetadata
  extractedData: any
  processingTime: number
}

export async function createFileFingerprint(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    // Include file metadata in hash for uniqueness
    const metadata = `${file.name}_${file.size}_${file.lastModified}`
    const metadataBuffer = new TextEncoder().encode(metadata)
    const metadataHashBuffer = await crypto.subtle.digest("SHA-256", metadataBuffer)
    const metadataHashArray = Array.from(new Uint8Array(metadataHashBuffer))
    const metadataHashHex = metadataHashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    return `${hashHex.substring(0, 16)}_${metadataHashHex.substring(0, 16)}`
  } catch (error) {
    console.error("Error creating file fingerprint:", error)
    // Fallback to timestamp-based hash
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Extract text content from different file types
export async function extractFileContent(file: File): Promise<string> {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

  try {
    switch (fileExtension) {
      case ".xlsx":
      case ".xls":
        return await extractExcelContent(file)
      case ".pdf":
        return await extractPDFContent(file)
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    console.error("Error extracting file content:", error)
    throw new Error(`Failed to extract content from ${fileExtension} file`)
  }
}

// Extract content from Excel files
async function extractExcelContent(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()

    // In a real implementation, you would use a library like 'xlsx' or 'exceljs'
    // For now, we'll simulate the extraction

    const simulatedContent = `
EXCEL FILE CONTENT EXTRACTED FROM: ${file.name}

FINANCIAL STATEMENT DATA:
=========================

Current Assets:
- Cash and Cash Equivalents: $450,000
- Accounts Receivable: $320,000
- Inventory: $280,000
- Prepaid Expenses: $45,000
- Short-term Investments: $85,000
Total Current Assets: $1,180,000

Non-Current Assets:
- Property, Plant & Equipment (Gross): $6,500,000
- Less: Accumulated Depreciation: ($1,200,000)
- Net Property, Plant & Equipment: $5,300,000
- Long-term Investments: $180,000
- Intangible Assets: $125,000
- Goodwill: $95,000
Total Non-Current Assets: $5,700,000

TOTAL ASSETS: $6,880,000

Current Liabilities:
- Accounts Payable: $185,000
- Short-term Debt: $95,000
- Accrued Expenses: $75,000
- Current Portion of Long-term Debt: $145,000
- Accrued Interest: $25,000
Total Current Liabilities: $525,000

Long-term Liabilities:
- Long-term Debt: $2,800,000
- Deferred Tax Liabilities: $125,000
- Other Long-term Liabilities: $85,000
Total Long-term Liabilities: $3,010,000

TOTAL LIABILITIES: $3,535,000

Shareholders' Equity:
- Common Stock: $500,000
- Additional Paid-in Capital: $1,200,000
- Retained Earnings: $1,645,000
Total Shareholders' Equity: $3,345,000

TOTAL LIABILITIES AND EQUITY: $6,880,000

Key Financial Ratios:
- Current Ratio: ${(1180000 / 525000).toFixed(2)}
- Quick Ratio: ${((1180000 - 280000) / 525000).toFixed(2)}
- Debt-to-Equity Ratio: ${(3535000 / 3345000).toFixed(2)}
- Working Capital: $${(1180000 - 525000).toLocaleString()}
- Asset Turnover: Requires revenue data for calculation
- Return on Assets: Requires net income data for calculation
- Return on Equity: Requires net income data for calculation

EXTRACTED METADATA:
- File Size: ${file.size} bytes
- Last Modified: ${new Date(file.lastModified).toISOString()}
- Processing Date: ${new Date().toISOString()}
    `

    return simulatedContent
  } catch (error) {
    console.error("Excel extraction error:", error)
    throw new Error("Failed to extract Excel content")
  }
}

// Extract content from PDF files
async function extractPDFContent(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()

    // In a real implementation, you would use a library like 'pdf-parse' or 'pdf2pic'
    // For now, we'll simulate the extraction

    const simulatedContent = `
PDF DOCUMENT CONTENT EXTRACTED FROM: ${file.name}

CONSOLIDATED BALANCE SHEET
As of December 31, 2023
=========================

ASSETS

Current Assets:
Cash and cash equivalents                    $425,000
Short-term investments                       $85,000
Accounts receivable, net of allowance       $340,000
Inventory                                   $295,000
Prepaid expenses and other current assets    $55,000
Total current assets                      $1,200,000

Property, Plant and Equipment:
Land                                      $1,500,000
Buildings and improvements                $3,200,000
Machinery and equipment                   $2,800,000
Furniture and fixtures                      $180,000
                                         $7,680,000
Less: Accumulated depreciation           ($1,450,000)
Net property, plant and equipment        $6,230,000

Other Assets:
Long-term investments                       $150,000
Goodwill                                   $200,000
Other intangible assets, net               $100,000
Deferred tax assets                         $45,000
Other assets                                $75,000
Total other assets                         $570,000

TOTAL ASSETS                             $8,000,000

LIABILITIES AND STOCKHOLDERS' EQUITY

Current Liabilities:
Accounts payable                           $220,000
Accrued liabilities                        $180,000
Short-term debt                            $125,000
Current portion of long-term debt          $175,000
Income taxes payable                        $35,000
Total current liabilities                  $735,000

Long-term Liabilities:
Long-term debt, less current portion     $3,200,000
Deferred tax liabilities                   $180,000
Other long-term liabilities                 $95,000
Total long-term liabilities              $3,475,000

Total Liabilities                        $4,210,000

Stockholders' Equity:
Preferred stock, $0.01 par value              $5,000
Common stock, $0.01 par value               $750,000
Additional paid-in capital                $1,200,000
Retained earnings                         $1,835,000
Total stockholders' equity                $3,790,000

TOTAL LIABILITIES AND STOCKHOLDERS' EQUITY $8,000,000

NOTES TO FINANCIAL STATEMENTS:
- All amounts are in USD
- Prepared in accordance with GAAP
- Audited by independent certified public accountants

EXTRACTED METADATA:
- File Size: ${file.size} bytes
- Last Modified: ${new Date(file.lastModified).toISOString()}
- Processing Date: ${new Date().toISOString()}
    `

    return simulatedContent
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Failed to extract PDF content")
  }
}

// Process file and return structured result
export async function processFinancialFile(file: File): Promise<ProcessedFileResult> {
  const startTime = Date.now()

  try {
    // Create file fingerprint
    const hash = await createFileFingerprint(file)

    // Extract content
    const content = await extractFileContent(file)

    // Create metadata
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      hash,
    }

    // Extract structured data (simplified for demo)
    const extractedData = extractStructuredData(content)

    const processingTime = Date.now() - startTime

    return {
      content,
      metadata,
      extractedData,
      processingTime,
    }
  } catch (error) {
    console.error("File processing error:", error)
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Extract structured data from content
function extractStructuredData(content: string): any {
  try {
    const data: any = {
      assets: {},
      liabilities: {},
      equity: {},
      ratios: {},
      metadata: {},
    }

    // Extract current assets
    const currentAssetsMatch = content.match(/Total [Cc]urrent [Aa]ssets[:\s]*\$?([\d,]+)/i)
    if (currentAssetsMatch) {
      data.assets.currentAssets = Number.parseInt(currentAssetsMatch[1].replace(/,/g, ""))
    }

    // Extract total assets
    const totalAssetsMatch = content.match(/TOTAL ASSETS[:\s]*\$?([\d,]+)/i)
    if (totalAssetsMatch) {
      data.assets.totalAssets = Number.parseInt(totalAssetsMatch[1].replace(/,/g, ""))
    }

    // Extract current liabilities
    const currentLiabilitiesMatch = content.match(/Total [Cc]urrent [Ll]iabilities[:\s]*\$?([\d,]+)/i)
    if (currentLiabilitiesMatch) {
      data.liabilities.currentLiabilities = Number.parseInt(currentLiabilitiesMatch[1].replace(/,/g, ""))
    }

    // Extract total liabilities
    const totalLiabilitiesMatch = content.match(/Total Liabilities[:\s]*\$?([\d,]+)/i)
    if (totalLiabilitiesMatch) {
      data.liabilities.totalLiabilities = Number.parseInt(totalLiabilitiesMatch[1].replace(/,/g, ""))
    }

    // Extract equity
    const equityMatch = content.match(
      /(?:Total [Ss]tockholders'? [Ee]quity|Total [Ss]hareholders'? [Ee]quity)[:\s]*\$?([\d,]+)/i,
    )
    if (equityMatch) {
      data.equity.totalEquity = Number.parseInt(equityMatch[1].replace(/,/g, ""))
    }

    // Calculate ratios if we have the data
    if (data.assets.currentAssets && data.liabilities.currentLiabilities) {
      data.ratios.currentRatio = (data.assets.currentAssets / data.liabilities.currentLiabilities).toFixed(2)
      data.ratios.workingCapital = data.assets.currentAssets - data.liabilities.currentLiabilities
    }

    if (data.liabilities.totalLiabilities && data.equity.totalEquity) {
      data.ratios.debtToEquity = (data.liabilities.totalLiabilities / data.equity.totalEquity).toFixed(2)
    }

    // Add metadata
    data.metadata.extractionDate = new Date().toISOString()
    data.metadata.hasBalanceSheetData = !!(
      data.assets.totalAssets &&
      data.liabilities.totalLiabilities &&
      data.equity.totalEquity
    )

    return data
  } catch (error) {
    console.error("Error extracting structured data:", error)
    return {
      assets: {},
      liabilities: {},
      equity: {},
      ratios: {},
      metadata: {
        extractionDate: new Date().toISOString(),
        hasBalanceSheetData: false,
        error: "Failed to extract structured data",
      },
    }
  }
}

// Utility function to detect file type from content
export function detectFileType(content: string): "balance_sheet" | "income_statement" | "cash_flow" | "unknown" {
  const contentLower = content.toLowerCase()

  // Balance sheet indicators
  const balanceSheetKeywords = [
    "current assets",
    "current liabilities",
    "total assets",
    "total liabilities",
    "shareholders equity",
    "stockholders equity",
    "balance sheet",
  ]

  // Income statement indicators
  const incomeStatementKeywords = [
    "revenue",
    "net income",
    "gross profit",
    "operating income",
    "cost of goods sold",
    "operating expenses",
    "income statement",
  ]

  // Cash flow indicators
  const cashFlowKeywords = [
    "cash flow",
    "operating activities",
    "investing activities",
    "financing activities",
    "net cash",
  ]

  const balanceScore = balanceSheetKeywords.filter((keyword) => contentLower.includes(keyword)).length
  const incomeScore = incomeStatementKeywords.filter((keyword) => contentLower.includes(keyword)).length
  const cashFlowScore = cashFlowKeywords.filter((keyword) => contentLower.includes(keyword)).length

  const maxScore = Math.max(balanceScore, incomeScore, cashFlowScore)

  if (maxScore === 0) return "unknown"

  if (balanceScore === maxScore) return "balance_sheet"
  if (incomeScore === maxScore) return "income_statement"
  if (cashFlowScore === maxScore) return "cash_flow"

  return "unknown"
}

// Export utility functions
export const FileProcessor = {
  createFileFingerprint,
  extractFileContent,
  processFinancialFile,
  detectFileType,
}
