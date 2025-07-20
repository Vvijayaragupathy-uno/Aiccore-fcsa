"use client"

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  filename?: string
  title?: string
  subtitle?: string
  includeCharts?: boolean
  includeAnalysis?: boolean
  includeMetrics?: boolean
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
}

export interface AnalysisData {
  executiveSummary?: any
  sections?: any[]
  metrics?: any
  visualizationData?: any
  [key: string]: any
}

export class PDFExporter {
  private pdf: jsPDF
  private currentY: number = 20
  private pageHeight: number
  private pageWidth: number
  private margin: number = 20

  constructor(options: PDFExportOptions = {}) {
    const orientation = options.orientation || 'portrait'
    const format = options.format || 'a4'
    
    this.pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })
    
    this.pageHeight = this.pdf.internal.pageSize.height
    this.pageWidth = this.pdf.internal.pageSize.width
  }

  private checkPageBreak(height: number = 10): void {
    if (this.currentY + height > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.currentY = this.margin
    }
  }

  private addTitle(title: string, fontSize: number = 16): void {
    this.checkPageBreak(15)
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, this.margin, this.currentY)
    this.currentY += 10
  }

  private addSubtitle(subtitle: string, fontSize: number = 12): void {
    this.checkPageBreak(10)
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(100, 100, 100)
    this.pdf.text(subtitle, this.margin, this.currentY)
    this.pdf.setTextColor(0, 0, 0)
    this.currentY += 8
  }

  private addText(text: string, fontSize: number = 10, maxWidth?: number): void {
    this.checkPageBreak(8)
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'normal')
    
    const width = maxWidth || (this.pageWidth - 2 * this.margin)
    const lines = this.pdf.splitTextToSize(text, width)
    
    for (const line of lines) {
      this.checkPageBreak(6)
      this.pdf.text(line, this.margin, this.currentY)
      this.currentY += 5
    }
    this.currentY += 3
  }

  private addBulletPoint(text: string, fontSize: number = 10): void {
    this.checkPageBreak(8)
    this.pdf.setFontSize(fontSize)
    this.pdf.setFont('helvetica', 'normal')
    
    const bulletX = this.margin + 5
    const textX = this.margin + 10
    const width = this.pageWidth - textX - this.margin
    
    this.pdf.text('•', bulletX, this.currentY)
    
    const lines = this.pdf.splitTextToSize(text, width)
    for (const line of lines) {
      this.checkPageBreak(6)
      this.pdf.text(line, textX, this.currentY)
      this.currentY += 5
    }
    this.currentY += 2
  }

  private addSection(title: string, content: any): void {
    this.currentY += 5
    this.addTitle(title, 14)
    
    if (typeof content === 'string') {
      this.addText(content)
    } else if (content && typeof content === 'object') {
      if (content.summary) {
        this.addText(content.summary)
      }
      
      if (content.narrative) {
        this.addText(content.narrative)
      }
      
      if (content.keyFindings && Array.isArray(content.keyFindings)) {
        this.addSubtitle('Key Findings:')
        content.keyFindings.forEach((finding: string) => {
          this.addBulletPoint(finding)
        })
      }
      
      if (content.metrics && Array.isArray(content.metrics)) {
        this.addSubtitle('Metrics:')
        content.metrics.forEach((metric: any) => {
          const metricText = `${metric.name || metric.metric}: ${metric.value || metric.currentValue || 'N/A'}`
          if (metric.analysis) {
            this.addBulletPoint(`${metricText} - ${metric.analysis}`)
          } else {
            this.addBulletPoint(metricText)
          }
        })
      }
    }
  }

  private addExecutiveSummary(summary: any): void {
    if (!summary) return
    
    this.addTitle('Executive Summary', 16)
    
    if (summary.overallHealth) {
      this.addSubtitle('Overall Health:')
      this.addText(summary.overallHealth)
    }
    
    if (summary.creditGrade) {
      this.addSubtitle(`Credit Grade: ${summary.creditGrade}`)
      if (summary.gradeExplanation) {
        this.addText(summary.gradeExplanation)
      }
    }
    
    if (summary.keyStrengths && Array.isArray(summary.keyStrengths)) {
      this.addSubtitle('Key Strengths:')
      summary.keyStrengths.forEach((strength: string) => {
        this.addBulletPoint(strength)
      })
    }
    
    if (summary.criticalWeaknesses && Array.isArray(summary.criticalWeaknesses)) {
      this.addSubtitle('Critical Weaknesses:')
      summary.criticalWeaknesses.forEach((weakness: string) => {
        this.addBulletPoint(weakness)
      })
    }
    
    if (summary.riskLevel) {
      this.addSubtitle(`Risk Level: ${summary.riskLevel}`)
    }
    
    if (summary.creditRecommendation) {
      this.addSubtitle(`Credit Recommendation: ${summary.creditRecommendation}`)
    }
  }

  private addMetricsTable(metrics: any): void {
    if (!metrics) return
    
    this.addTitle('Financial Metrics', 14)
    
    // Create a simple table for key metrics
    const tableData: string[][] = []
    
    if (metrics.years && Array.isArray(metrics.years)) {
      const headers = ['Metric', ...metrics.years.map((year: number) => year.toString())]
      tableData.push(headers)
      
      // Add common metrics
      const metricKeys = [
        'grossFarmIncome', 'netFarmIncome', 'netIncome', 
        'totalAssets', 'totalEquity', 'currentRatio', 
        'debtServiceCoverage', 'returnOnAssets', 'returnOnEquity'
      ]
      
      metricKeys.forEach(key => {
        if (metrics[key] && Array.isArray(metrics[key])) {
          const row = [
            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            ...metrics[key].map((value: number) => 
              typeof value === 'number' ? value.toLocaleString() : value.toString()
            )
          ]
          tableData.push(row)
        }
      })
    }
    
    // Draw simple table
    if (tableData.length > 0) {
      const startY = this.currentY
      const cellHeight = 8
      const cellWidth = (this.pageWidth - 2 * this.margin) / tableData[0].length
      
      tableData.forEach((row, rowIndex) => {
        this.checkPageBreak(cellHeight)
        
        row.forEach((cell, colIndex) => {
          const x = this.margin + colIndex * cellWidth
          const y = this.currentY
          
          // Header row styling
          if (rowIndex === 0) {
            this.pdf.setFillColor(240, 240, 240)
            this.pdf.rect(x, y - 5, cellWidth, cellHeight, 'F')
            this.pdf.setFont('helvetica', 'bold')
          } else {
            this.pdf.setFont('helvetica', 'normal')
          }
          
          this.pdf.setFontSize(8)
          this.pdf.text(cell, x + 2, y)
          
          // Draw cell border
          this.pdf.rect(x, y - 5, cellWidth, cellHeight)
        })
        
        this.currentY += cellHeight
      })
      
      this.currentY += 5
    }
  }

  public async exportAnalysis(
    analysisData: AnalysisData, 
    options: PDFExportOptions = {}
  ): Promise<void> {
    const filename = options.filename || `financial-analysis-${new Date().toISOString().split('T')[0]}.pdf`
    const title = options.title || 'Financial Analysis Report'
    const subtitle = options.subtitle || `Generated on ${new Date().toLocaleDateString()}`
    
    // Add header
    this.addTitle(title, 18)
    this.addSubtitle(subtitle)
    this.currentY += 10
    
    // Add executive summary
    if (options.includeAnalysis !== false && analysisData.executiveSummary) {
      this.addExecutiveSummary(analysisData.executiveSummary)
    }
    
    // Add metrics table
    if (options.includeMetrics !== false && (analysisData.metrics || analysisData.visualizationData)) {
      const metricsData = analysisData.visualizationData || analysisData.metrics
      this.addMetricsTable(metricsData)
    }
    
    // Add analysis sections
    if (options.includeAnalysis !== false && analysisData.sections && Array.isArray(analysisData.sections)) {
      analysisData.sections.forEach((section: any, index: number) => {
        this.addSection(section.title || `Section ${index + 1}`, section)
      })
    }
    
    // Add 5 C's analysis if present
    if (analysisData.fiveCsAnalysis) {
      this.addTitle('5 C\'s of Credit Analysis', 14)
      Object.entries(analysisData.fiveCsAnalysis).forEach(([key, value]: [string, any]) => {
        this.addSubtitle(key.charAt(0).toUpperCase() + key.slice(1))
        if (value.assessment) {
          this.addText(value.assessment)
        }
        if (value.keyFactors && Array.isArray(value.keyFactors)) {
          value.keyFactors.forEach((factor: string) => {
            this.addBulletPoint(factor)
          })
        }
      })
    }
    
    // Save the PDF
    this.pdf.save(filename)
  }

  public async exportElementToPDF(
    elementId: string, 
    options: PDFExportOptions = {}
  ): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`)
    }
    
    const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.pdf`
    
    try {
      // Configure html2canvas for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = this.pageWidth - 2 * this.margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Check if image fits on one page
      if (imgHeight <= this.pageHeight - 2 * this.margin) {
        this.pdf.addImage(imgData, 'PNG', this.margin, this.margin, imgWidth, imgHeight)
      } else {
        // Split image across multiple pages
        let remainingHeight = imgHeight
        let sourceY = 0
        
        while (remainingHeight > 0) {
          const pageImgHeight = Math.min(remainingHeight, this.pageHeight - 2 * this.margin)
          const sourceHeight = (pageImgHeight * canvas.height) / imgHeight
          
          // Create a temporary canvas for this page section
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = sourceHeight
          
          const pageCtx = pageCanvas.getContext('2d')
          if (pageCtx) {
            pageCtx.drawImage(
              canvas, 
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            )
            
            const pageImgData = pageCanvas.toDataURL('image/png')
            this.pdf.addImage(pageImgData, 'PNG', this.margin, this.margin, imgWidth, pageImgHeight)
          }
          
          remainingHeight -= pageImgHeight
          sourceY += sourceHeight
          
          if (remainingHeight > 0) {
            this.pdf.addPage()
          }
        }
      }
      
      this.pdf.save(filename)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      throw new Error('Failed to export PDF. Please try again.')
    }
  }
}

// Utility functions for easy export
export async function exportAnalysisToPDF(
  analysisData: AnalysisData, 
  options: PDFExportOptions = {}
): Promise<void> {
  const exporter = new PDFExporter(options)
  await exporter.exportAnalysis(analysisData, options)
}

export async function exportElementToPDF(
  elementId: string, 
  options: PDFExportOptions = {}
): Promise<void> {
  const exporter = new PDFExporter(options)
  await exporter.exportElementToPDF(elementId, options)
}

// Hook for React components
export function usePDFExport() {
  const exportToPDF = async (
    data: AnalysisData | string, 
    options: PDFExportOptions = {}
  ) => {
    try {
      if (typeof data === 'string') {
        // Export DOM element
        await exportElementToPDF(data, options)
      } else {
        // Export analysis data
        await exportAnalysisToPDF(data, options)
      }
    } catch (error) {
      console.error('PDF export failed:', error)
      throw error
    }
  }
  
  return { exportToPDF }
}
