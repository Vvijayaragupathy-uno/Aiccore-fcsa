import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const { analysis, metrics, reportType } = await request.json()

    // Generate PDF report using pdf-lib
    const reportData = {
      title: `${reportType} Analysis Report`,
      date: new Date().toISOString().split("T")[0],
      analysis,
      metrics
    }

    // Generate an actual PDF using pdf-lib
    const pdfBuffer = await generatePDFReport(reportData)

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

async function generatePDFReport(data: any): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  
  // Add a page to the document
  const page = pdfDoc.addPage()
  
  // Get the standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Set page dimensions
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin
  
  // Add title
  page.drawText(data.title, {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  
  // Add date
  y -= 30
  page.drawText(`Generated: ${data.date}`, {
    x: margin,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  })
  
  // Add analysis section title
  y -= 40
  page.drawText('Financial Analysis Summary', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  
  // Add analysis content
  y -= 20
  const analysisText = formatAnalysisForPDF(data.analysis)
  const lines = splitTextIntoLines(analysisText, 80)
  
  for (const line of lines) {
    if (y < margin + 50) {
      // Add a new page if we're running out of space
      page = pdfDoc.addPage()
      y = height - margin
    }
    
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    })
    
    y -= 15
  }
  
  // Add metrics section
  y -= 20
  if (y < margin + 100) {
    // Add a new page if we're running out of space
    page = pdfDoc.addPage()
    y = height - margin
  }
  
  page.drawText('Key Financial Metrics', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  
  // Add metrics content
  y -= 20
  const metricsLines = formatMetricsForPDF(data.metrics)
  
  for (const line of metricsLines) {
    if (y < margin + 50) {
      // Add a new page if we're running out of space
      page = pdfDoc.addPage()
      y = height - margin
    }
    
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    })
    
    y -= 15
  }
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save()
  
  return Buffer.from(pdfBytes)
}

function formatAnalysisForPDF(analysis: any): string {
  if (!analysis) return ''
  
  // Handle both JSON and text formats
  let textContent = ''
  if (typeof analysis === 'string') {
    textContent = analysis
  } else if (typeof analysis === 'object') {
    // Extract text from JSON structure
    if (analysis.executiveSummary?.overallHealth) {
      textContent += 'Overall Health: ' + analysis.executiveSummary.overallHealth + '\n\n'
    }
    
    if (analysis.executiveSummary?.creditGrade) {
      textContent += 'Credit Grade: ' + analysis.executiveSummary.creditGrade + '\n\n'
    }
    
    if (analysis.executiveSummary?.gradeExplanation) {
      textContent += analysis.executiveSummary.gradeExplanation + '\n\n'
    }
    
    if (analysis.executiveSummary?.keyStrengths) {
      textContent += 'Key Strengths:\n'
      analysis.executiveSummary.keyStrengths.forEach((strength: string) => {
        textContent += '• ' + strength + '\n'
      })
      textContent += '\n'
    }
    
    if (analysis.executiveSummary?.criticalWeaknesses) {
      textContent += 'Critical Weaknesses:\n'
      analysis.executiveSummary.criticalWeaknesses.forEach((weakness: string) => {
        textContent += '• ' + weakness + '\n'
      })
      textContent += '\n'
    }
    
    if (analysis.sections) {
      analysis.sections.forEach((section: any, index: number) => {
        textContent += `${index + 1}. ${section.title || 'Section ' + (index + 1)}\n`
        
        if (section.summary) {
          textContent += section.summary + '\n\n'
        }
        
        if (section.keyFindings) {
          section.keyFindings.forEach((finding: string) => {
            textContent += '• ' + finding + '\n'
          })
          textContent += '\n'
        }
      })
    }
  }
  
  // Clean and format analysis text for PDF
  return textContent
    .replace(/[()\\]/g, '') // Remove PDF special characters
    .substring(0, 5000) // Limit length for preview
}

function formatMetricsForPDF(metrics: any): string[] {
  if (!metrics) return []
  
  const lines: string[] = []
  
  // Format different types of metrics
  if (metrics.years && Array.isArray(metrics.years)) {
    lines.push(`Years Analyzed: ${metrics.years.join(', ')}`)
  }
  
  // Add common metrics with averages
  const metricKeys = [
    { key: 'grossFarmIncome', label: 'Gross Farm Income' },
    { key: 'grossIncome', label: 'Gross Income' },
    { key: 'netFarmIncome', label: 'Net Farm Income' },
    { key: 'netIncome', label: 'Net Income' },
    { key: 'currentAssets', label: 'Current Assets' },
    { key: 'currentLiabilities', label: 'Current Liabilities' },
    { key: 'totalAssets', label: 'Total Assets' },
    { key: 'totalEquity', label: 'Total Equity' },
    { key: 'currentRatio', label: 'Current Ratio' },
    { key: 'debtServiceCoverage', label: 'Debt Service Coverage' },
    { key: 'returnOnAssets', label: 'Return on Assets' },
    { key: 'returnOnEquity', label: 'Return on Equity' }
  ]
  
  metricKeys.forEach(({ key, label }) => {
    if (metrics[key] && Array.isArray(metrics[key]) && metrics[key].length > 0) {
      const values = metrics[key]
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
      
      if (key.includes('Ratio') || key.includes('Coverage') || key.includes('Return')) {
        // Format ratios with 2 decimal places
        lines.push(`${label}: ${avg.toFixed(2)}`)
      } else {
        // Format monetary values with commas
        lines.push(`${label}: ${Math.round(avg).toLocaleString()}`)
      }
    }
  })
  
  return lines
}

function splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    
    let currentLine = ''
    const words = paragraph.split(' ')
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
  }
  
  return lines
}