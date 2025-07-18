// Markdown formatting utilities for financial analysis responses

export function formatMarkdown(text: string): string {
  if (!text) return ""

  // Convert markdown-style formatting to HTML
  let formatted = text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')

    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')

    // Italic text
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')

    // Code blocks
    .replace(
      /```(.*?)```/gs,
      '<pre class="bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3"><code>$1</code></pre>',
    )

    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')

    // Lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')

    // Line breaks
    .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-4">')
    .replace(/\n/g, "<br>")

  // Wrap in paragraph tags if not already wrapped
  if (
    !formatted.includes("<p>") &&
    !formatted.includes("<h1>") &&
    !formatted.includes("<h2>") &&
    !formatted.includes("<h3>")
  ) {
    formatted = `<p class="text-gray-700 leading-relaxed mb-4">${formatted}</p>`
  }

  return formatted
}

export function extractAndFormatMetrics(text: string): Array<{
  label: string
  value: string
  trend?: "up" | "down" | "stable"
}> {
  const metrics: Array<{ label: string; value: string; trend?: "up" | "down" | "stable" }> = []

  // Extract common financial metrics
  const lines = text.split("\n")

  lines.forEach((line) => {
    // Look for currency amounts
    const currencyMatch = line.match(/\$[\d,]+/)
    if (currencyMatch) {
      const label = line.replace(currencyMatch[0], "").trim().replace(/[:-]/g, "").trim()
      if (label && label.length > 3) {
        metrics.push({
          label: label.substring(0, 50), // Limit length
          value: currencyMatch[0],
        })
      }
    }

    // Look for percentages
    const percentMatch = line.match(/\d+\.?\d*%/)
    if (percentMatch) {
      const label = line.replace(percentMatch[0], "").trim().replace(/[:-]/g, "").trim()
      if (label && label.length > 3) {
        metrics.push({
          label: label.substring(0, 50),
          value: percentMatch[0],
        })
      }
    }

    // Look for ratios
    const ratioMatch = line.match(/\d+\.?\d*:\d+\.?\d*/)
    if (ratioMatch) {
      const label = line.replace(ratioMatch[0], "").trim().replace(/[:-]/g, "").trim()
      if (label && label.length > 3) {
        metrics.push({
          label: label.substring(0, 50),
          value: ratioMatch[0],
        })
      }
    }
  })

  // Remove duplicates and limit to top 10
  const uniqueMetrics = metrics
    .filter((metric, index, self) => index === self.findIndex((m) => m.label === metric.label))
    .slice(0, 10)

  return uniqueMetrics
}

export function formatCombinedAnalysis(analysisText: string): string {
  const analysis = parseJsonSafely(analysisText)

  if (typeof analysis === "object" && analysis.executiveSummary && analysis.sections) {
    return formatStructuredAnalysis(analysis)
  }

  // Fallback to original text formatting
  return formatMarkdownText(analysisText)
}

function formatStructuredAnalysis(analysis: any): string {
  let markdown = ""

  // Executive Summary
  if (analysis.executiveSummary) {
    const exec = analysis.executiveSummary
    markdown += `<h1>Executive Summary</h1>\n\n`

    if (exec.overallHealth) {
      markdown += `<strong>Overall Health:</strong> ${exec.overallHealth}\n\n`
    }

    if (exec.creditGrade) {
      markdown += `<strong>Credit Grade:</strong> ${exec.creditGrade}\n\n`
    }

    if (exec.gradeExplanation) {
      markdown += `<strong>Grade Explanation:</strong>\n${exec.gradeExplanation}\n\n`
    }

    if (exec.standardPrinciples) {
      markdown += `<strong>Standard Principles:</strong>\n${exec.standardPrinciples}\n\n`
    }

    if (exec.keyStrengths && exec.keyStrengths.length > 0) {
      markdown += `<strong>Key Strengths:</strong>\n<ul>`
      exec.keyStrengths.forEach((strength: string) => {
        markdown += `<li>${strength}</li>`
      })
      markdown += `</ul>\n\n`
    }

    if (exec.criticalWeaknesses && exec.criticalWeaknesses.length > 0) {
      markdown += `<strong>Critical Weaknesses:</strong>\n<ul>`
      exec.criticalWeaknesses.forEach((weakness: string) => {
        markdown += `<li>${weakness}</li>`
      })
      markdown += `</ul>\n\n`
    }

    if (exec.riskLevel) {
      markdown += `<strong>Risk Level:</strong> ${exec.riskLevel}\n\n`
    }

    if (exec.creditRecommendation) {
      markdown += `<strong>Credit Recommendation:</strong> ${exec.creditRecommendation}\n\n`
    }
  }

  // Sections
  if (analysis.sections && analysis.sections.length > 0) {
    analysis.sections.forEach((section: any) => {
      markdown += `<h1>${section.title}</h1>\n\n`

      if (section.summary) {
        markdown += `<strong>Summary:</strong> ${section.summary}\n\n`
      }

      if (section.narrative) {
        markdown += `<h2>Analysis</h2>\n\n${section.narrative}\n\n`
      }

      // Handle metrics
      if (section.metrics && section.metrics.length > 0) {
        markdown += `<h2>Key Metrics</h2>\n\n`
        section.metrics.forEach((metric: any) => {
          markdown += `<h3>${metric.name}</h3>\n`
          markdown += `<strong>Value:</strong> ${formatCurrency(metric.value)}\n`
          if (metric.trend) {
            markdown += `<strong>Trend:</strong> ${metric.trend}\n`
          }
          if (metric.analysis) {
            markdown += `<strong>Analysis:</strong> ${metric.analysis}\n`
          }
          markdown += "\n"
        })
      }

      // Handle credit factors (for 5 C's section)
      if (section.creditFactors && section.creditFactors.length > 0) {
        markdown += `<h2>Credit Factors Assessment</h2>\n\n`
        section.creditFactors.forEach((factor: any) => {
          markdown += `<h3>${factor.factor}</h3>\n`
          markdown += `<strong>Assessment:</strong> ${factor.assessment}\n`
          markdown += `<strong>Score:</strong> ${factor.score}\n`
          if (factor.supportingEvidence) {
            markdown += `<strong>Supporting Evidence:</strong> ${factor.supportingEvidence}\n`
          }
          markdown += "\n"
        })
      }

      // Handle compliance metrics
      if (section.complianceMetrics && section.complianceMetrics.length > 0) {
        markdown += `<h2>Compliance Metrics</h2>\n\n`
        section.complianceMetrics.forEach((metric: any) => {
          markdown += `<h3>${metric.standard}</h3>\n`
          markdown += `<strong>Current Value:</strong> ${formatCurrency(metric.currentValue)}\n`
          markdown += `<strong>Compliance Status:</strong> ${metric.compliance}\n`
          if (metric.gapAnalysis) {
            markdown += `<strong>Gap Analysis:</strong> ${metric.gapAnalysis}\n`
          }
          markdown += "\n"
        })
      }

      // Handle recommendations
      if (section.recommendations && section.recommendations.length > 0) {
        markdown += `<h2>Recommendations</h2>\n\n`
        section.recommendations.forEach((rec: any) => {
          markdown += `<h3>${rec.category}</h3>\n`
          markdown += `<strong>Recommendation:</strong> ${rec.recommendation}\n`
          markdown += `<strong>Priority:</strong> ${rec.priority}\n`
          markdown += `<strong>Rationale:</strong> ${rec.rationale}\n`
          if (rec.timeline) {
            markdown += `<strong>Timeline:</strong> ${rec.timeline}\n`
          }
          markdown += "\n"
        })
      }

      // Handle monitoring requirements
      if (section.monitoringRequirements && section.monitoringRequirements.length > 0) {
        markdown += `<h2>Monitoring Requirements</h2>\n\n`
        section.monitoringRequirements.forEach((req: any) => {
          markdown += `<h3>${req.metric}</h3>\n`
          markdown += `<strong>Frequency:</strong> ${req.frequency}\n`
          markdown += `<strong>Threshold:</strong> ${req.threshold}\n`
          markdown += `<strong>Action:</strong> ${req.action}\n`
          markdown += "\n"
        })
      }

      // Handle key findings
      if (section.keyFindings && section.keyFindings.length > 0) {
        markdown += `<h2>Key Findings</h2>\n\n<ul>`
        section.keyFindings.forEach((finding: string) => {
          markdown += `<li>${finding}</li>`
        })
        markdown += `</ul>\n\n`
      }

      markdown += "---\n\n"
    })
  }

  return markdown
}

function formatMarkdownText(text: string): string {
  // Clean up the text
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "**$1**")
    .replace(/\*(.*?)\*/g, "*$1*")
    .replace(/#{1,6}\s/g, (match) => match)
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  // Ensure proper spacing around headers
  formatted = formatted.replace(/^(#{1,6}\s.*$)/gm, "\n$1\n")

  // Clean up extra newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n").trim()

  return formatted
}

export function formatIncomeStatementAnalysis(analysisText: string): string {
  return formatCombinedAnalysis(analysisText)
}

export function formatBalanceSheetAnalysis(analysisText: string): string {
  return formatCombinedAnalysis(analysisText)
}

export function parseJsonSafely(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function stripMarkdown(text: string): string {
  if (!text) return ""

  return text
    .replace(/^#{1,6}\s+/gm, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/```.*?```/gs, "") // Remove code blocks
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/^\* /gm, "") // Remove list markers
    .replace(/^- /gm, "") // Remove list markers
    .replace(/\n{2,}/g, "\n") // Normalize line breaks
    .trim()
}

export function truncateText(text: string, maxLength = 200): string {
  if (!text || text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}

export function extractSummary(text: string, sentences = 2): string {
  if (!text) return ""

  const sentenceEnders = /[.!?]+/g
  const sentenceArray = text.split(sentenceEnders).filter((s) => s.trim().length > 0)

  return sentenceArray.slice(0, sentences).join(". ") + (sentenceArray.length > sentences ? "." : "")
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount.replace(/[,$]/g, "")) : amount

  if (isNaN(num)) return amount.toString()

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatPercentage(value: number | string): string {
  const num = typeof value === "string" ? Number.parseFloat(value.replace(/[%]/g, "")) : value

  if (isNaN(num)) return value.toString()

  return `${num.toFixed(1)}%`
}

export function formatRatio(numerator: number, denominator: number): string {
  if (denominator === 0) return "N/A"

  const ratio = numerator / denominator
  return `${ratio.toFixed(2)}:1`
}
