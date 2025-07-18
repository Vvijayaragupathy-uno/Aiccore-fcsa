// Enhanced input validation with rate limiting and security checks

interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

interface QuestionValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

// Rate limiter class
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
    // Remove calls outside the window
    this.calls = this.calls.filter((call) => now - call < this.windowMs)

    if (this.calls.length >= this.maxCalls) {
      return false
    }

    this.calls.push(now)
    return true
  }

  getTimeUntilNextCall(): number {
    if (this.calls.length < this.maxCalls) {
      return 0
    }

    const oldestCall = Math.min(...this.calls)
    return this.windowMs - (Date.now() - oldestCall)
  }
}

// Rate limiters for different operations
export const analysisRateLimiter = new RateLimiter(5, 60000) // 5 calls per minute
export const questionRateLimiter = new RateLimiter(10, 60000) // 10 calls per minute

// File validation
export function validateFinancialFile(file: File): ValidationResult {
  const warnings: string[] = []

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: "File size exceeds 10MB limit. Please upload a smaller file.",
    }
  }

  // Check file type
  const allowedTypes = [".xlsx", ".xls", ".pdf"]
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: "Unsupported file type. Please upload Excel (.xlsx, .xls) or PDF files only.",
    }
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /[<>:"/\\|?*]/, // Invalid filename characters
    /^\./, // Hidden files
    /\.(exe|bat|cmd|scr|vbs|js)$/i, // Executable files
  ]

  if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
    return {
      isValid: false,
      error: "Invalid file name. Please rename your file and try again.",
    }
  }

  // Warnings for large files
  if (file.size > 5 * 1024 * 1024) {
    warnings.push("Large file detected. Processing may take longer than usual.")
  }

  // Warning for very small files
  if (file.size < 1024) {
    warnings.push("File appears to be very small. Please ensure it contains financial data.")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

// Follow-up question validation
export function validateFollowUpQuestion(question: string): QuestionValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  // Check length
  if (!question || question.trim().length === 0) {
    errors.empty = "Question cannot be empty"
  } else if (question.trim().length < 5) {
    errors.tooShort = "Question is too short. Please provide more detail."
  } else if (question.trim().length > 500) {
    errors.tooLong = "Question is too long. Please keep it under 500 characters."
  }

  // Check for suspicious content
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /eval\(/i, /document\./i]

  if (suspiciousPatterns.some((pattern) => pattern.test(question))) {
    errors.suspicious = "Question contains invalid content. Please rephrase."
  }

  // Check for excessive special characters
  const specialCharCount = (question.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g) || []).length
  if (specialCharCount > question.length * 0.3) {
    warnings.specialChars = "Question contains many special characters. This may affect analysis quality."
  }

  // Check for financial relevance
  const financialKeywords = [
    "revenue",
    "profit",
    "loss",
    "assets",
    "liabilities",
    "equity",
    "cash",
    "debt",
    "ratio",
    "analysis",
    "financial",
    "balance",
    "income",
    "statement",
    "flow",
    "working capital",
    "current",
    "trend",
    "performance",
    "risk",
    "credit",
  ]

  const hasFinancialKeywords = financialKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword.toLowerCase()),
  )

  if (!hasFinancialKeywords && question.length > 20) {
    warnings.relevance =
      "Question may not be related to financial analysis. Consider asking about financial metrics or ratios."
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (!input) return ""

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/script/gi, "") // Remove script tags
    .substring(0, 1000) // Limit length
}

// Validate analysis type
export function validateAnalysisType(type: string): boolean {
  const validTypes = ["balance_sheet", "income_statement", "cash_flow", "combined"]
  return validTypes.includes(type)
}

// Validate file hash
export function validateFileHash(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false

  // Check if hash looks like a valid hash (alphanumeric, reasonable length)
  const hashPattern = /^[a-zA-Z0-9_-]{10,50}$/
  return hashPattern.test(hash)
}

// Content type validation
export function validateContentType(contentType: string, fileName: string): ValidationResult {
  const allowedContentTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/pdf", // .pdf
  ]

  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf("."))

  // Map extensions to expected content types
  const expectedContentTypes: Record<string, string[]> = {
    ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ".xls": ["application/vnd.ms-excel"],
    ".pdf": ["application/pdf"],
  }

  const expected = expectedContentTypes[fileExtension]

  if (!expected) {
    return {
      isValid: false,
      error: "Unsupported file extension",
    }
  }

  // Some browsers may not set content type correctly, so we'll be lenient
  if (contentType && !expected.includes(contentType) && !contentType.includes("octet-stream")) {
    return {
      isValid: true,
      warnings: [`Content type mismatch. Expected ${expected[0]} but got ${contentType}`],
    }
  }

  return { isValid: true }
}

// Session validation
export function validateSessionId(sessionId: string): boolean {
  if (!sessionId || typeof sessionId !== "string") return false

  // Check if session ID looks valid (UUID-like or reasonable format)
  const sessionPattern = /^[a-zA-Z0-9_-]{8,50}$/
  return sessionPattern.test(sessionId)
}

// Export validation utilities
export const ValidationUtils = {
  validateFinancialFile,
  validateFollowUpQuestion,
  sanitizeInput,
  validateAnalysisType,
  validateFileHash,
  validateContentType,
  validateSessionId,
}
