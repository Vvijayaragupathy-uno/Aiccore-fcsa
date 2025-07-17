import * as XLSX from "xlsx"

// Utility functions for processing uploaded files with consistent data handling
export async function processExcelFile(file: File): Promise<{ data: string; hash: string }> {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
      raw: false
    })
    
    // Always use the first sheet for consistency
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON with consistent formatting
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: ''
    })
    
    // Filter out completely empty rows for consistency
    const filteredData = jsonData.filter((row: any) => 
      Array.isArray(row) && row.some(cell => 
        cell !== null && cell !== undefined && cell !== '' && cell.toString().trim() !== ''
      )
    )
    
    // Sort data to ensure consistent ordering
    const sortedData = filteredData.sort((a: any, b: any) => {
      // Sort by first non-empty cell in each row
      const aFirst = a.find((cell: any) => cell !== null && cell !== undefined && cell !== '')
      const bFirst = b.find((cell: any) => cell !== null && cell !== undefined && cell !== '')
      return String(aFirst || '').localeCompare(String(bFirst || ''))
    })
    
    const dataString = JSON.stringify(sortedData, null, 2)
    
    // Create consistent hash for duplicate detection
    const hashInput = file.name + file.size + dataString
    const encoder = new TextEncoder()
    const data = encoder.encode(hashInput)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
    
    return { data: dataString, hash }
  } catch (error) {
    console.error('Excel processing error:', error)
    throw new Error('Failed to process Excel file')
  }
}

export async function processPDFFile(file: File): Promise<{ data: string; hash: string }> {
  try {
    // Convert PDF to text using browser-compatible approach
    const arrayBuffer = await file.arrayBuffer()
    
    // For now, we'll extract basic file information and attempt to read any text
    // In a full implementation, you would use a PDF parsing library like pdf-parse or PDF.js
    let extractedText = `PDF Document: ${file.name}\n`
    extractedText += `File Size: ${file.size} bytes\n`
    extractedText += `Last Modified: ${new Date(file.lastModified).toISOString()}\n\n`
    
    // Try to extract basic text content (this is a simplified approach)
    // In production, use proper PDF parsing libraries
    const uint8Array = new Uint8Array(arrayBuffer)
    const textDecoder = new TextDecoder('utf-8', { fatal: false })
    let rawText = ''
    
    try {
      rawText = textDecoder.decode(uint8Array)
    } catch {
      // If UTF-8 decoding fails, try with latin1
      const latin1Decoder = new TextDecoder('latin1')
      rawText = latin1Decoder.decode(uint8Array)
    }
    
    // Extract readable text patterns from PDF content
    const textPatterns = rawText.match(/[A-Za-z][A-Za-z0-9\s.,;:!?()-]{10,}/g) || []
    const cleanText = textPatterns
      .filter(text => {
        // Filter out binary data and keep meaningful text
        return !/[\x00-\x08\x0E-\x1F\x7F-\xFF]{3,}/.test(text) && 
               text.trim().length > 10 &&
               /[a-zA-Z]/.test(text)
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (cleanText.length > 50) {
      extractedText += `Extracted Content:\n${cleanText.substring(0, 2000)}...`
    } else {
      extractedText += 'Note: This PDF may contain images or complex formatting. For best results, please convert to Excel format or ensure the PDF contains selectable text.'
    }
    
    // Create hash based on actual content
    const hashInput = file.name + file.size + file.lastModified + extractedText.substring(0, 500)
    const encoder = new TextEncoder()
    const data = encoder.encode(hashInput)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
    
    return { data: extractedText, hash }
  } catch (error) {
    console.error('Error processing PDF:', error)
    
    // Fallback: return basic file info
    const fallbackData = `PDF file: ${file.name} (${file.size} bytes)\nError: Could not extract text content. Please ensure the PDF contains selectable text or convert to Excel format.`
    
    const hashInput = file.name + file.size + file.lastModified
    const encoder = new TextEncoder()
    const data = encoder.encode(hashInput)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
    
    return { data: fallbackData, hash }
  }
}

// Remove markdown formatting from AI responses
export function cleanMarkdownFormatting(text: string): string {
  return text
    // Remove markdown headers
    .replace(/#{1,6}\s+/g, '')
    // Remove bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic formatting
    .replace(/\*(.*?)\*/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim()
}

// Create consistent file fingerprint for duplicate detection
export async function createFileFingerprint(file: File, extractedData?: string): Promise<string> {
  const baseData = `${file.name}-${file.size}-${file.lastModified}`
  const hashInput = extractedData ? baseData + extractedData : baseData
  
  const encoder = new TextEncoder()
  const data = encoder.encode(hashInput)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 20)
}

export function extractFinancialData(content: string) {
  try {
    // Parse the content to extract actual financial data
    const data = {
      years: [] as number[],
      revenue: [] as number[],
      netIncome: [] as number[],
      currentAssets: [] as number[],
      currentLiabilities: [] as number[],
      totalAssets: [] as number[],
      totalEquity: [] as number[],
    }

    let parsedData: any[][] = []
    
    // Try to parse as JSON (from Excel processing)
    try {
      parsedData = JSON.parse(content)
    } catch {
      // If not JSON, treat as plain text and convert to array format
      const lines = content.split('\n').filter(line => line.trim())
      parsedData = lines.map(line => line.split(/\s+|\t+|,+/).filter(cell => cell.trim()))
    }

    // Extract years from the data
    const years = new Set<number>()
    parsedData.forEach(row => {
      row.forEach(cell => {
        const cellStr = String(cell).trim()
        const yearMatch = cellStr.match(/\b(20[0-9]{2})\b/)
        if (yearMatch) {
          years.add(parseInt(yearMatch[1]))
        }
      })
    })
    data.years = Array.from(years).sort()

    // Helper function to extract numbers from cells
    const extractNumber = (cell: any): number => {
      if (typeof cell === 'number') return cell
      const cellStr = String(cell).replace(/[,$%]/g, '').trim()
      const num = parseFloat(cellStr)
      return isNaN(num) ? 0 : num
    }

    // Helper function to find rows containing specific keywords
    const findRowsWithKeywords = (keywords: string[]): number[][] => {
      const matchingRows: number[][] = []
      parsedData.forEach((row, rowIndex) => {
        const rowText = row.join(' ').toLowerCase()
        if (keywords.some(keyword => rowText.includes(keyword.toLowerCase()))) {
          // Extract numbers from this row
          const numbers = row.map(extractNumber).filter(num => num > 0)
          if (numbers.length > 0) {
            matchingRows.push(numbers)
          }
        }
      })
      return matchingRows
    }

    // Extract different types of financial data
    const revenueRows = findRowsWithKeywords(['revenue', 'sales', 'gross income', 'total income', 'turnover'])
    const netIncomeRows = findRowsWithKeywords(['net income', 'net profit', 'profit after tax', 'earnings'])
    const currentAssetsRows = findRowsWithKeywords(['current assets', 'liquid assets', 'short term assets'])
    const currentLiabilitiesRows = findRowsWithKeywords(['current liabilities', 'short term debt', 'current debt'])
    const totalAssetsRows = findRowsWithKeywords(['total assets', 'assets'])
    const totalEquityRows = findRowsWithKeywords(['equity', 'shareholders equity', 'net worth', 'capital'])

    // Take the first matching row for each metric and use up to 3 values
    data.revenue = revenueRows.length > 0 ? revenueRows[0].slice(0, 3) : []
    data.netIncome = netIncomeRows.length > 0 ? netIncomeRows[0].slice(0, 3) : []
    data.currentAssets = currentAssetsRows.length > 0 ? currentAssetsRows[0].slice(0, 3) : []
    data.currentLiabilities = currentLiabilitiesRows.length > 0 ? currentLiabilitiesRows[0].slice(0, 3) : []
    data.totalAssets = totalAssetsRows.length > 0 ? totalAssetsRows[0].slice(0, 3) : []
    data.totalEquity = totalEquityRows.length > 0 ? totalEquityRows[0].slice(0, 3) : []

    // If no years found, use recent years as fallback
    if (data.years.length === 0) {
      const currentYear = new Date().getFullYear()
      data.years = [currentYear - 2, currentYear - 1, currentYear]
    }

    // Ensure we have at least some data for each metric (pad with zeros if needed)
    const ensureMinimumData = (arr: number[], targetLength: number = 3) => {
      while (arr.length < targetLength) {
        arr.push(0)
      }
      return arr.slice(0, targetLength)
    }

    // Ensure all arrays have the same length as years
    const targetLength = Math.max(data.years.length, 3)
    data.revenue = ensureMinimumData(data.revenue, targetLength)
    data.netIncome = ensureMinimumData(data.netIncome, targetLength)
    data.currentAssets = ensureMinimumData(data.currentAssets, targetLength)
    data.currentLiabilities = ensureMinimumData(data.currentLiabilities, targetLength)
    data.totalAssets = ensureMinimumData(data.totalAssets, targetLength)
    data.totalEquity = ensureMinimumData(data.totalEquity, targetLength)

    return data
  } catch (error) {
    console.error('Error extracting financial data:', error)
    // Return empty data structure on error
    const currentYear = new Date().getFullYear()
    return {
      years: [currentYear - 2, currentYear - 1, currentYear],
      revenue: [0, 0, 0],
      netIncome: [0, 0, 0],
      currentAssets: [0, 0, 0],
      currentLiabilities: [0, 0, 0],
      totalAssets: [0, 0, 0],
      totalEquity: [0, 0, 0],
    }
  }
}
