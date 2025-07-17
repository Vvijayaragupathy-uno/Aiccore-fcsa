export function formatMarkdown(text: string): string {
  if (!text) return ""

  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
    .replace(/^### (.*$)/gm, "<h3>$1</h3>") // H3 headers
    .replace(/^## (.*$)/gm, "<h2>$1</h2>") // H2 headers
    .replace(/^# (.*$)/gm, "<h1>$1</h1>") // H1 headers
    .replace(/^\* (.*$)/gm, "<li>$1</li>") // List items
    .replace(/^- (.*$)/gm, "<li>$1</li>") // List items
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>") // Numbered list items
    .replace(/\n\n/g, "</p><p>") // Paragraphs
    .replace(/^(?!<[h|l])/gm, "<p>") // Start paragraphs
    .replace(/(?<![>])$/gm, "</p>") // End paragraphs
    .replace(/<p><\/p>/g, "") // Remove empty paragraphs
    .replace(/<p>(<h[1-6]>)/g, "$1") // Fix headers in paragraphs
    .replace(/(<\/h[1-6]>)<\/p>/g, "$1") // Fix headers in paragraphs
    .replace(/<p>(<li>)/g, "<ul>$1") // Start lists
    .replace(/(<\/li>)<\/p>/g, "$1</ul>") // End lists
}

export function extractAndFormatMetrics(text: string): any[] {
  // Extract key metrics from analysis text
  const metrics = []
  const lines = text.split("\n")

  for (const line of lines) {
    // Look for ratio patterns
    const ratioMatch = line.match(/(\w+\s+ratio|coverage|margin):\s*([\d.]+)/i)
    if (ratioMatch) {
      metrics.push({
        name: ratioMatch[1],
        value: ratioMatch[2],
        type: "ratio",
      })
    }

    // Look for percentage patterns
    const percentMatch = line.match(/(\w+):\s*([\d.]+)%/i)
    if (percentMatch) {
      metrics.push({
        name: percentMatch[1],
        value: percentMatch[2] + "%",
        type: "percentage",
      })
    }

    // Look for dollar amounts
    const dollarMatch = line.match(/(\w+):\s*\$?([\d,]+)/i)
    if (dollarMatch) {
      metrics.push({
        name: dollarMatch[1],
        value: "$" + dollarMatch[2],
        type: "currency",
      })
    }
  }

  return metrics
}
