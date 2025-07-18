export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface QuestionValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

export interface DocumentTypeValidation {
  isCorrectType: boolean
  detectedType: "balance_sheet" | "income_statement" | "cash_flow" | "unknown"
  confidence: number
  indicators: string[]
  error?: string
  suggestion?: string
}

// Enhanced document type detection
export function validateDocumentType(
  content: string,
  expectedType: "balance_sheet" | "income_statement" | "cash_flow",
): DocumentTypeValidation {
  const balanceSheetKeywords = [
    "assets",
    "liabilities",
    "equity",
    "balance sheet",
    "current assets",
    "current liabilities",
    "total assets",
    "shareholders equity",
    "retained earnings",
    "working capital",
    "accounts receivable",
    "inventory",
    "property plant equipment",
    "long-term debt",
    "stockholders equity",
  ]

  const incomeStatementKeywords = [
    "revenue",
    "income",
    "expenses",
    "profit",
    "loss",
    "income statement",
    "profit and loss",
    "earnings",
    "cost of goods sold",
    "operating expenses",
    "net income",
    "gross profit",
    "operating income",
    "sales",
  ]

  const cashFlowKeywords = [
    "cash flow",
    "operating activities",
    "investing activities",
    "financing activities",
    "net cash",
    "cash flows from",
    "cash provided by",
    "cash used in",
  ]

  const contentLower = content.toLowerCase()

  // Count keyword matches
  const balanceScore = balanceSheetKeywords.filter((keyword) => contentLower.includes(keyword.toLowerCase())).length

  const incomeScore = incomeStatementKeywords.filter((keyword) => contentLower.includes(keyword.toLowerCase())).length

  const cashFlowScore = cashFlowKeywords.filter((keyword) => contentLower.includes(keyword.toLowerCase())).length

  // Determine document type
  let detectedType: "balance_sheet" | "income_statement" | "cash_flow" | "unknown"
  let confidence: number
  let indicators: string[] = []

  if (balanceScore >= incomeScore && balanceScore >= cashFlowScore && balanceScore > 0) {
    detectedType = "balance_sheet"
    confidence = Math.min((balanceScore / balanceSheetKeywords.length) * 100, 95)
    indicators = balanceSheetKeywords
      .filter((keyword) => contentLower.includes(keyword.toLowerCase()))
      .map((keyword) => `Balance Sheet: ${keyword}`)
  } else if (incomeScore >= balanceScore && incomeScore >= cashFlowScore && incomeScore > 0) {
    detectedType = "income_statement"
    confidence = Math.min((incomeScore / incomeStatementKeywords.length) * 100, 95)
    indicators = incomeStatementKeywords
      .filter((keyword) => contentLower.includes(keyword.toLowerCase()))
      .map((keyword) => `Income Statement: ${keyword}`)
  } else if (cashFlowScore > 0) {
    detectedType = "cash_flow"
    confidence = Math.min((cashFlowScore / cashFlowKeywords.length) * 100, 95)
    indicators = cashFlowKeywords
      .filter((keyword) => contentLower.includes(keyword.toLowerCase()))
      .map((keyword) => `Cash Flow: ${keyword}`)
  } else {
    detectedType = "unknown"
    confidence = 0
    indicators = ["No financial statement indicators found"]
  }

  // Validate against expected type
  const isCorrectType = detectedType === expectedType

  let error: string | undefined
  let suggestion: string | undefined

  if (!isCorrectType) {
    if (expectedType === "balance_sheet") {
      if (detectedType === "income_statement") {
        error = "This appears to be an Income Statement, not a Balance Sheet."
        suggestion =
          "Please use the Income Statement Analysis feature for this document, or upload a Balance Sheet document that contains assets, liabilities, and equity information."
      } else if (detectedType === "cash_flow") {
        error = "This appears to be a Cash Flow Statement, not a Balance Sheet."
        suggestion = "Please upload a Balance Sheet document that contains assets, liabilities, and equity information."
      } else {
        error = "This document does not appear to contain Balance Sheet data."
        suggestion =
          "Please upload a document that contains balance sheet information including current assets, current liabilities, total assets, total liabilities, and shareholders' equity."
      }
    } else if (expectedType === "income_statement") {
      if (detectedType === "balance_sheet") {
        error = "This appears to be a Balance Sheet, not an Income Statement."
        suggestion =
          "Please use the Balance Sheet Analysis feature for this document, or upload an Income Statement document instead."
      } else {
        error = "This document does not appear to contain Income Statement data."
        suggestion =
          "Please upload a document that contains income statement information including revenue, expenses, and net income."
      }
    }
  }

  return {
    isCorrectType,
    detectedType,
    confidence,
    indicators,
    error,
    suggestion,
  }
}

export function validateFinancialFile(file: File): FileValidationResult {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [".xlsx", ".xls", ".pdf"]
  const warnings: string[] = []

  // Basic file validation
  if (!file) {
    return { isValid: false, error: "No file selected" }
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit`,
    }
  }

  if (file.size === 0) {
    return { isValid: false, error: "File appears to be empty" }
  }

  // Check file type
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
  if (!fileExtension) {
    return { isValid: false, error: "File must have a valid extension" }
  }

  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Unsupported file type "${fileExtension}". Please upload Excel (.xlsx, .xls) or PDF files only.`,
    }
  }

  // Check file name
  if (file.name.length > 100) {
    warnings.push("File name is very long and may be truncated in reports")
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /^\./, // Hidden files
    /[<>:"|?*]/, // Invalid characters
    /\.(exe|bat|cmd|scr|vbs|js)$/i, // Executable files
  ]

  if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
    return {
      isValid: false,
      error: "Invalid file name detected. Please use standard file names for financial documents.",
    }
  }

  // File size warnings
  if (file.size > 5 * 1024 * 1024) {
    warnings.push("Large file detected. Processing may take longer than usual.")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

export function validateFollowUpQuestion(question: string): QuestionValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  // Basic validation
  if (!question || question.trim().length === 0) {
    errors.question = "Please enter a question"
    return { isValid: false, errors, warnings }
  }

  // Length validation
  if (question.trim().length < 5) {
    errors.question = "Question must be at least 5 characters long"
    return { isValid: false, errors, warnings }
  }

  if (question.length > 500) {
    errors.question = "Question must be less than 500 characters"
    return { isValid: false, errors, warnings }
  }

  // Content validation
  const inappropriatePatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\beval\s*\(/i,
    /\bexec\s*\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ]

  if (inappropriatePatterns.some((pattern) => pattern.test(question))) {
    errors.question = "Question contains invalid or potentially harmful content"
    return { isValid: false, errors, warnings }
  }

  // Warnings
  if (question.length > 200) {
    warnings.question = "Long questions may receive truncated responses"
  }

  // Check if it's a financial question
  const financialKeywords = [
    "ratio",
    "income",
    "expense",
    "asset",
    "liability",
    "equity",
    "cash",
    "debt",
    "profit",
    "loss",
    "revenue",
    "cost",
    "balance",
    "statement",
    "financial",
    "analysis",
    "trend",
    "performance",
    "risk",
    "credit",
    "loan",
    "investment",
  ]

  const hasFinancialContext = financialKeywords.some((keyword) => question.toLowerCase().includes(keyword))

  if (!hasFinancialContext) {
    warnings.question = "Consider asking questions related to financial analysis for better results"
  }

  return {
    isValid: true,
    errors,
    warnings,
  }
}

export function sanitizeInput(input: string): string {
  if (!input) return ""

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/\beval\s*\(/gi, "") // Remove eval calls
    .replace(/\bexec\s*\(/gi, "") // Remove exec calls
    .trim()
    .substring(0, 1000) // Limit length
}

// Rate limiting utilities
class RateLimiter {
  private calls: number[] = []
  private maxCalls: number
  private windowMs: number

  constructor(maxCalls: number, windowMs: number) {
    this.maxCalls = maxCalls
    this.windowMs = windowMs
  }

  canMakeCall(): boolean {
    const now = Date.now()
    this.calls = this.calls.filter((time) => now - time < this.windowMs)

    if (this.calls.length < this.maxCalls) {
      this.calls.push(now)
      return true
    }

    return false
  }

  getTimeUntilNextCall(): number {
    if (this.calls.length === 0) return 0
    const oldestCall = Math.min(...this.calls)
    return Math.max(0, this.windowMs - (Date.now() - oldestCall))
  }
}

export const analysisRateLimiter = new RateLimiter(3, 60000) // 3 calls per minute
export const questionRateLimiter = new RateLimiter(10, 60000) // 10 calls per minute

// Validation for numeric inputs
export function validateNumericInput(value: string | number, fieldName: string): QuestionValidationResult {
  const errors: Record<string, string> = {}

  if (value === null || value === undefined || value === "") {
    errors[fieldName] = `${fieldName} is required`
    return { isValid: false, errors, warnings: {} }
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  if (isNaN(numValue) || !isFinite(numValue)) {
    errors[fieldName] = `${fieldName} must be a valid number`
    return { isValid: false, errors, warnings: {} }
  }

  if (Math.abs(numValue) > 1e15) {
    errors[fieldName] = `${fieldName} value is too large`
    return { isValid: false, errors, warnings: {} }
  }

  return { isValid: true, errors, warnings: {} }
}
