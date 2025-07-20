// Markdown and text formatting utilities

export function formatMarkdown(text: string): string {
  if (!text) return ""

  let formatted = text

  // Escape HTML entities first to prevent XSS
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Convert line breaks to <br> for processing
  formatted = formatted.replace(/\n/g, '<br>')

  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Convert *italic* to <em> (but not if it's already in bold)
  formatted = formatted.replace(/(?<!<strong>.*)\*([^*]+?)\*(?!.*<\/strong>)/g, "<em>$1</em>")

  // Convert ### headers to h3
  formatted = formatted.replace(/^### (.*$)/gim, "<h3 class='text-lg font-semibold mt-4 mb-2 text-gray-900'>$1</h3>")

  // Convert ## headers to h2
  formatted = formatted.replace(/^## (.*$)/gim, "<h2 class='text-xl font-bold mt-6 mb-3 text-gray-900'>$1</h2>")

  // Convert # headers to h1
  formatted = formatted.replace(/^# (.*$)/gim, "<h1 class='text-2xl font-bold mt-6 mb-4 text-gray-900'>$1</h1>")

  // Convert bullet points with proper nesting
  const lines = formatted.split('<br>')
  let inList = false
  let inOrderedList = false
  let processedLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.match(/^[-*•] /)) {
      if (!inList) {
        if (inOrderedList) {
          processedLines.push('</ol>')
          inOrderedList = false
        }
        processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">')
        inList = true
      }
      const content = line.replace(/^[-*•] /, '')
      processedLines.push(`<li class="text-gray-700">${content}</li>`)
    } else if (line.match(/^\d+\. /)) {
      if (!inOrderedList) {
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        processedLines.push('<ol class="list-decimal list-inside space-y-1 my-2">')
        inOrderedList = true
      }
      const content = line.replace(/^\d+\. /, '')
      processedLines.push(`<li class="text-gray-700">${content}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (inOrderedList) {
        processedLines.push('</ol>')
        inOrderedList = false
      }
      if (line) {
        processedLines.push(`<p class="mb-2 text-gray-800 leading-relaxed">${line}</p>`)
      }
    }
  }

  if (inList) {
    processedLines.push('</ul>')
  }
  if (inOrderedList) {
    processedLines.push('</ol>')
  }

  formatted = processedLines.join('')

  // Format currency values
  formatted = formatCurrency(formatted)

  // Format percentages
  formatted = formatPercentages(formatted)

  // Format ratios
  formatted = formatRatios(formatted)

  // Format financial metrics
  formatted = formatFinancialMetrics(formatted)

  return formatted
}

export function formatCurrency(text: string): string {
  // Format currency values like $1,234,567
  return text.replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '<span class="font-semibold text-green-600">$$$1</span>')
}

export function formatPercentages(text: string): string {
  // Format percentages like 15.5%
  return text.replace(/(\d+(?:\.\d+)?%)/g, '<span class="font-medium text-blue-600">$1</span>')
}

export function formatRatios(text: string): string {
  // Format ratios like 2.5:1 or 1.25x
  return text.replace(
    /(\d+(?:\.\d+)?:\d+(?:\.\d+)?|\d+(?:\.\d+)?x)/g,
    '<span class="font-medium text-purple-600">$1</span>',
  )
}

export function formatFinancialMetrics(text: string): string {
  let formatted = text

  // Highlight key financial terms
  const financialTerms = [
    "Current Ratio",
    "Quick Ratio",
    "Debt-to-Equity",
    "Return on Assets",
    "Return on Equity",
    "Working Capital",
    "EBITDA",
    "Net Income",
    "Gross Profit",
    "Operating Income",
    "Total Assets",
    "Total Liabilities",
    "Shareholders Equity",
    "Cash Flow",
  ]

  financialTerms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "gi")
    formatted = formatted.replace(regex, `<span class="font-semibold text-indigo-600">${term}</span>`)
  })

  return formatted
}

export function createSummaryText(analysis: any): string {
  if (!analysis) return ""

  let summary = ""

  if (analysis.executiveSummary) {
    summary += `<h3 class="text-lg font-semibold mb-2">Executive Summary</h3>`
    summary += `<p class="mb-4">${analysis.executiveSummary.overallHealth}</p>`

    if (analysis.executiveSummary.creditGrade) {
      summary += `<p class="mb-2"><strong>Credit Grade:</strong> <span class="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">${analysis.executiveSummary.creditGrade}</span></p>`
    }

    if (analysis.executiveSummary.riskLevel) {
      const riskColor =
        analysis.executiveSummary.riskLevel === "Low"
          ? "green"
          : analysis.executiveSummary.riskLevel === "Medium"
            ? "yellow"
            : "red"
      summary += `<p class="mb-4"><strong>Risk Level:</strong> <span class="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-${riskColor}-100 text-${riskColor}-800">${analysis.executiveSummary.riskLevel}</span></p>`
    }
  }

  return summary
}

export function formatAnalysisSection(section: any): string {
  if (!section) return ""

  let formatted = `<div class="mb-6 p-4 border rounded-lg bg-white shadow-sm">`
  formatted += `<h4 class="text-lg font-semibold mb-3">${section.title}</h4>`

  if (section.summary) {
    formatted += `<p class="mb-4 text-gray-700">${section.summary}</p>`
  }

  if (section.metrics && section.metrics.length > 0) {
    formatted += `<div class="space-y-3">`
    section.metrics.forEach((metric: any) => {
      formatted += `<div class="bg-gray-50 p-3 rounded">`
      formatted += `<h5 class="font-medium mb-1">${metric.name}</h5>`
      if (metric.currentValue) {
        formatted += `<p class="text-lg font-semibold text-blue-600 mb-1">${metric.currentValue}</p>`
      }
      if (metric.analysis) {
        formatted += `<p class="text-sm text-gray-600">${metric.analysis}</p>`
      }
      formatted += `</div>`
    })
    formatted += `</div>`
  }

  if (section.keyFindings && section.keyFindings.length > 0) {
    formatted += `<div class="mt-4">`
    formatted += `<h5 class="font-medium mb-2">Key Findings:</h5>`
    formatted += `<ul class="list-disc list-inside space-y-1">`
    section.keyFindings.forEach((finding: string) => {
      formatted += `<li class="text-sm text-gray-700">${finding}</li>`
    })
    formatted += `</ul></div>`
  }

  formatted += `</div>`
  return formatted
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

export function truncateText(text: string, maxLength = 200): string {
  if (!text || text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}

export function highlightKeywords(text: string, keywords: string[]): string {
  let highlighted = text

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    highlighted = highlighted.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">$&</mark>`)
  })

  return highlighted
}

export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString()
}

export function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercentageValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatRatioValue(numerator: number, denominator: number): string {
  if (denominator === 0) return "N/A"
  const ratio = numerator / denominator
  return `${ratio.toFixed(2)}:1`
}

// Export all utilities
export const MarkdownUtils = {
  formatMarkdown,
  formatCurrency,
  formatPercentages,
  formatRatios,
  formatFinancialMetrics,
  createSummaryText,
  formatAnalysisSection,
  stripHtml,
  truncateText,
  highlightKeywords,
  formatNumberWithCommas,
  formatCurrencyValue,
  formatPercentageValue,
  formatRatioValue,
}
