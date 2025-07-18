/**
 * Enhanced input validation utilities for financial analysis components
 */

export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
}

export interface AnalysisValidationResult {
  isValid: boolean
  hasRequiredData: boolean
  missingFields: string[]
  warnings: string[]
}

/**
 * Comprehensive file validation for financial documents
 */
export function validateFinancialFile(file: File): FileValidationResult {
  const result: FileValidationResult = { isValid: true, warnings: [] }

  // Check if file exists
  if (!file) {
    return { isValid: false, error: "No file selected" }
  }

  // Validate file name
  if (!file.name || file.name.trim().length === 0) {
    return { isValid: false, error: "Invalid file name" }
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /^\./, // Hidden files
    /\.(exe|bat|cmd|scr|vbs|js|jar|com|pif)$/i, // Executable files
    /[<>:"|?*]/, // Invalid characters
    /^\s+|\s+$/, // Leading/trailing spaces
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { 
      isValid: false, 
      error: "Invalid file name detected. Please upload only financial documents with standard names." 
    }
  }

  // Validate file type
  const validTypes = [".xlsx", ".xls", ".pdf", ".csv"]
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
  
  if (!fileExtension) {
    return { isValid: false, error: "File must have a valid extension (.xlsx, .xls, .pdf, or .csv)" }
  }

  if (!validTypes.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: `Invalid file type "${fileExtension}". Please upload Excel (.xlsx, .xls), PDF, or CSV files only.` 
    }
  }

  // Validate file size
  const maxSize = 15 * 1024 * 1024 // 15MB
  const minSize = 1024 // 1KB
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please upload files smaller than 15MB.` 
    }
  }

  if (file.size < minSize) {
    return { 
      isValid: false, 
      error: "File too small. Please ensure the file contains valid financial data." 
    }
  }

  // Add warnings for large files
  if (file.size > 5 * 1024 * 1024) {
    result.warnings?.push("Large file detected. Processing may take longer than usual.")
  }

  // Validate MIME type if available
  if (file.type) {
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/pdf', // .pdf
      'text/csv', // .csv
      'application/csv' // .csv alternative
    ]
    
    if (!validMimeTypes.includes(file.type)) {
      result.warnings?.push("File type may not be supported. Please ensure it's a valid financial document.")
    }
  }

  return result
}

/**
 * Validate follow-up question input
 */
export function validateFollowUpQuestion(question: string): FormValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  // Check if question exists
  if (!question || question.trim().length === 0) {
    errors.question = "Please enter a question"
    return { isValid: false, errors, warnings }
  }

  // Check minimum length
  if (question.trim().length < 3) {
    errors.question = "Question must be at least 3 characters long"
    return { isValid: false, errors, warnings }
  }

  // Check maximum length
  if (question.length > 500) {
    errors.question = "Question must be less than 500 characters"
    return { isValid: false, errors, warnings }
  }

  // Check for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\beval\s*\(/i,
    /\bexec\s*\(/i
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(question))) {
    errors.question = "Question contains invalid content"
    return { isValid: false, errors, warnings }
  }

  // Add warnings for very long questions
  if (question.length > 200) {
    warnings.question = "Long questions may take more time to process"
  }

  // Check if it looks like a financial question
  const financialKeywords = [
    'ratio', 'income', 'expense', 'asset', 'liability', 'equity', 'cash', 'debt',
    'profit', 'loss', 'revenue', 'cost', 'balance', 'statement', 'financial',
    'analysis', 'trend', 'performance', 'risk', 'credit', 'loan', 'investment'
  ]

  const hasFinancialContext = financialKeywords.some(keyword => 
    question.toLowerCase().includes(keyword)
  )

  if (!hasFinancialContext) {
    warnings.question = "Consider asking questions related to financial analysis for better results"
  }

  return { isValid: true, errors, warnings }
}

/**
 * Validate analysis data before processing
 */
export function validateAnalysisData(data: any, analysisType: string): AnalysisValidationResult {
  const result: AnalysisValidationResult = {
    isValid: true,
    hasRequiredData: false,
    missingFields: [],
    warnings: []
  }

  if (!data) {
    result.isValid = false
    result.missingFields.push("No data provided")
    return result
  }

  // Define required fields by analysis type
  const requiredFields: Record<string, string[]> = {
    balance_sheet: ['totalAssets', 'totalLiabilities', 'totalEquity'],
    income_statement: ['totalRevenue', 'totalExpenses', 'netIncome'],
    combined: ['totalAssets', 'totalLiabilities', 'totalEquity', 'totalRevenue', 'netIncome']
  }

  const fields = requiredFields[analysisType] || []
  
  // Check for required fields
  for (const field of fields) {
    if (!data[field] && data[field] !== 0) {
      result.missingFields.push(field)
    }
  }

  // Check if we have any valid numeric data
  const numericFields = Object.keys(data).filter(key => 
    typeof data[key] === 'number' && !isNaN(data[key]) && isFinite(data[key])
  )

  if (numericFields.length === 0) {
    result.isValid = false
    result.warnings.push("No valid numeric data found")
    return result
  }

  result.hasRequiredData = result.missingFields.length === 0

  // Add warnings for missing optional but important fields
  const optionalFields: Record<string, string[]> = {
    balance_sheet: ['currentAssets', 'currentLiabilities', 'longTermDebt'],
    income_statement: ['operatingIncome', 'interestExpense', 'depreciation'],
    combined: ['currentAssets', 'currentLiabilities', 'operatingIncome', 'interestExpense']
  }

  const optional = optionalFields[analysisType] || []
  const missingOptional = optional.filter(field => !data[field] && data[field] !== 0)
  
  if (missingOptional.length > 0) {
    result.warnings.push(`Some optional fields are missing: ${missingOptional.join(', ')}. Analysis may be limited.`)
  }

  return result
}

/**
 * Sanitize user input to prevent XSS and other attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return ""
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\beval\s*\(/gi, '') // Remove eval calls
    .replace(/\bexec\s*\(/gi, '') // Remove exec calls
    .substring(0, 1000) // Limit length
}

/**
 * Validate numeric input
 */
export function validateNumericInput(value: string | number, fieldName: string): FormValidationResult {
  const errors: Record<string, string> = {}
  
  if (value === null || value === undefined || value === '') {
    errors[fieldName] = `${fieldName} is required`
    return { isValid: false, errors }
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue) || !isFinite(numValue)) {
    errors[fieldName] = `${fieldName} must be a valid number`
    return { isValid: false, errors }
  }

  // Check for reasonable ranges (adjust as needed)
  if (Math.abs(numValue) > 1e15) {
    errors[fieldName] = `${fieldName} value is too large`
    return { isValid: false, errors }
  }

  return { isValid: true, errors }
}

/**
 * Validate email input (if needed for reports)
 */
export function validateEmail(email: string): FormValidationResult {
  const errors: Record<string, string> = {}
  
  if (!email || email.trim().length === 0) {
    errors.email = "Email is required"
    return { isValid: false, errors }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid email address"
    return { isValid: false, errors }
  }

  if (email.length > 254) {
    errors.email = "Email address is too long"
    return { isValid: false, errors }
  }

  return { isValid: true, errors }
}

/**
 * Rate limit validation for API calls
 */
export class RateLimiter {
  private calls: number[] = []
  private maxCalls: number
  private timeWindow: number

  constructor(maxCalls: number = 10, timeWindowMs: number = 60000) {
    this.maxCalls = maxCalls
    this.timeWindow = timeWindowMs
  }

  canMakeCall(): boolean {
    const now = Date.now()
    
    // Remove old calls outside the time window
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow)
    
    // Check if we can make a new call
    if (this.calls.length >= this.maxCalls) {
      return false
    }

    // Record this call
    this.calls.push(now)
    return true
  }

  getTimeUntilNextCall(): number {
    if (this.calls.length < this.maxCalls) {
      return 0
    }

    const oldestCall = Math.min(...this.calls)
    const timeUntilReset = this.timeWindow - (Date.now() - oldestCall)
    return Math.max(0, timeUntilReset)
  }
}

/**
 * Global rate limiter instances
 */
export const analysisRateLimiter = new RateLimiter(5, 60000) // 5 calls per minute
export const questionRateLimiter = new RateLimiter(20, 60000) // 20 calls per minute
