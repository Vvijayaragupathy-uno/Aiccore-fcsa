import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting balance sheet follow-up question API call...")

    const data = await request.json()
    const { question, analysisData, dataHash, fileName } = data

    // Input validation
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        {
          error: "No question provided",
          success: false,
        },
        { status: 400 },
      )
    }

    if (!analysisData) {
      return NextResponse.json(
        {
          error: "No analysis data provided. Please ensure the analysis is complete before asking follow-up questions.",
          success: false,
        },
        { status: 400 },
      )
    }

    // Validate analysis data structure
    if (typeof analysisData === 'object' && !analysisData.executiveSummary && !analysisData.sections && typeof analysisData !== 'string') {
      console.warn('Analysis data appears to be incomplete:', Object.keys(analysisData))
      return NextResponse.json(
        {
          error: "Analysis data appears to be incomplete. Please re-run the analysis and try again.",
          success: false,
        },
        { status: 400 },
      )
    }

    console.log(`Processing follow-up question: "${question}"`)
    console.log(`For file: ${fileName}, hash: ${dataHash}`)

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found, using fallback response")
      return NextResponse.json({
        answer: "I'm sorry, but I can't process follow-up questions at the moment. Please check the analysis data directly.",
        success: true,
      })
    }

    // Prepare the prompt for the AI
    const prompt = `You are an expert agricultural credit analyst specializing in balance sheet analysis. 
Answer the following follow-up question about a balance sheet analysis that was previously generated.

QUESTION: ${question}

Here is the balance sheet analysis data to reference when answering:
${JSON.stringify(analysisData, null, 2)}

INSTRUCTIONS:
1. Answer the question directly and specifically based on the data provided
2. Include specific numbers, ratios, and metrics from the analysis when relevant
3. If the question asks about trends, provide year-over-year comparisons
4. If the question asks about recommendations, refer to any lending recommendations in the analysis
5. If the question cannot be answered with the available data, explain what information would be needed
6. Format your response in clear, professional language suitable for a financial analyst
7. Use ONLY simple markdown formatting (**, *, ###, ##, #, -, 1.) - NO HTML tags or inline styles
8. Keep your answer concise but comprehensive
9. Do not use HTML tags like <span>, <strong>, <br> or any inline CSS classes
10. Use plain text with markdown formatting only

Your response should be thorough but focused specifically on answering the question using the balance sheet data provided.`

    // Generate the response
    const { text } = await generateText({
      model: openai("gpt-4.1"),
      prompt,
      temperature: 0.05,
      maxTokens: 1500,
    })

    console.log("Follow-up question answered successfully")

    return NextResponse.json({
      answer: text,
      success: true,
    })
  } catch (error) {
    console.error("Balance sheet follow-up question error:", error)

    let errorMessage = "Failed to answer follow-up question. Please try again."
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "AI service configuration error. Please contact support."
        statusCode = 503
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment and try again."
        statusCode = 429
      } else if (error.message.includes("timeout")) {
        errorMessage = "Analysis timed out. Please try with a simpler question."
        statusCode = 408
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: statusCode },
    )
  }
}
