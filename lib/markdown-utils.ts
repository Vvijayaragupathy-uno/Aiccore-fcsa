export function formatMarkdown(text: string): string {
  if (!text) return ""

  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
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
