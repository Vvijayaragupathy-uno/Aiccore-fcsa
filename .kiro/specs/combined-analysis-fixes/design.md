# Design Document

## Overview

This design addresses three critical issues in the combined financial analysis component: missing ChatGPT-generated follow-up questions, display of invalid/empty sections, and incorrect debt coverage calculations. The solution involves implementing intelligent content validation, automatic question generation, and proper financial calculations.

## Architecture

### Component Structure
```
CombinedAnalysis
├── FileUploadSection
├── ProgressIndicator
├── AnalysisResults
│   ├── formatCombinedAnalysis()
│   └── ContentValidation
├── FinancialCharts (with validation)
├── SuggestedQuestions (NEW)
├── FollowUpQuestions
└── ChatHistory
```

### Data Flow
1. Analysis completion triggers question generation
2. Content validation occurs before rendering
3. Invalid sections are filtered out
4. Valid content is rendered with proper spacing

## Components and Interfaces

### 1. Content Validation System

```typescript
interface ValidationResult {
  isValid: boolean
  hasData: boolean
  errorMessage?: string
}

interface SectionValidator {
  validateSection(section: any): ValidationResult
  validateMetric(metric: any): ValidationResult
  validateChart(data: any[]): ValidationResult
}
```

**Purpose:** Centralized validation logic to determine if content should be displayed.

**Key Methods:**
- `isValidValue(value)`: Checks if a numeric value is valid (not null, undefined, NaN, or 0)
- `hasValidData(array)`: Checks if an array contains any valid values
- `validateDebtCoverage(data)`: Validates debt coverage calculation inputs
- `shouldHideSection(section)`: Determines if a section should be hidden

### 2. Suggested Questions Generator

```typescript
interface SuggestedQuestion {
  id: string
  question: string
  category: 'financial-ratios' | 'trends' | 'risk-assessment' | 'recommendations'
}

interface QuestionGenerator {
  generateQuestions(analysis: any): Promise<SuggestedQuestion[]>
  categorizeQuestions(questions: string[]): SuggestedQuestion[]
}
```

**Purpose:** Automatically generate contextual follow-up questions using ChatGPT.

**Implementation:**
- Calls ChatGPT API with analysis context
- Generates 3-5 relevant questions
- Categorizes questions by type
- Handles API failures gracefully

### 3. Enhanced Financial Charts

```typescript
interface ChartValidation {
  hasValidData: boolean
  validDataPoints: number
  shouldRender: boolean
}

interface EnhancedFinancialCharts extends FinancialCharts {
  validateChartData(data: any[]): ChartValidation
  renderEmptyState(): JSX.Element | null
}
```

**Purpose:** Prevent rendering of charts with invalid or insufficient data.

### 4. Debt Coverage Calculator

```typescript
interface DebtCoverageInputs {
  netIncome: number
  depreciation: number
  interestExpense: number
  principalPayments: number
  interestPayments: number
}

interface DebtCoverageCalculator {
  calculateRatio(inputs: DebtCoverageInputs): number | null
  validateInputs(inputs: Partial<DebtCoverageInputs>): boolean
  getCalculationMethod(): string
}
```

**Purpose:** Provide accurate debt coverage calculations with proper validation.

## Data Models

### Enhanced Analysis Response
```typescript
interface EnhancedAnalysisResponse {
  analysis: any
  metrics?: FinancialMetrics
  suggestedQuestions?: SuggestedQuestion[]
  validationResults: {
    sectionsToHide: string[]
    chartsToHide: string[]
    metricsToHide: string[]
  }
}
```

### Validation Context
```typescript
interface ValidationContext {
  hasIncomeData: boolean
  hasBalanceData: boolean
  hasValidRatios: boolean
  hasValidTrends: boolean
  debtCoverageValid: boolean
}
```

## Error Handling

### Content Validation Errors
- **Invalid Data**: Hide sections gracefully without error messages
- **Missing Calculations**: Skip rendering of dependent components
- **API Failures**: Show fallback content or hide optional sections

### Question Generation Errors
- **API Timeout**: Hide suggested questions section
- **Invalid Response**: Log error and continue without suggestions
- **Rate Limiting**: Implement retry logic with exponential backoff

### Chart Rendering Errors
- **No Data**: Show "No data available" message or hide chart
- **Invalid Values**: Filter out invalid points and render remaining data
- **Calculation Errors**: Hide affected metrics and log warnings

## Testing Strategy

### Unit Tests
1. **Validation Functions**
   - Test `isValidValue()` with various inputs (null, undefined, NaN, 0, negative numbers)
   - Test `hasValidData()` with empty arrays, arrays with invalid values, mixed arrays
   - Test debt coverage calculation with valid and invalid inputs

2. **Question Generation**
   - Mock ChatGPT API responses
   - Test error handling for API failures
   - Verify question categorization logic

3. **Component Rendering**
   - Test conditional rendering based on validation results
   - Verify layout adjustments when sections are hidden
   - Test chart rendering with various data scenarios

### Integration Tests
1. **End-to-End Analysis Flow**
   - Upload files → Analysis → Question generation → Display
   - Test with files containing invalid data
   - Verify proper hiding of invalid sections

2. **API Integration**
   - Test ChatGPT API integration for question generation
   - Test analysis API with various file types
   - Verify error handling across API calls

### Visual Regression Tests
1. **Layout Validation**
   - Screenshots with all sections visible
   - Screenshots with various sections hidden
   - Verify no empty spaces or layout breaks

## Implementation Approach

### Phase 1: Content Validation
1. Implement validation utility functions
2. Add validation to existing components
3. Test hiding of invalid sections

### Phase 2: Question Generation
1. Create question generation service
2. Integrate with ChatGPT API
3. Add suggested questions UI component

### Phase 3: Debt Coverage Fix
1. Implement proper debt coverage calculation
2. Add validation for debt service data
3. Update financial charts component

### Phase 4: Integration & Testing
1. Integrate all components
2. Comprehensive testing
3. Performance optimization

## Technical Considerations

### Performance
- Validation should be lightweight and fast
- Question generation should not block UI rendering
- Chart rendering should be optimized for large datasets

### Accessibility
- Hidden sections should be properly removed from screen readers
- Error states should be announced appropriately
- Interactive elements should maintain keyboard navigation

### Maintainability
- Validation logic should be centralized and reusable
- Question generation should be configurable
- Chart components should be modular and testable