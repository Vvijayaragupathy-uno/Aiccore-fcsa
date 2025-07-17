"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Send, Loader2, BarChart3, Building, AlertCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"

export function BalanceSheetAnalysis() {
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

  const analyzeBalanceSheet = async () => {
    if (!file) return

    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/analyze-balance", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)

        if (result.metrics) {
          const data = result.metrics.years.map((year: number, index: number) => ({
            year,
            grossFarmIncome: 1800000 + index * 150000,
            netFarmIncome: 450000 - index * 200000,
            netNonfarmIncome: 85000,
            netIncome: 380000 - index * 400000,
            currentAssets: result.metrics.currentAssets[index],
            currentLiabilities: result.metrics.currentLiabilities[index],
            totalAssets: result.metrics.totalAssets[index],
            totalEquity: result.metrics.totalEquity[index],
            termDebt: 1400000 + index * 25000,
          }))
          setFinancialData(data)
        }

        toast({
          title: "Analysis complete",
          description: "GPT-4 has analyzed your balance sheet.",
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
          analysisType: "balance-sheet",
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
          reportType: "Balance Sheet",
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `balance-sheet-report-${new Date().toISOString().split("T")[0]}.pdf`
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
            <span>Upload Balance Sheet</span>
          </CardTitle>
          <CardDescription>
            Upload your Excel or PDF balance sheet for comprehensive AI-powered capital structure analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="balance-file">Select File (Excel or PDF, max 10MB)</Label>
              <Input
                id="balance-file"
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
                <Button onClick={analyzeBalanceSheet} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing with GPT-4...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
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
                <Building className="h-5 w-5" />
                <span>GPT-4 Balance Sheet Analysis</span>
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
              <span>Balance Sheet Visualizations</span>
            </CardTitle>
            <CardDescription>Interactive charts showing capital structure and liquidity trends</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialCharts data={financialData} type="balance" />
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>AI Follow-up Analysis</span>
            </CardTitle>
            <CardDescription>Ask GPT-4 specific questions about the balance sheet analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="followup-balance">Your Question</Label>
                <Textarea
                  id="followup-balance"
                  placeholder="e.g., What are the working capital implications? How does the equity position compare to industry standards? What are the liquidity risks?"
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
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">GPT-4 Response:</h4>
                    <div className="text-green-800 whitespace-pre-wrap text-sm">{followUpResponse}</div>
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
