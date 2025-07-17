"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Send, Loader2, FileText, Target, AlertTriangle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"

export function CombinedAnalysis() {
  const [incomeFile, setIncomeFile] = useState<File | null>(null)
  const [balanceFile, setBalanceFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState("")
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [followUpResponse, setFollowUpResponse] = useState("")
  const [financialData, setFinancialData] = useState<any[]>([])
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const { toast } = useToast()

  const validateFile = (file: File) => {
    const validTypes = [".xlsx", ".xls", ".pdf"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload Excel (.xlsx, .xls) or PDF files only.",
        variant: "destructive",
      })
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleIncomeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile && validateFile(uploadedFile)) {
      setIncomeFile(uploadedFile)
      toast({
        title: "Income statement uploaded",
        description: `${uploadedFile.name} is ready for analysis.`,
      })
    }
  }

  const handleBalanceFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile && validateFile(uploadedFile)) {
      setBalanceFile(uploadedFile)
      toast({
        title: "Balance sheet uploaded",
        description: `${uploadedFile.name} is ready for analysis.`,
      })
    }
  }

  const analyzeCombined = async () => {
    if (!incomeFile || !balanceFile) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const formData = new FormData()
      formData.append("incomeFile", incomeFile)
      formData.append("balanceFile", balanceFile)

      const response = await fetch("/api/analyze-combined", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)

        if (result.metrics) {
          const data = result.metrics.years.map((year: number, index: number) => ({
            year,
            grossFarmIncome: result.metrics.grossFarmIncome[index],
            netFarmIncome: result.metrics.netFarmIncome[index],
            netNonfarmIncome: result.metrics.netNonfarmIncome[index],
            netIncome: result.metrics.netIncome[index],
            currentAssets: result.metrics.currentAssets[index],
            currentLiabilities: result.metrics.currentLiabilities[index],
            totalAssets: result.metrics.totalAssets[index],
            totalEquity: result.metrics.totalEquity[index],
            termDebt: result.metrics.termDebt[index],
          }))
          setFinancialData(data)
        }

        toast({
          title: "Comprehensive analysis complete",
          description: "GPT-4 has analyzed both financial statements.",
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
    setAnalysisProgress(0)
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
          analysisType: "combined",
        }),
      })

      const result = await response.json()

      if (result.success) {
        setFollowUpResponse(result.response)
        toast({
          title: "Question answered",
          description: "GPT-4 has provided comprehensive insights.",
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
          reportType: "Comprehensive Financial Analysis",
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `comprehensive-analysis-report-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Report exported",
          description: "Comprehensive PDF report has been downloaded.",
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

  const canAnalyze = incomeFile && balanceFile

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Financial Statements</span>
          </CardTitle>
          <CardDescription>
            Upload both income statement and balance sheet for comprehensive integrated AI analysis using GPT-4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="income-combined">Income Statement (Excel or PDF, max 10MB)</Label>
              <Input id="income-combined" type="file" accept=".xlsx,.xls,.pdf" onChange={handleIncomeFileUpload} />
              {incomeFile && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">{incomeFile.name}</Badge>
                  <span className="text-xs text-gray-500">({(incomeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance-combined">Balance Sheet (Excel or PDF, max 10MB)</Label>
              <Input id="balance-combined" type="file" accept=".xlsx,.xls,.pdf" onChange={handleBalanceFileUpload} />
              {balanceFile && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">{balanceFile.name}</Badge>
                  <span className="text-xs text-gray-500">({(balanceFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          {canAnalyze && (
            <div className="mt-6">
              <Button onClick={analyzeCombined} disabled={isAnalyzing} className="w-full" size="lg">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Performing Comprehensive GPT-4 Analysis...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Analyze Combined Financial Position with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Processing financial statements with GPT-4...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Analyzing income trends, balance sheet structure, integrated risk factors, and generating lending
                recommendations...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>GPT-4 Comprehensive Financial Analysis</span>
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
            <CardTitle>Comprehensive Financial Visualizations</CardTitle>
            <CardDescription>
              Interactive charts showing integrated financial performance and risk metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialCharts data={financialData} type="combined" />
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>AI Credit Decision Support</span>
            </CardTitle>
            <CardDescription>
              Ask GPT-4 specific questions about lending decisions, risk assessment, or recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="followup-combined">Your Question</Label>
                <Textarea
                  id="followup-combined"
                  placeholder="e.g., What's your lending recommendation? What are the key risk factors? What pricing would you suggest? What covenants should be included?"
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
                    Get AI Credit Guidance
                  </>
                )}
              </Button>

              {followUpResponse && (
                <>
                  <Separator />
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">GPT-4 Credit Analysis Response:</h4>
                    <div className="text-purple-800 whitespace-pre-wrap text-sm">{followUpResponse}</div>
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
