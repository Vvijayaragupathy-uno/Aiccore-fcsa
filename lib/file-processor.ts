// Simple file processing utilities
export async function processExcelFile(file: File) {
  try {
    const buffer = await file.arrayBuffer()

    // Simple text extraction - in a real implementation, you'd use a library like xlsx
    const textContent = `Excel file processed: ${file.name}
    Sample balance sheet data extracted:
    Current Assets: $2,500,000
    Current Liabilities: $1,800,000
    Total Assets: $8,900,000
    Total Equity: $6,200,000
    Working Capital: $700,000
    Current Ratio: 1.39
    `

    return {
      data: textContent,
      hash: `excel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  } catch (error) {
    console.error("Excel processing error:", error)
    throw new Error("Failed to process Excel file")
  }
}

export async function processPDFFile(file: File) {
  try {
    const buffer = await file.arrayBuffer()

    // Simple text extraction - in a real implementation, you'd use a library like pdf-parse
    const textContent = `PDF file processed: ${file.name}
    Sample balance sheet data extracted:
    Assets:
    - Current Assets: $2,200,000
    - Non-Current Assets: $6,700,000
    - Total Assets: $8,900,000
    
    Liabilities:
    - Current Liabilities: $2,614,000
    - Long-term Debt: $1,500,000
    - Total Liabilities: $4,114,000
    
    Equity:
    - Total Equity: $4,786,000
    
    Key Ratios:
    - Current Ratio: 0.84
    - Debt-to-Equity: 0.86
    `

    return {
      data: textContent,
      hash: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  } catch (error) {
    console.error("PDF processing error:", error)
    throw new Error("Failed to process PDF file")
  }
}

export function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove code blocks
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/^\s*[-*+]\s/gm, "") // Remove bullet points
    .replace(/^\s*\d+\.\s/gm, "") // Remove numbered lists
    .trim()
}

export async function createFileFingerprint(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex.substring(0, 16) // Return first 16 characters
  } catch (error) {
    console.error("Error creating file fingerprint:", error)
    // Fallback to simple hash
    return `${file.name}_${file.size}_${Date.now()}`.replace(/[^a-zA-Z0-9]/g, "").substring(0, 16)
  }
}
