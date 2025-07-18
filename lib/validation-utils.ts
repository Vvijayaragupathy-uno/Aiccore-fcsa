/**
 * Validation utilities for financial data and analysis components
 */

export interface ValidationResult {
  isValid: boolean
  hasData: boolean
  errorMessage?: string
}

export interface ValidationContext {
  hasIncomeData: boolean
  hasBalanceData: boolean
  hasValidRatios: boolean
  hasValidTrends: boolean
  debtCoverageValid: boolean
}

/**
 * Check if a value is valid (not NaN, null, undefined, or 0)
 */
export function isValidValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && !isNaN(value) && value !== 0
}

/**
 * Check if an array has any valid data points
 */
export function hasValidData(values: (number | null | undefined)[]): boolean {
  return values.some(value => isValidValue(value))
}

/**
 * Filter out invalid values from an array
 */
export function getValidValues(values: number[]): number[] {
  return values.filter(value => isValidValue(value))
}

/**
 * Validate if a section should be displayed based on its content
 */
export function shouldHideSection(section: any): boolean {
  if (!section) return true
  
  // Check if section has any meaningful content
  if (section.summary && section.summary.trim().length > 0) return false
  if (section.narrative && section.narrative.trim().length > 0) return false
  if (section.keyFindings && section.keyFindings.length > 0) return false
  if (section.metrics && section.metrics.length > 0) return false
  if (section.creditFactors && section.creditFactors.length > 0) return false
  if (section.complianceMetrics && section.complianceMetrics.length > 0) return false
  if (section.recommendations && section.recommendations.length > 0) return false
  
  return true
}

/**
 * Validate financial metrics for display
 */
export function validateMetric(metric: any): ValidationResult {
  if (!metric) {
    return { isValid: false, hasData: false, errorMessage: 'Metric is null or undefined' }
  }
  
  if (!metric.value && metric.value !== 0) {
    return { isValid: false, hasData: false, errorMessage: 'Metric value is missing' }
  }
  
  if (typeof metric.value === 'number' && (isNaN(metric.value) || !isFinite(metric.value))) {
    return { isValid: false, hasData: false, errorMessage: 'Metric value is not a valid number' }
  }
  
  return { isValid: true, hasData: true }
}

/**
 * Validate chart data for rendering
 */
export function validateChartData(data: any[]): ValidationResult {
  if (!data || data.length === 0) {
    return { isValid: false, hasData: false, errorMessage: 'No data provided' }
  }
  
  const validDataPoints = data.filter(point => 
    point && typeof point === 'object' && Object.keys(point).length > 0
  )
  
  if (validDataPoints.length === 0) {
    return { isValid: false, hasData: false, errorMessage: 'No valid data points' }
  }
  
  return { isValid: true, hasData: true }
}

/**
 * Validate debt coverage calculation inputs
 */
export function validateDebtCoverageInputs(data: any): ValidationResult {
  if (!data) {
    return { isValid: false, hasData: false, errorMessage: 'No data provided for debt coverage calculation' }
  }
  
  const requiredFields = ['netIncome']
  const missingFields = requiredFields.filter(field => !isValidValue(data[field]))
  
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      hasData: false, 
      errorMessage: `Missing required fields for debt coverage: ${missingFields.join(', ')}` 
    }
  }
  
  // Check if we have debt service information
  const hasDebtService = isValidValue(data.principalPayments) || isValidValue(data.interestPayments) || isValidValue(data.termDebt)
  
  if (!hasDebtService) {
    return { 
      isValid: false, 
      hasData: false, 
      errorMessage: 'No debt service information available for debt coverage calculation' 
    }
  }
  
  return { isValid: true, hasData: true }
}

/**
 * Calculate proper debt coverage ratio
 */
export function calculateDebtCoverageRatio(data: any): number | null {
  const validation = validateDebtCoverageInputs(data)
  if (!validation.isValid) {
    return null
  }
  
  const netIncome = data.netIncome || 0
  const depreciation = data.depreciation || 0
  const interestExpense = data.interestExpense || 0
  
  // Calculate available cash flow
  const availableCashFlow = netIncome + depreciation + interestExpense
  
  // Calculate total debt service
  const principalPayments = data.principalPayments || 0
  const interestPayments = data.interestPayments || interestExpense || 0
  const totalDebtService = principalPayments + interestPayments
  
  // If no debt service, return null (not applicable)
  if (totalDebtService <= 0) {
    return null
  }
  
  return availableCashFlow / totalDebtService
}

/**
 * Validate analysis sections and determine which should be hidden
 */
export function getValidationContext(analysis: any, financialData: any[]): ValidationContext {
  const context: ValidationContext = {
    hasIncomeData: false,
    hasBalanceData: false,
    hasValidRatios: false,
    hasValidTrends: false,
    debtCoverageValid: false
  }
  
  if (financialData && financialData.length > 0) {
    const currentYear = financialData[financialData.length - 1]
    
    // Check income data
    context.hasIncomeData = isValidValue(currentYear?.netIncome) || isValidValue(currentYear?.grossFarmIncome)
    
    // Check balance data
    context.hasBalanceData = isValidValue(currentYear?.totalAssets) || isValidValue(currentYear?.totalEquity)
    
    // Check ratios
    context.hasValidRatios = isValidValue(currentYear?.currentRatio) || isValidValue(currentYear?.equityRatio)
    
    // Check trends (need at least 2 data points)
    context.hasValidTrends = financialData.length >= 2 && (
      hasValidData(financialData.map(d => d.netIncome)) ||
      hasValidData(financialData.map(d => d.totalAssets))
    )
    
    // Check debt coverage
    context.debtCoverageValid = validateDebtCoverageInputs(currentYear).isValid
  }
  
  return context
}

/**
 * Determine which sections should be hidden based on validation
 */
export function getSectionsToHide(analysis: any, validationContext: ValidationContext): string[] {
  const sectionsToHide: string[] = []
  
  try {
    if (!validationContext.hasIncomeData) {
      sectionsToHide.push('income-trends', 'profitability-trends')
    }
    
    if (!validationContext.hasBalanceData) {
      sectionsToHide.push('liquidity-analysis', 'capital-structure')
    }
    
    if (!validationContext.hasValidRatios) {
      sectionsToHide.push('key-metrics-dashboard')
    }
    
    if (!validationContext.hasValidTrends) {
      sectionsToHide.push('trend-charts')
    }
    
    if (!validationContext.debtCoverageValid) {
      sectionsToHide.push('debt-coverage')
    }
    
    // Check analysis sections with error handling
    if (analysis?.sections && Array.isArray(analysis.sections)) {
      analysis.sections.forEach((section: any, index: number) => {
        try {
          if (shouldHideSection(section)) {
            sectionsToHide.push(`analysis-section-${index}`)
          }
        } catch (sectionError) {
          console.warn(`Error validating section ${index}:`, sectionError)
          // If there's an error validating the section, hide it to be safe
          sectionsToHide.push(`analysis-section-${index}`)
        }
      })
    }
  } catch (error) {
    console.error('Error determining sections to hide:', error)
    // Return empty array on error to show all sections rather than hide everything
  }
  
  return sectionsToHide
}

/**
 * Safe wrapper for validation functions that handles errors gracefully
 */
export function safeValidation<T>(
  validationFn: () => T,
  fallbackValue: T,
  errorMessage?: string
): T {
  try {
    return validationFn()
  } catch (error) {
    if (errorMessage) {
      console.warn(errorMessage, error)
    }
    return fallbackValue
  }
}
