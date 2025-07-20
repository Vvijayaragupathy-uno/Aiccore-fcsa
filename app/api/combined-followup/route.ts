import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting combined analysis follow-up question API call...")

    const data = await request.json()
    const { 
      question, 
      analysisData, 
      dataHash, 
      incomeFileName, 
      balanceFileName,
      metrics,
      originalIncomeFileName,
      originalBalanceFileName 
    } = data

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
    console.log(`For files: ${originalIncomeFileName || incomeFileName} and ${originalBalanceFileName || balanceFileName}, hash: ${dataHash}`)
    console.log('Analysis data structure:', {
      hasExecutiveSummary: !!analysisData?.executiveSummary,
      hasSections: !!analysisData?.sections,
      sectionsCount: analysisData?.sections?.length || 0,
      hasMetrics: !!metrics,
      metricsKeys: metrics ? Object.keys(metrics) : []
    })

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found, using fallback response")
      return NextResponse.json({
        answer: "I'm sorry, but I can't process follow-up questions at the moment. Please check the analysis data directly.",
        success: true,
      })
    }

    // Prepare the prompt for the AI
    const prompt = `You are an expert agricultural credit analyst specializing in comprehensive financial analysis. 
Answer the following follow-up question about a combined financial analysis (income statement and balance sheet) that was previously generated.

QUESTION: ${question}

Here is the combined financial analysis data to reference when answering:
${JSON.stringify(analysisData, null, 2)}

${metrics ? `
Additional Financial Metrics Data:
${JSON.stringify(metrics, null, 2)}
` : ''}

Files analyzed: ${originalIncomeFileName || incomeFileName} (Income Statement) and ${originalBalanceFileName || balanceFileName} (Balance Sheet)

INSTRUCTIONS:
1. Answer the question directly and specifically based on the data provided
2. Include specific numbers, ratios, and metrics from the analysis when relevant
3. If the question asks about trends, provide year-over-year comparisons
4. If the question asks about recommendations, refer to any lending recommendations in the analysis
5. If the question cannot be answered with the available data, explain what information would be needed
6. Format your response in clear, professional language suitable for a financial analyst
7. Use markdown formatting for better readability when appropriate
8. Keep your answer concise but comprehensive

IMPORTANT: Since this is a COMBINED analysis of both income statement and balance sheet, focus on providing insights that can ONLY be derived by analyzing both statements together, such as:
1. Profitability ratios that use both income and balance sheet data (ROA, ROE)
2. Efficiency ratios (Asset turnover, Inventory turnover)
3. Debt service coverage ratio and how income supports debt obligations
4. Cash flow adequacy relative to capital structure
5. Integrated financial health indicators that combine earnings and capital metrics
6. How earnings trends impact balance sheet strength over time
7. Sustainability of the business model based on both earnings and capital structure

Your response should be thorough but focused specifically on answering the question using the combined financial data provided, emphasizing the unique insights gained from analyzing both statements together.`

    // Generate the response
    const { text } = await generateText({
      model: openai("gpt-4.1-turbo"),
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
    console.error("Combined analysis follow-up question error:", error)

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
