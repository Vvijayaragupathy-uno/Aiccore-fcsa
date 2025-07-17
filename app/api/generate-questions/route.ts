import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { analysis, analysisType } = await request.json()

    const prompt = `
You are an expert agricultural credit analyst. Based on the following financial analysis, 
generate 3-5 relevant follow-up questions that would help further analyze the creditworthiness 
and financial health of the agricultural business.

ANALYSIS TYPE: ${analysisType}

ANALYSIS:
${analysis}

Generate questions that:
1. Seek clarification on specific financial metrics
2. Ask about trends or anomalies in the data
3. Request additional context about the business operations
4. Explore risk factors or opportunities
5. Compare against industry benchmarks

Return the questions as a JSON array of strings, like this:
{
  "questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}
`

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.5,
      maxTokens: 1000,
    })

    // Parse the JSON response
    let questions: string[] = []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions.slice(0, 5) // Limit to 5 questions max
      }
    } catch (e) {
      console.error("Failed to parse questions:", e)
      // Fallback to default questions if parsing fails
      questions = [
        "What are the key trends in working capital over the period?",
        "How does the current ratio compare to industry standards?",
        "What are the main risks identified in the balance sheet?",
        "What recommendations would you make to improve the financial position?",
        "How does the debt-to-equity ratio trend look, and what does it indicate?"
      ]
    }

    return NextResponse.json({
      questions,
      success: true,
    })
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate follow-up questions",
        success: false 
      }, 
      { status: 500 }
    )
  }
}
