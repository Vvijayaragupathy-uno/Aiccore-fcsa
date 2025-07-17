import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { analysis, metrics, reportType } = await request.json()

    // Generate PDF report (in production, use libraries like jsPDF or Puppeteer)
    const reportData = {
      title: `${reportType} Analysis Report`,
      date: new Date().toISOString().split("T")[0],
      analysis,
      metrics,
      charts: generateChartData(metrics),
    }

    // In a real implementation, this would generate an actual PDF
    const pdfBuffer = generatePDFReport(reportData)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}-report-${reportData.date}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export report", success: false }, { status: 500 })
  }
}

function generateChartData(metrics: any) {
  // Generate chart configurations for the PDF
  return {
    incomeChart: metrics.grossIncome || [],
    ratioChart: metrics.currentRatio || [],
    trendChart: metrics.years || [],
  }
}

function generatePDFReport(data: any): Buffer {
  // Generate a comprehensive PDF report with proper formatting
  const reportContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length ${getContentLength(data)}
>>
stream
BT
/F1 16 Tf
50 750 Td
(${data.title}) Tj
0 -30 Td
/F1 12 Tf
(Generated: ${data.date}) Tj
0 -40 Td
/F1 14 Tf
(Financial Analysis Summary) Tj
0 -30 Td
/F1 10 Tf
${formatAnalysisForPDF(data.analysis)}
${formatMetricsForPDF(data.metrics)}
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${500 + getContentLength(data)}
%%EOF`
  
  return Buffer.from(reportContent)
}

function getContentLength(data: any): number {
  const analysisLength = formatAnalysisForPDF(data.analysis).length
  const metricsLength = formatMetricsForPDF(data.metrics).length
  return 200 + analysisLength + metricsLength // Base content + dynamic content
}

function formatAnalysisForPDF(analysis: any): string {
  if (!analysis) return ''
  
  // Handle both JSON and text formats
  let textContent = ''
  if (typeof analysis === 'string') {
    textContent = analysis
  } else if (typeof analysis === 'object') {
    // Extract text from JSON structure
    if (analysis.executiveSummary?.overallPerformance) {
      textContent += analysis.executiveSummary.overallPerformance + ' '
    }
    if (analysis.sections) {
      analysis.sections.forEach((section: any) => {
        if (section.summary) textContent += section.summary + ' '
        if (section.keyFindings) {
          section.keyFindings.forEach((finding: string) => {
            textContent += finding + ' '
          })
        }
      })
    }
  }
  
  // Clean and format analysis text for PDF
  const cleanAnalysis = textContent
    .replace(/[()\\]/g, '') // Remove PDF special characters
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .substring(0, 1000) // Limit length
  
  // Split into lines for PDF formatting
  const words = cleanAnalysis.split(' ')
  let formattedText = ''
  let currentLine = ''
  
  words.forEach(word => {
    if (currentLine.length + word.length > 60) {
      formattedText += `(${currentLine}) Tj\n0 -15 Td\n`
      currentLine = word + ' '
    } else {
      currentLine += word + ' '
    }
  })
  
  if (currentLine.trim()) {
    formattedText += `(${currentLine.trim()}) Tj\n0 -15 Td\n`
  }
  
  return formattedText
}

function formatMetricsForPDF(metrics: any): string {
  if (!metrics) return ''
  
  let metricsText = '0 -20 Td\n/F1 12 Tf\n(Key Financial Metrics:) Tj\n0 -20 Td\n/F1 10 Tf\n'
  
  // Format different types of metrics
  if (metrics.years && Array.isArray(metrics.years)) {
    metricsText += `(Years Analyzed: ${metrics.years.join(', ')}) Tj\n0 -15 Td\n`
  }
  
  if (metrics.revenue && Array.isArray(metrics.revenue)) {
    const avgRevenue = metrics.revenue.reduce((a: number, b: number) => a + b, 0) / metrics.revenue.length
    metricsText += `(Average Revenue: $${avgRevenue.toLocaleString()}) Tj\n0 -15 Td\n`
  }
  
  if (metrics.netIncome && Array.isArray(metrics.netIncome)) {
    const avgIncome = metrics.netIncome.reduce((a: number, b: number) => a + b, 0) / metrics.netIncome.length
    metricsText += `(Average Net Income: $${avgIncome.toLocaleString()}) Tj\n0 -15 Td\n`
  }
  
  if (metrics.totalAssets && Array.isArray(metrics.totalAssets)) {
    const avgAssets = metrics.totalAssets.reduce((a: number, b: number) => a + b, 0) / metrics.totalAssets.length
    metricsText += `(Average Total Assets: $${avgAssets.toLocaleString()}) Tj\n0 -15 Td\n`
  }
  
  return metricsText
}
