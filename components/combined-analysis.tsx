"use client";

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

// Function to format combined analysis - COMPLETE JSON DISPLAY
function formatCombinedAnalysis(analysis: any) {
  if (!analysis) return null

  console.log('formatCombinedAnalysis called with:', analysis)
  console.log('Analysis type:', typeof analysis)
  console.log('Has executiveSummary:', !!analysis.executiveSummary)
  console.log('Has sections:', !!analysis.sections)
  console.log('Sections length:', analysis.sections?.length)
  console.log('Section titles:', analysis.sections?.map((s: any) => s.title))

  // Handle text format (fallback)
  if (typeof analysis === 'string') {
    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">{analysis}</div>
      </div>
    )
  }

  // Validate structure
  if (!analysis.executiveSummary || !analysis.sections) {
    console.warn('Analysis object missing required structure:', analysis)
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">⚠️ Analysis Structure Issue</h3>
        <p className="text-yellow-800">The analysis response doesn't match the expected JSON schema format.</p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-yellow-900">View Raw Response</summary>
          <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {analysis.executiveSummary && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
              Executive Summary
            </span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Overall Health</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{analysis.executiveSummary.overallHealth}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Credit Grade</h4>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${analysis.executiveSummary.creditGrade === 'A' ? 'bg-green-100 text-green-800' :
                analysis.executiveSummary.creditGrade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                  analysis.executiveSummary.creditGrade === 'C' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                }`}>
                Grade {analysis.executiveSummary.creditGrade}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Grade Explanation</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{analysis.executiveSummary.gradeExplanation}</p>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Standards Applied</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{analysis.executiveSummary.standardPrinciples}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Key Strengths</h4>
              <ul className="space-y-2">
                {analysis.executiveSummary.keyStrengths?.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Critical Weaknesses</h4>
              <ul className="space-y-2">
                {analysis.executiveSummary.criticalWeaknesses?.map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Risk Level</h4>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${analysis.executiveSummary.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                analysis.executiveSummary.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {analysis.executiveSummary.riskLevel} Risk
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Credit Recommendation</h4>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${analysis.executiveSummary.creditRecommendation === 'Approve' ? 'bg-green-100 text-green-800' :
                analysis.executiveSummary.creditRecommendation === 'Conditional' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {analysis.executiveSummary.creditRecommendation}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* All Sections */}
      {analysis.sections?.map((section: any, index: number) => {
        console.log(`Processing section ${index + 1}: ${section.title}`)

        // Handle 5 C's of Credit Assessment
        if (section.title === "5 C's of Credit Assessment") {
          console.log('5 Cs section found:', section)
          console.log('Has creditFactors:', !!section.creditFactors)
          console.log('creditFactors length:', section.creditFactors?.length)

          return (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
                  5 C's of Credit Assessment
                </span>
              </h3>

              <p className="text-gray-700 mb-6 leading-relaxed">{section.summary}</p>

              {section.creditFactors && section.creditFactors.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {section.creditFactors.map((factor: any, factorIndex: number) => (
                    <div key={factorIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{factor.factor}</h4>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${factor.score === 'Strong' ? 'bg-green-100 text-green-800' :
                          factor.score === 'Adequate' ? 'bg-yellow-100 text-yellow-800' :
                            factor.score === 'Neutral' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {factor.score}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{factor.assessment}</p>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Supporting Evidence:</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{factor.supportingEvidence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">⚠️ Credit factors data not available in this section.</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Findings</h4>
                <ul className="space-y-2">
                  {section.keyFindings?.map((finding: string, findingIndex: number) => (
                    <li key={findingIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        }

        // Handle Lending Standards Compliance
        if (section.title === "Lending Standards Compliance") {
          console.log('Compliance section found:', section)
          console.log('Has complianceMetrics:', !!section.complianceMetrics)
          console.log('complianceMetrics length:', section.complianceMetrics?.length)

          return (
            <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
                  Lending Standards Compliance
                </span>
              </h3>

              <p className="text-gray-700 mb-6 leading-relaxed">{section.summary}</p>

              {section.complianceMetrics && section.complianceMetrics.length > 0 ? (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {section.complianceMetrics.map((metric: any, metricIndex: number) => (
                    <div key={metricIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{metric.standard}</h4>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${metric.compliance === 'Meets' || metric.compliance === 'Exceeds' ? 'bg-green-100 text-green-800' :
                          metric.compliance === 'Below' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {metric.compliance}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">{metric.currentValue}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{metric.gapAnalysis}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">⚠️ Compliance metrics data not available in this section.</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Findings</h4>
                <ul className="space-y-2">
                  {section.keyFindings?.map((finding: string, findingIndex: number) => (
                    <li key={findingIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        }

        // Handle Credit Recommendations
        if (section.title === "Credit Recommendations") {
          return (
            <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
                  Credit Recommendations
                </span>
              </h3>

              <p className="text-gray-700 mb-6 leading-relaxed">{section.summary}</p>

              {section.recommendations && section.recommendations.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Recommendations</h4>
                  {section.recommendations.map((rec: any, recIndex: number) => (
                    <div key={recIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">{rec.category}</h5>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2 leading-relaxed">{rec.recommendation}</p>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed"><strong>Rationale:</strong> {rec.rationale}</p>
                      <p className="text-sm text-gray-600 leading-relaxed"><strong>Timeline:</strong> {rec.timeline}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.monitoringRequirements && section.monitoringRequirements.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Monitoring Requirements</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.monitoringRequirements.map((req: any, reqIndex: number) => (
                      <div key={reqIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{req.metric}</h5>
                        <p className="text-sm text-gray-600 mb-1"><strong>Frequency:</strong> {req.frequency}</p>
                        <p className="text-sm text-gray-600 mb-1"><strong>Threshold:</strong> {req.threshold}</p>
                        <p className="text-sm text-gray-600 leading-relaxed"><strong>Action:</strong> {req.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Findings</h4>
                <ul className="space-y-2">
                  {section.keyFindings?.map((finding: string, findingIndex: number) => (
                    <li key={findingIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        }

        // Handle standard sections (Earnings, Cash, Capital)
        return (
          <div key={index} className={`border rounded-lg p-6 shadow-sm ${section.title === 'Earnings' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
            section.title === 'Cash' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' :
              section.title === 'Capital' ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' :
                'bg-white'
            }`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className={`text-white text-sm font-medium px-3 py-1 rounded-full mr-3 ${section.title === 'Earnings' ? 'bg-green-600' :
                section.title === 'Cash' ? 'bg-blue-600' :
                  section.title === 'Capital' ? 'bg-purple-600' :
                    'bg-gray-600'
                }`}>
                {section.title}
              </span>
            </h3>

            <p className="text-gray-700 mb-6 leading-relaxed">{section.summary}</p>

            {section.narrative && (
              <div className="mb-6 p-4 bg-white/70 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-3">Detailed Analysis</h4>
                <p className="text-gray-700 leading-relaxed text-sm">{section.narrative}</p>
              </div>
            )}

            {section.metrics && section.metrics.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-4">Key Metrics</h4>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                  {section.metrics.map((metric: any, metricIndex: number) => (
                    <div key={metricIndex} className="bg-white/70 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium text-gray-900">{metric.name}</h5>
                        <span className={`text-xs px-2 py-1 rounded ${metric.trend === 'Improving' ? 'bg-green-100 text-green-700' :
                          metric.trend === 'Stable' ? 'bg-gray-100 text-gray-700' :
                            metric.trend === 'Declining' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {metric.trend}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 mb-2">{metric.value}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{metric.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Key Findings</h4>
              <ul className="space-y-2">
                {section.keyFindings?.map((finding: string, findingIndex: number) => (
                  <li key={findingIndex} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${section.title === 'Earnings' ? 'bg-green-500' :
                      section.title === 'Cash' ? 'bg-blue-500' :
                        section.title === 'Capital' ? 'bg-purple-500' :
                          'bg-gray-500'
                      }`}></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CombinedAnalysis() {
  const [incomeFile, setIncomeFile] = useState<File | null>(null)
  const [balanceFile, setBalanceFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const { toast } = useToast()
  const { sessions, currentSessionId, createSession, addMessage, getSession } = useChatContext()
  
  // Get current session messages
  const currentSession = currentSessionId ? getSession(currentSessionId) : null
  const messages = currentSession?.messages || []

  const handleFileUpload = (file: File, type: 'income' | 'balance') => {
    if (type === 'income') {
      setIncomeFile(file)
    } else {
      setBalanceFile(file)
    }
  }

  const handleAnalysis = async () => {
    if (!incomeFile || !balanceFile) {
      toast({
        title: "Missing Files",
        description: "Please upload both income statement and balance sheet files.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      // Create form data for both files
      const formData = new FormData()
      formData.append("incomeFile", incomeFile)
      formData.append("balanceFile", balanceFile)

      const response = await fetch("/api/analyze-combined", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setAnalysisResult(result)
        
        // Create or get session for this analysis
        const fileHash = await createFileFingerprint(incomeFile.name + balanceFile.name)
        const sessionId = currentSessionId || createSession(`${incomeFile.name} + ${balanceFile.name}`, fileHash, 'combined')
        
        addMessage(sessionId, {
          type: 'analysis',
          content: result.analysis
        })

        // Generate follow-up questions
        setIsGeneratingQuestions(true)
        try {
          const questionsResponse = await fetch("/api/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              analysisType: "combined",
              analysis: result.analysis,
              fileName: `${incomeFile.name} + ${balanceFile.name}`
            }),
          })

          if (questionsResponse.ok) {
            const questionsResult = await questionsResponse.json()
            setSuggestedQuestions(questionsResult.questions || [])
          }
        } catch (error) {
          console.error("Error generating questions:", error)
        } finally {
          setIsGeneratingQuestions(false)
        }

        toast({
          title: "Analysis Complete",
          description: "Combined financial analysis has been generated successfully.",
        })
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFollowUpQuestion = async () => {
    if (!followUpQuestion.trim() || !analysisResult) {
      toast({
        title: "Missing Information",
        description: "Please enter a question and ensure analysis is complete.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: followUpQuestion,
          context: analysisResult.analysis,
          analysisType: "combined",
          fileName: `${incomeFile?.name} + ${balanceFile?.name}`
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        // Use current session or create one if needed
        const sessionId = currentSessionId || createSession(`${incomeFile?.name} + ${balanceFile?.name}`, 'follow-up', 'combined')
        
        addMessage(sessionId, {
          type: 'question',
          content: followUpQuestion
        })

        addMessage(sessionId, {
          type: 'response',
          content: result.answer
        })

        setFollowUpQuestion("")
        toast({
          title: "Question Answered",
          description: "Your follow-up question has been answered.",
        })
      } else {
        throw new Error(result.error || "Failed to get answer")
      }
    } catch (error) {
      console.error("Follow-up error:", error)
      toast({
        title: "Question Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setFollowUpQuestion(question)
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Income Statement</span>
            </CardTitle>
            <CardDescription>Upload your income statement file (Excel or PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'income')
                  }}
                  className="hidden"
                  id="income-upload"
                />
                <label htmlFor="income-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload income statement</p>
                  <p className="text-xs text-gray-500 mt-1">Excel (.xlsx, .xls) or PDF files</p>
                </label>
              </div>
              {incomeFile && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>{incomeFile.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Balance Sheet</span>
            </CardTitle>
            <CardDescription>Upload your balance sheet file (Excel or PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'balance')
                  }}
                  className="hidden"
                  id="balance-upload"
                />
                <label htmlFor="balance-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload balance sheet</p>
                  <p className="text-xs text-gray-500 mt-1">Excel (.xlsx, .xls) or PDF files</p>
                </label>
              </div>
              {balanceFile && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Target className="h-4 w-4" />
                  <span>{balanceFile.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleAnalysis}
            disabled={!incomeFile || !balanceFile || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Financial Statements...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Analyze Combined Financial Statements
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Performing comprehensive financial analysis...</span>
                <span>Processing</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Analyzing both income statement and balance sheet with GPT-4 for comprehensive insights
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Combined Financial Analysis</span>
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            <CardDescription>
              Comprehensive analysis of {incomeFile?.name} and {balanceFile?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formatCombinedAnalysis(analysisResult.analysis)}
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Ask Follow-up Questions</CardTitle>
            <CardDescription>
              Get more specific insights about your financial analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Suggested Questions:</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-xs"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="followup">Your Question:</Label>
                <Textarea
                  id="followup"
                  placeholder="Ask a specific question about the analysis..."
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleFollowUpQuestion} disabled={!followUpQuestion.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Ask Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat History */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
            <CardDescription>Previous analyses and conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChatHistory />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

