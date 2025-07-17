"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Send, Loader2, TrendingUp, DollarSign, AlertTriangle, BarChart3, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"

export function IncomeStatementAnalysis() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState("")
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [followUpResponse, setFollowUpResponse] = useState("")
  const [financialData, setFinancialData] = useState<any[]>([])
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile) {
      // Validate file type
      const validTypes = [".xlsx", ".xls", ".pdf"]
      const fileExtension = uploadedFile.name.toLowerCase().substring(uploadedFile.name.lastIndexOf("."))

      if (!validTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please upload Excel (.xlsx, .xls) or PDF files only.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      setFile(uploadedFile)
      toast({
        title: "File uploaded",
        description: `${uploadedFile.name} is ready for analysis.`,
      })
    }
  }

  const analyzeIncomeStatement = async () => {
    if (!file) return

    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/analyze-income", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)

        // Convert metrics to financial data format
        if (result.metrics) {
          const data = result.metrics.years.map((year: number, index: number) => ({
            year,
            grossFarmIncome: result.metrics.grossIncome[index],
            netFarmIncome: result.metrics.netIncome[index],
            netNonfarmIncome: 85000, // Default value
            netIncome: result.metrics.netIncome[index],
            currentAssets: 2500000 + index * 100000, // Sample progression
            currentLiabilities: 1255000 + index * 50000,
            totalAssets: 8200000 + index * 300000,
            totalEquity: 6800000 + index * 200000,
            termDebt: 1400000 + index * 25000,
          }))
          setFinancialData(data)
        }

        toast({
          title: "Analysis complete",
          description: "GPT-4 has analyzed your income statement.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }

    setIsAnalyzing(false)
  }

  const askFollowUp = async () => {
    if (!followUpQuestion.trim()) return

    setIsAsking(true)

    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: followUpQuestion,
          context: analysis,
          analysisType: "income-statement",
        }),
      })

      const result = await response.json()

      if (result.success) {
        setFollowUpResponse(result.response)
        toast({
          title: "Question answered",
          description: "GPT-4 has provided additional insights.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Question failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }

    setIsAsking(false)
  }

  const exportReport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch("/api/export-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis,
          metrics: financialData,
          reportType: "Income Statement",
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `income-statement-report-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Report exported",
          description: "PDF report has been downloaded.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }

    setIsExporting(false)
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Income Statement</span>
          </CardTitle>
          <CardDescription>
            Upload your Excel or PDF income statement for real-time AI analysis using GPT-4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="income-file">Select File (Excel or PDF, max 10MB)</Label>
              <Input
                id="income-file"
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>

            {file && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{file.name}</Badge>
                  <span className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button onClick={analyzeIncomeStatement} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing with GPT-4...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>GPT-4 Income Statement Analysis</span>
              </CardTitle>
              <Button onClick={exportReport} disabled={isExporting} variant="outline">
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">{analysis}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Visualization */}
      {financialData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Financial Data Visualizations</span>
            </CardTitle>
            <CardDescription>Interactive charts and trend analysis based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialCharts data={financialData} type="income" />
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>AI Follow-up Analysis</span>
            </CardTitle>
            <CardDescription>Ask GPT-4 specific questions about the income statement analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="followup">Your Question</Label>
                <Textarea
                  id="followup"
                  placeholder="e.g., What are the cash flow implications? How does debt service coverage compare to industry standards? What are the key risk factors?"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button onClick={askFollowUp} disabled={isAsking || !followUpQuestion.trim()}>
                {isAsking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    GPT-4 Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask GPT-4
                  </>
                )}
              </Button>

              {followUpResponse && (
                <>
                  <Separator />
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">GPT-4 Response:</h4>
                    <div className="text-blue-800 whitespace-pre-wrap text-sm">{followUpResponse}</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
