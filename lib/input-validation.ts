// Input validation utilities
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

export function validateFinancialFile(file: File): FileValidationResult {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [".xlsx", ".xls", ".pdf"]
  const warnings: string[] = []

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size exceeds 10MB limit",
    }
  }

  // Check file type
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: "Unsupported file type. Please upload Excel (.xlsx, .xls) or PDF files only.",
    }
  }

  // Check file name
  if (file.name.length > 100) {
    warnings.push("File name is very long and may be truncated in reports")
  }

  // Check for empty file
  if (file.size === 0) {
    return {
      isValid: false,
      error: "File appears to be empty",
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

export function validateFollowUpQuestion(question: string): QuestionValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  // Check length
  if (question.length < 5) {
    errors.length = "Question must be at least 5 characters long"
  }

  if (question.length > 500) {
    errors.length = "Question must be less than 500 characters"
  }

  // Check for inappropriate content (basic check)
  const inappropriateWords = ["hack", "exploit", "bypass"]
  if (inappropriateWords.some((word) => question.toLowerCase().includes(word))) {
    errors.content = "Question contains inappropriate content"
  }

  // Warnings
  if (question.length > 200) {
    warnings.length = "Long questions may receive truncated responses"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
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

export const analysisRateLimiter = new RateLimiter(5, 60000) // 5 calls per minute
export const questionRateLimiter = new RateLimiter(10, 60000) // 10 calls per minute
