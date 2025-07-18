// Enhanced input validation for financial analysis platform
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

// Rate limiting for API calls
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
    return this.calls.length < this.maxCalls
  }

  recordCall(): void {
    this.calls.push(Date.now())
  }

  getTimeUntilNextCall(): number {
    if (this.calls.length < this.maxCalls) return 0
    const oldestCall = Math.min(...this.calls)
    return this.windowMs - (Date.now() - oldestCall)
  }
}

// Rate limiters for different operations
export const analysisRateLimiter = new RateLimiter(5, 60000) // 5 calls per minute
export const questionRateLimiter = new RateLimiter(10, 60000) // 10 calls per minute

export function validateFinancialFile(file: File): FileValidationResult {
  const warnings: string[] = []

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: "File size exceeds 10MB limit. Please compress your file or split it into smaller parts.",
    }
  }

  // Check file type
  const allowedExtensions = [".xlsx", ".xls", ".pdf"]
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Unsupported file type. Please upload files with extensions: ${allowedExtensions.join(", ")}`,
    }
  }

  // Check for minimum file size (avoid empty files)
  if (file.size < 1024) {
    return {
      isValid: false,
      error: "File appears to be too small or empty. Please upload a valid financial document.",
    }
  }

  // Warnings for large files
  if (file.size > 5 * 1024 * 1024) {
    warnings.push("Large file detected. Processing may take longer than usual.")
  }

  // Check file name for potential issues
  if (fileName.includes(" ")) {
    warnings.push("File name contains spaces. Consider using underscores or hyphens instead.")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

export function validateFollowUpQuestion(question: string): QuestionValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  // Check minimum length
  if (question.trim().length < 5) {
    errors.length = "Question must be at least 5 characters long."
  }

  // Check maximum length
  if (question.length > 500) {
    errors.length = "Question must be less than 500 characters."
  }

  // Check for potentially harmful content
  const harmfulPatterns = [/delete|drop|truncate|alter/i, /<script|javascript:|data:/i, /\b(exec|eval|system)\b/i]

  if (harmfulPatterns.some((pattern) => pattern.test(question))) {
    errors.security = "Question contains potentially harmful content."
  }

  // Check for question marks (warning only)
  if (
    !question.includes("?") &&
    !question.toLowerCase().includes("what") &&
    !question.toLowerCase().includes("how") &&
    !question.toLowerCase().includes("why")
  ) {
    warnings.format = "Consider phrasing as a question for better results."
  }

  // Check for very short questions
  if (question.trim().length < 10) {
    warnings.detail = "More detailed questions typically receive better responses."
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript protocols
    .replace(/data:/gi, "") // Remove data protocols
    .substring(0, 1000) // Limit length
}

export function validateAnalysisType(type: string): boolean {
  const validTypes = ["balance_sheet", "income_statement", "cash_flow", "combined"]
  return validTypes.includes(type)
}

export function validateFileHash(hash: string): boolean {
  // Basic hash validation - should be alphanumeric and reasonable length
  return /^[a-zA-Z0-9_-]{10,50}$/.test(hash)
}
