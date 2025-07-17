import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, context, analysisType } = await request.json()

    const prompt = `
You are an expert agricultural credit analyst. Based on the previous financial analysis, provide a detailed answer to this follow-up question:

QUESTION: ${question}

PREVIOUS ANALYSIS CONTEXT:
${context}

ANALYSIS TYPE: ${analysisType}

Provide a comprehensive response that:
1. Directly addresses the specific question
2. References relevant data from the previous analysis
3. Provides actionable recommendations
4. Includes industry benchmarks where applicable
5. Considers agricultural lending best practices
6. Suggests specific next steps or monitoring points

Keep the response focused, practical, and suitable for credit decision-making.
`

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.3,
    })

    return NextResponse.json({
      response: text,
      success: true,
    })
  } catch (error) {
    console.error("Follow-up error:", error)
    return NextResponse.json({ error: "Failed to process follow-up question", success: false }, { status: 500 })
  }
}
