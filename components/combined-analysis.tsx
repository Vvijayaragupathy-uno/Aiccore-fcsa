"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Send, Loader2, FileText, Target, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"
import { formatMarkdown } from "@/lib/markdown-utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatHistory } from "@/components/chat-history"
import { createFileFingerprint } from "@/lib/file-processor"

// Function to format combined analysis into structured sections
function formatCombinedAnalysis(analysis: any) {
  if (!analysis) return null

  // Handle string format (try to parse as JSON first)
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
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
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
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
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

  // Handle JSON format
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {analysis.executiveSummary && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
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
            <div className="mb-4">
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

          <div className="grid md:grid-cols-2 gap-4">
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
            <div>
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
          </div>
        </div>
      )}

      {/* Analysis Sections */}
      {analysis.sections?.map((section: any, index: number) => (
        <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
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
                      <h5 className="font-medium text-gray-900">{metric.name || metric.metric}</h5>
                      {metric.trend && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            metric.trend === "Improving" || metric.trend === "improving"
                              ? "bg-green-100 text-green-700"
                              : metric.trend === "Declining" || metric.trend === "declining"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {metric.trend}
                        </span>
                      )}
                    </div>
                    {metric.value && <p className="text-lg font-semibold text-purple-600 mb-2">{metric.value}</p>}
                    {metric.currentValue && (
                      <p className="text-lg font-semibold text-purple-600 mb-2">{metric.currentValue}</p>
                    )}
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
                  <div key={recIndex} className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{rec.category || rec.title}</h5>
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
                    <p className="text-gray-700 mb-2 leading-relaxed">{rec.recommendation || rec.description}</p>
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
                  <div key={monitorIndex} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-purple-900">{monitor.metric}</h5>
                      <span className="text-sm px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {monitor.frequency}
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mb-1">
                      <strong>Threshold:</strong> {monitor.threshold}
                    </p>
                    <p className="text-sm text-purple-600">
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [followUpResponse, setFollowUpResponse] = useState("")
  const [financialData, setFinancialData] = useState<any[]>([])
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [fileHash, setFileHash] = useState<string>("")
  const [showChatHistory, setShowChatHistory] = useState(false)
  const { toast } = useToast()
  const {
    createSession,
    addMessage,
    getSessionByFileHash,
    currentSession: currentSessionId,
    setCurrentSession,
  } = useChatContext()

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
      // Create file hash for session management
      const combinedHash = (await createFileFingerprint(incomeFile)) + (await createFileFingerprint(balanceFile))
      setFileHash(combinedHash)

      // Check for existing session or create new one
      let sessionId = currentSessionId
      const existingSession = getSessionByFileHash(combinedHash, "combined")
      if (existingSession) {
        sessionId = existingSession.id
        setCurrentSession(sessionId)
      } else {
        sessionId = createSession(`${incomeFile.name} + ${balanceFile.name}`, combinedHash, "combined")
      }

      // Enhanced progress updates with detailed steps
      const progressSteps = [
        { progress: 15, message: "Processing income statement data..." },
        { progress: 30, message: "Processing balance sheet data..." },
        { progress: 45, message: "Analyzing financial ratios and trends..." },
        { progress: 60, message: "Evaluating credit risk factors..." },
        { progress: 75, message: "Generating comprehensive insights..." },
        { progress: 90, message: "Finalizing analysis report..." },
      ]

      let stepIndex = 0
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setAnalysisProgress(progressSteps[stepIndex].progress)
          setProgressMessage(progressSteps[stepIndex].message)
          stepIndex++
        }
      }, 800)

      const formData = new FormData()
      formData.append("incomeFile", incomeFile)
      formData.append("balanceFile", balanceFile)

      const response = await fetch("/api/analyze-combined", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)
      setProgressMessage("Analysis complete!")

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)

        // Add analysis to chat history
        addMessage(sessionId, {
          type: "analysis",
          content: result.analysis,
        })

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
    const questionToAsk = followUpQuestion.trim()
    if (!questionToAsk || !currentSessionId) return

    setIsAsking(true)
    setFollowUpResponse("")

    try {
      // Add question to chat history
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

      const result = await response.json()

      if (result.success) {
        setFollowUpResponse(result.response)

        // Add response to chat history
        addMessage(currentSessionId, {
          type: "response",
          content: result.response,
        })

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
                <span>{progressMessage || "Initializing comprehensive analysis..."}</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Performing integrated financial analysis with GPT-4 to evaluate creditworthiness and lending
                recommendations
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
                    Export PDF Report
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Comprehensive integrated analysis of income statement and balance sheet with credit recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">{formatCombinedAnalysis(analysis)}</div>
          </CardContent>
        </Card>
      )}

      {/* Financial Charts */}
      {financialData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Trends Visualization</CardTitle>
            <CardDescription>Interactive charts showing key financial metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialCharts data={financialData} />
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Ask Follow-up Questions</span>
            </CardTitle>
            <CardDescription>Get deeper insights about the analysis with GPT-4 powered Q&A</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Ask specific questions about the financial analysis, ratios, trends, or credit recommendations..."
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button onClick={askFollowUp} disabled={isAsking || !followUpQuestion.trim()}>
                  {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {followUpResponse && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">GPT-4 Response:</h4>
                  <div className="text-blue-800 whitespace-pre-wrap">{formatMarkdown(followUpResponse)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat History */}
      {currentSessionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analysis History</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowChatHistory(!showChatHistory)}>
                {showChatHistory ? "Hide" : "Show"} History
              </Button>
            </div>
          </CardHeader>
          {showChatHistory && (
            <CardContent>
              <ChatHistory sessionId={currentSessionId} />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
