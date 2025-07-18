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
import { Progress } from "@/components/ui/progress"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"
import { formatMarkdown } from "@/lib/markdown-utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatHistory, ChatMessages } from "@/components/chat-history"
import { createFileFingerprint } from "@/lib/file-processor"

// Function to format combined analysis into structured sections
function formatCombinedAnalysis(analysis: any) {
  if (!analysis) return null

  // Handle both old text format and new JSON format
  if (typeof analysis === "string") {
    try {
      const parsedAnalysis = JSON.parse(analysis)
      return formatCombinedAnalysis(parsedAnalysis)
    } catch {
      // Legacy text format - split analysis into sections based on numbered points
      const sections = analysis.split(/(?=\d+\.)/).filter((section) => section.trim())

      return (
        <div className="space-y-6">
          {sections.map((section, index) => {
            const lines = section
              .trim()
              .split("\n")
              .filter((line) => line.trim())
            if (lines.length === 0) return null

            const titleMatch = lines[0].match(/^(\d+\.\s*)(.+?):/)
            const title = titleMatch ? titleMatch[2] : `Section ${index + 1}`
            const content = titleMatch ? lines.slice(1).join(" ") : section

            const bulletPoints = content.split("•").filter((point) => point.trim())

            return (
              <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
                    {index + 1}
                  </span>
                  {title}
                </h3>

                {bulletPoints.length > 1 ? (
                  <div className="space-y-3">
                    {bulletPoints.map((point, pointIndex) => {
                      if (!point.trim()) return null
                      return (
                        <div key={pointIndex} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700 leading-relaxed">{point.trim()}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{content.trim()}</p>
                )}
              </div>
            )
          })}
        </div>
      )
    }
  }

  // New JSON format - same structure as income statement but with blue theme
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {analysis.executiveSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
              Executive Summary
            </span>
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Overall Health</h4>
              <p className="text-gray-700">{analysis.executiveSummary.overallHealth}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Credit Grade</h4>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.executiveSummary.creditGrade?.includes("A")
                    ? "bg-green-100 text-green-800"
                    : analysis.executiveSummary.creditGrade?.includes("B")
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {analysis.executiveSummary.creditGrade}
              </span>
            </div>
          </div>

          {analysis.executiveSummary.gradeExplanation && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Grade Explanation</h4>
              <p className="text-gray-700 leading-relaxed">{analysis.executiveSummary.gradeExplanation}</p>
            </div>
          )}

          {analysis.executiveSummary.standardPrinciples && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Standards Applied</h4>
              <p className="text-gray-700 leading-relaxed">{analysis.executiveSummary.standardPrinciples}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {analysis.executiveSummary.profitabilityTrend && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Profitability Trend</h4>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    analysis.executiveSummary.profitabilityTrend === "Improving"
                      ? "bg-green-100 text-green-800"
                      : analysis.executiveSummary.profitabilityTrend === "Stable"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {analysis.executiveSummary.profitabilityTrend}
                </span>
              </div>
            )}
            {analysis.executiveSummary.riskLevel && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Risk Level</h4>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    analysis.executiveSummary.riskLevel === "Low"
                      ? "bg-green-100 text-green-800"
                      : analysis.executiveSummary.riskLevel === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {analysis.executiveSummary.riskLevel}
                </span>
              </div>
            )}
          </div>

          {analysis.executiveSummary.creditRecommendation && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Credit Recommendation</h4>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.executiveSummary.creditRecommendation === "Approve"
                    ? "bg-green-100 text-green-800"
                    : analysis.executiveSummary.creditRecommendation === "Conditional"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {analysis.executiveSummary.creditRecommendation}
              </span>
            </div>
          )}

          {analysis.executiveSummary.keyStrengths?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Key Strengths</h4>
              <ul className="space-y-2">
                {analysis.executiveSummary.keyStrengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.executiveSummary.criticalWeaknesses?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Critical Weaknesses</h4>
              <ul className="space-y-2">
                {analysis.executiveSummary.criticalWeaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Analysis Sections */}
      {analysis.sections?.map((section: any, index: number) => (
        <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
              {index + 1}
            </span>
            {section.title}
          </h3>

          {section.summary && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
              <p className="text-gray-700 leading-relaxed">{section.summary}</p>
            </div>
          )}

          {section.narrative && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Detailed Analysis</h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.narrative}</p>
            </div>
          )}

          {/* Metrics */}
          {section.metrics?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Key Metrics</h4>
              <div className="grid md:grid-cols-1 gap-4">
                {section.metrics.map((metric: any, metricIndex: number) => (
                  <div key={metricIndex} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{metric.name}</h5>
                      {metric.trend && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            metric.trend === "Improving"
                              ? "bg-green-100 text-green-700"
                              : metric.trend === "Declining"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {metric.trend}
                        </span>
                      )}
                    </div>
                    {metric.value && <p className="text-lg font-semibold text-blue-600 mb-2">{metric.value}</p>}
                    {metric.analysis && <p className="text-sm text-gray-600 leading-relaxed">{metric.analysis}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit Factors (5 C's) */}
          {section.creditFactors?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">5 C's of Credit Assessment</h4>
              <div className="grid md:grid-cols-1 gap-4">
                {section.creditFactors.map((factor: any, factorIndex: number) => (
                  <div key={factorIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{factor.factor}</h5>
                      <span
                        className={`text-sm px-2 py-1 rounded font-medium ${
                          factor.score === "Strong" || factor.score === "Adequate"
                            ? "bg-green-100 text-green-800"
                            : factor.score === "Neutral"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {factor.score}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">{factor.assessment}</p>
                    {factor.supportingEvidence && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-xs font-medium text-blue-800 mb-1">Supporting Evidence:</p>
                        <p className="text-xs text-blue-700">{factor.supportingEvidence}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Metrics */}
          {section.complianceMetrics?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Lending Standards Compliance</h4>
              <div className="grid md:grid-cols-1 gap-4">
                {section.complianceMetrics.map((compliance: any, complianceIndex: number) => (
                  <div key={complianceIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{compliance.standard}</h5>
                      <span
                        className={`text-sm px-2 py-1 rounded font-medium ${
                          compliance.compliance === "Above" || compliance.compliance === "Met"
                            ? "bg-green-100 text-green-800"
                            : compliance.compliance === "Below"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {compliance.compliance}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Current Value:</strong> {compliance.currentValue}
                    </p>
                    {compliance.gapAnalysis && (
                      <p className="text-sm text-gray-600">
                        <strong>Gap Analysis:</strong> {compliance.gapAnalysis}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {section.recommendations?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Recommendations</h4>
              <div className="space-y-3">
                {section.recommendations.map((rec: any, recIndex: number) => (
                  <div key={recIndex} className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{rec.category}</h5>
                      {rec.priority && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            rec.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : rec.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {rec.priority} Priority
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2 leading-relaxed">{rec.recommendation}</p>
                    {rec.rationale && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Rationale:</strong> {rec.rationale}
                      </p>
                    )}
                    {rec.timeline && (
                      <p className="text-sm text-gray-600">
                        <strong>Timeline:</strong> {rec.timeline}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Requirements */}
          {section.monitoringRequirements?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Monitoring Requirements</h4>
              <div className="grid md:grid-cols-1 gap-4">
                {section.monitoringRequirements.map((monitor: any, monitorIndex: number) => (
                  <div key={monitorIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-blue-900">{monitor.metric}</h5>
                      <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">{monitor.frequency}</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-1">
                      <strong>Threshold:</strong> {monitor.threshold}
                    </p>
                    <p className="text-sm text-blue-600">
                      <strong>Action:</strong> {monitor.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Findings */}
          {section.keyFindings?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Key Findings</h4>
              <ul className="space-y-2">
                {section.keyFindings.map((finding: string, findingIndex: number) => (
                  <li key={findingIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function CombinedAnalysis() {
  const [incomeFile, setIncomeFile] = useState<File | null>(null)
  const [balanceFile, setBalanceFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState("")
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [followUpResponse, setFollowUpResponse] = useState("")
  const [financialData, setFinancialData] = useState<any[]>([])
  const [fileHash, setFileHash] = useState<string>("")
  const { toast } = useToast()
  const { createSession, addMessage, getSessionByFileHash, currentSessionId, setCurrentSession, getSession } =
    useChatContext()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "income" | "balance") => {
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

      if (type === "income") {
        setIncomeFile(uploadedFile)
      } else {
        setBalanceFile(uploadedFile)
      }

      toast({
        title: "File uploaded",
        description: `${uploadedFile.name} is ready for analysis.`,
      })
    }
  }

  const handleAnalyze = async () => {
    if (!incomeFile || !balanceFile) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysis("")
    setFollowUpResponse("")
    setFinancialData([])

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

      if (!response.ok) {
        throw new Error("Failed to analyze financial statements")
      }

      const data = await response.json()
      const analysisData = data.analysis
      setAnalysis(analysisData)

      if (data.metrics) {
        setFinancialData(data.metrics)
      }

      // Create file hash for session management
      const combinedHash = await createFileFingerprint(
        new File([incomeFile.name + balanceFile.name], "combined", { type: "text/plain" }),
      )
      setFileHash(combinedHash)

      // Create or update session with analysis
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = createSession(`${incomeFile.name} + ${balanceFile.name}`, combinedHash, "combined")
      }

      // Add analysis to chat history
      addMessage(sessionId, {
        type: "analysis",
        content: typeof analysisData === "string" ? analysisData : JSON.stringify(analysisData),
      })

      // Generate follow-up questions after analysis
      await generateFollowUpQuestions(typeof analysisData === "string" ? analysisData : JSON.stringify(analysisData))
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing the financial statements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAskQuestion = async (question?: string) => {
    const questionToAsk = question || followUpQuestion.trim()
    if (!questionToAsk || !currentSessionId) return

    setIsAsking(true)
    setFollowUpResponse("")

    if (question) {
      setFollowUpQuestion(question)
    }

    try {
      addMessage(currentSessionId, {
        type: "question",
        content: questionToAsk,
      })

      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionToAsk,
          context: analysis,
          analysisType: "combined",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      const formattedResponse = formatMarkdown(data.response)
      setFollowUpResponse(formattedResponse)

      addMessage(currentSessionId, {
        type: "response",
        content: formattedResponse,
      })

      if (!question) {
        setFollowUpQuestion("")
      }
    } catch (error) {
      console.error("Error asking question:", error)
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAsking(false)
    }
  }

  const exportReport = async () => {
    if (!analysis) return

    setIsExporting(true)
    try {
      const blob = new Blob([analysis], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "combined-financial-analysis-report.md"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Report exported",
        description: "The combined financial analysis report has been downloaded.",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the report.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generateFollowUpQuestions = async (analysisText: string) => {
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: analysisText,
          analysisType: "combined",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate follow-up questions")
      }

      const data = await response.json()
      setFollowUpQuestions(data.questions || [])
    } catch (error) {
      console.error("Error generating follow-up questions:", error)
      setFollowUpQuestions([
        "What are the key financial ratios?",
        "How does the cash flow look?",
        "What are the main risk factors?",
      ])
    }
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
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="income-file">Income Statement (Excel or PDF, max 10MB)</Label>
                <Input
                  id="income-file"
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={(e) => handleFileUpload(e, "income")}
                  className="mt-1"
                />
                {incomeFile && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge variant="secondary">{incomeFile.name}</Badge>
                    <span className="text-sm text-gray-500">({(incomeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="balance-file">Balance Sheet (Excel or PDF, max 10MB)</Label>
                <Input
                  id="balance-file"
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={(e) => handleFileUpload(e, "balance")}
                  className="mt-1"
                />
                {balanceFile && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge variant="secondary">{balanceFile.name}</Badge>
                    <span className="text-sm text-gray-500">({(balanceFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {incomeFile && balanceFile && (
              <Button onClick={handleAnalyze} disabled={!incomeFile || !balanceFile || isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with GPT-4...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analyze Combined Statements with AI
                  </>
                )}
              </Button>
            )}

            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing financial statements...</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="w-full" />
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
                <span>GPT-4 Combined Financial Analysis</span>
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
            <div className="space-y-6">{formatCombinedAnalysis(analysis)}</div>
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
              <span>AI Follow-up Analysis</span>
            </CardTitle>
            <CardDescription>Ask GPT-4 specific questions about the combined financial analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="followup">Your Question</Label>
                <Textarea
                  id="followup"
                  placeholder="e.g., What are the liquidity concerns? How does the debt-to-equity ratio compare to industry standards? What are the key operational risks?"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button onClick={() => handleAskQuestion()} disabled={isAsking || !followUpQuestion.trim()}>
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
                    <div className="prose prose-sm max-w-none text-blue-800 whitespace-pre-wrap">
                      {followUpResponse}
                    </div>
                  </div>
                </>
              )}

              {followUpQuestions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Suggested questions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {followUpQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent"
                        onClick={() => handleAskQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat History */}
      {currentSessionId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChatHistory
            analysisType="combined"
            onSelectSession={(sessionId) => {
              const session = getSession(sessionId)
              if (session) {
                const analysisMessage = session.messages.find((m) => m.type === "analysis")
                if (analysisMessage) {
                  setAnalysis(analysisMessage.content)
                }
              }
            }}
          />
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>Review your questions and AI responses for this document</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatMessages sessionId={currentSessionId} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
