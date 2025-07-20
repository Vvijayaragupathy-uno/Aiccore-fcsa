import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting income statement follow-up question API call...")

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
    const prompt = `You are an expert agricultural credit analyst specializing in income statement analysis. 
Answer the following follow-up question about an income statement analysis that was previously generated.

QUESTION: ${question}

Here is the income statement analysis data to reference when answering:
${JSON.stringify(analysisData, null, 2)}

ANALYSIS TYPE: Income Statement Analysis

INSTRUCTIONS:
1. Answer the question directly and specifically based on the INCOME STATEMENT data provided
2. Focus on income statement metrics like profitability, operating expenses, debt coverage ratios
3. Include specific numbers, ratios, and metrics from the analysis when relevant
4. If the question asks about trends, provide year-over-year comparisons from the income data
5. If the question asks about recommendations, refer to any lending recommendations in the analysis
6. If the question cannot be answered with the available income statement data, explain what information would be needed
7. Format your response in clear, professional language suitable for a financial analyst
8. Use clean HTML formatting with these specific rules:
   - For percentages/ratios: <span class="font-medium text-blue-600">15.5%</span>
   - For dollar amounts: <span class="font-semibold text-green-600">$125,000</span>
   - For benchmarks: <span class="font-medium text-purple-600">1.25:1</span>
   - For emphasis: <strong>Important Point</strong>
   - For paragraphs: <p>Content here</p>
   - For sections: <div class="mb-4">Section content</div>
   - For tables: Use proper <table>, <thead>, <tbody>, <tr>, <td> structure
   - NEVER nest spans inside spans
   - NEVER use <br> tags - use <p> tags for paragraphs instead
   - Keep HTML structure clean and semantic
9. Example of correct formatting:
   The <span class="font-medium text-blue-600">96.4%</span> operating expense ratio exceeds the <span class="font-medium text-purple-600">75%</span> benchmark by <span class="font-semibold text-green-600">$500,000</span>.
10. If the question is about balance sheet items, clarify this is income statement analysis
11. Focus on visual clarity and professional presentation
12. Use consistent color coding throughout the response

Your response should be thorough, visually appealing, and focused specifically on answering the question using the income statement data provided.`

    // Generate the response
    const { text } = await generateText({
      model: openai("gpt-4.1"),
      prompt,
      temperature: 0.05,
      maxTokens: 2000,
    })

    console.log("Follow-up question answered successfully")

    return NextResponse.json({
      answer: text,
      success: true,
    })
  } catch (error) {
    console.error("Income statement follow-up question error:", error)

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
