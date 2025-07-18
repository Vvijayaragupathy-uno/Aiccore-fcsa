export function formatMarkdown(text: string): string {
  if (!text) return ""

  // Basic markdown formatting
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>")

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
    markdown += `# Executive Summary\n\n`

    if (exec.overallHealth) {
      markdown += `**Overall Health:** ${exec.overallHealth}\n\n`
    }

    if (exec.creditGrade) {
      markdown += `**Credit Grade:** ${exec.creditGrade}\n\n`
    }

    if (exec.gradeExplanation) {
      markdown += `**Grade Explanation:**\n${exec.gradeExplanation}\n\n`
    }

    if (exec.standardPrinciples) {
      markdown += `**Standard Principles:**\n${exec.standardPrinciples}\n\n`
    }

    if (exec.keyStrengths && exec.keyStrengths.length > 0) {
      markdown += `**Key Strengths:**\n`
      exec.keyStrengths.forEach((strength: string) => {
        markdown += `• ${strength}\n`
      })
      markdown += "\n"
    }

    if (exec.criticalWeaknesses && exec.criticalWeaknesses.length > 0) {
      markdown += `**Critical Weaknesses:**\n`
      exec.criticalWeaknesses.forEach((weakness: string) => {
        markdown += `• ${weakness}\n`
      })
      markdown += "\n"
    }

    if (exec.riskLevel) {
      markdown += `**Risk Level:** ${exec.riskLevel}\n\n`
    }

    if (exec.creditRecommendation) {
      markdown += `**Credit Recommendation:** ${exec.creditRecommendation}\n\n`
    }
  }

  // Sections
  if (analysis.sections && analysis.sections.length > 0) {
    analysis.sections.forEach((section: any) => {
      markdown += `# ${section.title}\n\n`

      if (section.summary) {
        markdown += `**Summary:** ${section.summary}\n\n`
      }

      if (section.narrative) {
        markdown += `## Analysis\n\n${section.narrative}\n\n`
      }

      // Handle metrics
      if (section.metrics && section.metrics.length > 0) {
        markdown += `## Key Metrics\n\n`
        section.metrics.forEach((metric: any) => {
          markdown += `### ${metric.name}\n`
          markdown += `**Value:** ${metric.value}\n`
          if (metric.trend) {
            markdown += `**Trend:** ${metric.trend}\n`
          }
          if (metric.analysis) {
            markdown += `**Analysis:** ${metric.analysis}\n`
          }
          markdown += "\n"
        })
      }

      // Handle credit factors (for 5 C's section)
      if (section.creditFactors && section.creditFactors.length > 0) {
        markdown += `## Credit Factors Assessment\n\n`
        section.creditFactors.forEach((factor: any) => {
          markdown += `### ${factor.factor}\n`
          markdown += `**Assessment:** ${factor.assessment}\n`
          markdown += `**Score:** ${factor.score}\n`
          if (factor.supportingEvidence) {
            markdown += `**Supporting Evidence:** ${factor.supportingEvidence}\n`
          }
          markdown += "\n"
        })
      }

      // Handle compliance metrics
      if (section.complianceMetrics && section.complianceMetrics.length > 0) {
        markdown += `## Compliance Metrics\n\n`
        section.complianceMetrics.forEach((metric: any) => {
          markdown += `### ${metric.standard}\n`
          markdown += `**Current Value:** ${metric.currentValue}\n`
          markdown += `**Compliance Status:** ${metric.compliance}\n`
          if (metric.gapAnalysis) {
            markdown += `**Gap Analysis:** ${metric.gapAnalysis}\n`
          }
          markdown += "\n"
        })
      }

      // Handle recommendations
      if (section.recommendations && section.recommendations.length > 0) {
        markdown += `## Recommendations\n\n`
        section.recommendations.forEach((rec: any) => {
          markdown += `### ${rec.category}\n`
          markdown += `**Recommendation:** ${rec.recommendation}\n`
          markdown += `**Priority:** ${rec.priority}\n`
          markdown += `**Rationale:** ${rec.rationale}\n`
          if (rec.timeline) {
            markdown += `**Timeline:** ${rec.timeline}\n`
          }
          markdown += "\n"
        })
      }

      // Handle monitoring requirements
      if (section.monitoringRequirements && section.monitoringRequirements.length > 0) {
        markdown += `## Monitoring Requirements\n\n`
        section.monitoringRequirements.forEach((req: any) => {
          markdown += `### ${req.metric}\n`
          markdown += `**Frequency:** ${req.frequency}\n`
          markdown += `**Threshold:** ${req.threshold}\n`
          markdown += `**Action:** ${req.action}\n`
          markdown += "\n"
        })
      }

      // Handle key findings
      if (section.keyFindings && section.keyFindings.length > 0) {
        markdown += `## Key Findings\n\n`
        section.keyFindings.forEach((finding: string) => {
          markdown += `• ${finding}\n`
        })
        markdown += "\n"
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
