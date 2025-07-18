import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { analysis, requestedCount = 5 } = await request.json()

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis data is required" },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return NextResponse.json(
        { success: false, error: "AI service temporarily unavailable" },
        { status: 503 }
      )
    }

    // Create a prompt for ChatGPT to generate contextual questions
    const prompt = createQuestionGenerationPrompt(analysis, requestedCount)

    // Add timeout and retry logic
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a financial analysis expert. Generate insightful follow-up questions that would help users understand their financial analysis better. Return only the questions as a JSON array of strings, no additional text."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Handle specific OpenAI API errors
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.")
        } else if (response.status === 401) {
          throw new Error("Authentication failed")
        } else if (response.status >= 500) {
          throw new Error("AI service temporarily unavailable")
        } else {
          throw new Error(`OpenAI API error: ${response.status}`)
        }
      }

      const result = await response.json()
      
      // Validate response structure
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error("Invalid response format from AI service")
      }

      const content = result.choices[0].message.content

      if (!content) {
        throw new Error("No content received from OpenAI")
      }

      // Parse the JSON response with enhanced error handling
      let questions: string[]
      try {
        questions = JSON.parse(content)
        
        // Validate that we got an array
        if (!Array.isArray(questions)) {
          throw new Error("Expected array of questions")
        }
      } catch (parseError) {
        console.warn("JSON parsing failed, attempting text extraction:", parseError)
        // If JSON parsing fails, try to extract questions from text
        questions = extractQuestionsFromText(content)
      }

      // Validate and clean questions with more robust filtering
      const validQuestions = questions
        .filter(q => typeof q === 'string' && q.trim().length > 10) // Minimum length check
        .map(q => q.trim())
        .filter(q => q.endsWith('?')) // Ensure they are questions
        .slice(0, requestedCount)

      // Ensure we have at least some questions
      if (validQuestions.length === 0) {
        throw new Error("No valid questions generated")
      }

      return NextResponse.json({
        success: true,
        questions: validQuestions,
      })

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        throw new Error("Request timeout - AI service took too long to respond")
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error("Error generating questions:", error)
    
    // Provide more specific error messages
    let errorMessage = "Failed to generate questions"
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again."
      } else if (error.message.includes("Rate limit")) {
        errorMessage = "Too many requests. Please wait a moment and try again."
      } else if (error.message.includes("Authentication")) {
        errorMessage = "Service authentication error"
      } else if (error.message.includes("unavailable")) {
        errorMessage = "AI service is temporarily unavailable"
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

function createQuestionGenerationPrompt(analysis: any, count: number): string {
  let prompt = `Based on the following financial analysis, generate ${count} insightful follow-up questions that would help the user understand their financial position better. Focus on actionable insights, risk factors, and areas for improvement.\n\n`

  // Add executive summary context
  if (analysis.creditGrade) {
    prompt += `Credit Grade: ${analysis.creditGrade}\n`
  }
  if (analysis.riskLevel) {
    prompt += `Risk Level: ${analysis.riskLevel}\n`
  }
  if (analysis.creditRecommendation) {
    prompt += `Credit Recommendation: ${analysis.creditRecommendation}\n`
  }

  // Add strengths and weaknesses
  if (analysis.keyStrengths?.length > 0) {
    prompt += `\nKey Strengths:\n${analysis.keyStrengths.map((s: string) => `- ${s}`).join('\n')}\n`
  }
  if (analysis.criticalWeaknesses?.length > 0) {
    prompt += `\nCritical Weaknesses:\n${analysis.criticalWeaknesses.map((w: string) => `- ${w}`).join('\n')}\n`
  }

  // Add section information
  if (analysis.sections?.length > 0) {
    prompt += `\nAnalysis Sections Available:\n`
    analysis.sections.forEach((section: any) => {
      prompt += `- ${section.title}`
      if (section.hasMetrics) prompt += ` (includes metrics)`
      if (section.hasRecommendations) prompt += ` (includes recommendations)`
      if (section.hasFindings) prompt += ` (includes key findings)`
      prompt += `\n`
    })
  }

  prompt += `\nGenerate questions that would help the user:\n`
  prompt += `1. Understand specific financial ratios and their implications\n`
  prompt += `2. Explore trends and changes over time\n`
  prompt += `3. Assess and mitigate risks\n`
  prompt += `4. Implement recommendations effectively\n`
  prompt += `5. Make informed business decisions\n\n`
  prompt += `Return the questions as a JSON array of strings. Each question should be specific, actionable, and relevant to the analysis provided.`

  return prompt
}

function extractQuestionsFromText(text: string): string[] {
  // Try to extract questions from text if JSON parsing fails
  const lines = text.split('\n')
  const questions: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.endsWith('?')) {
      // Remove common prefixes like numbers, bullets, etc.
      const cleaned = trimmed.replace(/^[\d\.\-\*\s]+/, '').trim()
      if (cleaned.length > 10) { // Ensure it's a substantial question
        questions.push(cleaned)
      }
    }
  }
  
  return questions
}
