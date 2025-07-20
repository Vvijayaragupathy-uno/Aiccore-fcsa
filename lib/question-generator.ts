/**
 * Service for generating contextual follow-up questions using ChatGPT
 */

export interface SuggestedQuestion {
  id: string
  question: string
  category: 'financial-ratios' | 'trends' | 'risk-assessment' | 'recommendations'
}

export interface QuestionGenerationResult {
  success: boolean
  questions: SuggestedQuestion[]
  error?: string
}

/**
 * Generate contextual follow-up questions based on analysis results
 */
export async function generateSuggestedQuestions(analysis: any): Promise<QuestionGenerationResult> {
  try {
    // Validate input
    if (!analysis) {
      throw new Error('Analysis data is required')
    }

    // Extract key information from analysis for context
    const context = extractAnalysisContext(analysis)
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
    
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: context,
          requestedCount: 5
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.')
        } else if (response.status === 503) {
          throw new Error('AI service is temporarily unavailable')
        } else if (response.status >= 500) {
          throw new Error('Server error occurred while generating questions')
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }

      const result = await response.json()

      if (result.success && result.questions && Array.isArray(result.questions)) {
        // Validate questions before categorizing
        const validQuestions = result.questions.filter((q: any) => 
          typeof q === 'string' && q.trim().length > 0
        )
        
        if (validQuestions.length === 0) {
          throw new Error('No valid questions received from service')
        }

        const categorizedQuestions = categorizeQuestions(validQuestions)
        return {
          success: true,
          questions: categorizedQuestions
        }
      } else {
        throw new Error(result.error || 'Invalid response format from question generation service')
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - question generation took too long')
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('Error generating suggested questions:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      } else if (error.message.includes('Rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'AI service is temporarily unavailable'
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = error.message
      }
    }
    
    return {
      success: false,
      questions: [],
      error: errorMessage
    }
  }
}

/**
 * Extract relevant context from analysis for question generation
 */
function extractAnalysisContext(analysis: any): any {
  if (!analysis) return {}

  const context: any = {}

  // Extract executive summary
  if (analysis.executiveSummary) {
    context.creditGrade = analysis.executiveSummary.creditGrade
    context.riskLevel = analysis.executiveSummary.riskLevel
    context.creditRecommendation = analysis.executiveSummary.creditRecommendation
    context.keyStrengths = analysis.executiveSummary.keyStrengths
    context.criticalWeaknesses = analysis.executiveSummary.criticalWeaknesses
  }

  // Extract section summaries
  if (analysis.sections) {
    context.sections = analysis.sections.map((section: any) => ({
      title: section.title,
      summary: section.summary,
      hasMetrics: !!(section.metrics && section.metrics.length > 0),
      hasRecommendations: !!(section.recommendations && section.recommendations.length > 0),
      hasFindings: !!(section.keyFindings && section.keyFindings.length > 0)
    }))
  }

  return context
}

/**
 * Categorize questions by type and add unique IDs
 */
function categorizeQuestions(questions: string[]): SuggestedQuestion[] {
  return questions.map((question, index) => ({
    id: `question-${Date.now()}-${index}`,
    question: question.trim(),
    category: categorizeQuestion(question)
  }))
}

/**
 * Determine the category of a question based on its content
 */
function categorizeQuestion(question: string): SuggestedQuestion['category'] {
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('ratio') || lowerQuestion.includes('metric') || lowerQuestion.includes('calculate')) {
    return 'financial-ratios'
  }
  
  if (lowerQuestion.includes('trend') || lowerQuestion.includes('over time') || lowerQuestion.includes('change')) {
    return 'trends'
  }
  
  if (lowerQuestion.includes('risk') || lowerQuestion.includes('concern') || lowerQuestion.includes('weakness')) {
    return 'risk-assessment'
  }
  
  if (lowerQuestion.includes('recommend') || lowerQuestion.includes('improve') || lowerQuestion.includes('action')) {
    return 'recommendations'
  }
  
  // Default to financial ratios if unclear
  return 'financial-ratios'
}

/**
 * Get fallback questions when API fails
 */
export function getFallbackQuestions(analysis: any): SuggestedQuestion[] {
  const fallbackQuestions: SuggestedQuestion[] = []
  
  // Add generic questions based on available analysis sections
  if (analysis?.executiveSummary?.creditGrade) {
    fallbackQuestions.push({
      id: 'fallback-1',
      question: `What factors contributed to the ${analysis.executiveSummary.creditGrade} credit grade?`,
      category: 'risk-assessment'
    })
  }
  
  if (analysis?.sections) {
    const hasEarningsSection = analysis.sections.some((s: any) => s.title === 'Earnings')
    if (hasEarningsSection) {
      fallbackQuestions.push({
        id: 'fallback-2',
        question: 'How do the earnings trends compare to industry benchmarks?',
        category: 'trends'
      })
    }
    
    const hasRecommendations = analysis.sections.some((s: any) => s.recommendations?.length > 0)
    if (hasRecommendations) {
      fallbackQuestions.push({
        id: 'fallback-3',
        question: 'What are the most critical recommendations to implement first?',
        category: 'recommendations'
      })
    }
  }
  
  // Always include some generic questions
  fallbackQuestions.push(
    {
      id: 'fallback-4',
      question: 'What are the key financial ratios I should monitor going forward?',
      category: 'financial-ratios'
    },
    {
      id: 'fallback-5',
      question: 'What are the main risk factors that could impact future performance?',
      category: 'risk-assessment'
    }
  )
  
  return fallbackQuestions.slice(0, 5) // Return max 5 questions
}
