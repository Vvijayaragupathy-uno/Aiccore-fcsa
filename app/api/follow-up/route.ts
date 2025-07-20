import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, context, analysisType, fileName, dataHash } = await request.json()

    // Validate required inputs
    if (!question) {
      return NextResponse.json({ error: "Question is required", success: false }, { status: 400 })
    }

    // Check if we have context data
    if (!context) {
      return NextResponse.json({ 
        error: "No financial data available. Please upload financial statements first.", 
        success: false 
      }, { status: 400 })
    }

    console.log(`Processing follow-up question for ${analysisType} analysis`)
    console.log(`Question: ${question}`)
    console.log(`File: ${fileName || 'Not specified'}`)
    console.log(`Data hash: ${dataHash || 'Not specified'}`)

    const prompt = `
You are an expert agricultural credit analyst. Based on the previous financial analysis, provide a detailed answer to this follow-up question:

QUESTION: ${question}

PREVIOUS ANALYSIS CONTEXT:
${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}

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
      model: openai("gpt-4.1"),
      prompt,
      temperature: 0.3,
    })

    return NextResponse.json({
      answer: text,
      success: true,
    })
  } catch (error) {
    console.error("Follow-up error:", error)
    return NextResponse.json({ error: "Failed to process follow-up question", success: false }, { status: 500 })
  }
}
