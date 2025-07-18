export function formatMarkdown(text: string): string {
  if (!text) return ""

  return (
    text
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Convert `code` to <code>
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Convert line breaks
      .replace(/\n/g, "<br>")
      // Convert bullet points
      .replace(/^\s*[-*+]\s(.+)$/gm, "<li>$1</li>")
      // Wrap lists
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      // Convert headers
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
  )
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
          markdown += `<strong>Value:</strong> ${metric.value}\n`
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
          markdown += `<strong>Current Value:</strong> ${metric.currentValue}\n`
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
