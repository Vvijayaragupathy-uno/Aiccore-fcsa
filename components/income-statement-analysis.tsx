"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { formatMarkdown, extractAndFormatMetrics } from "@/lib/markdown-utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatHistory, ChatMessages } from "@/components/chat-history"
import { createFileFingerprint } from "@/lib/file-processor"

// Function to format income statement analysis into structured sections
function formatIncomeStatementAnalysis(analysis: any) {
  if (!analysis) return null

  // Handle both old text format and new JSON format
  if (typeof analysis === 'string') {
    // Legacy text format - split analysis into sections based on numbered points
    const sections = analysis.split(/(?=\d+\.)/).filter(section => section.trim())
    
    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n').filter(line => line.trim())
          if (lines.length === 0) return null
          
          const titleMatch = lines[0].match(/^(\d+\.\s*)(.+?):/)
          const title = titleMatch ? titleMatch[2] : `Section ${index + 1}`
          const content = titleMatch ? lines.slice(1).join(' ') : section
          
          const bulletPoints = content.split('•').filter(point => point.trim())
          
          return (
            <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
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
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
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

  // New JSON format
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {analysis.executiveSummary && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
              Executive Summary
            </span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Overall Performance</h4>
              <p className="text-gray-700">{analysis.executiveSummary.overallPerformance}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Credit Grade</h4>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                analysis.executiveSummary.creditGrade?.includes('A') ? 'bg-green-100 text-green-800' :
                analysis.executiveSummary.creditGrade?.includes('B') ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {analysis.executiveSummary.creditGrade}
              </span>
            </div>
          </div>

          {analysis.executiveSummary.gradeExplanation && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Grade Explanation</h4>
              <p className="text-gray-700">{analysis.executiveSummary.gradeExplanation}</p>
            </div>
          )}

          {analysis.executiveSummary.standardPrinciples && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Standards Applied</h4>
              <p className="text-gray-700">{analysis.executiveSummary.standardPrinciples}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Profitability Trend</h4>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                analysis.executiveSummary.profitabilityTrend === 'Improving' ? 'bg-green-100 text-green-800' :
                analysis.executiveSummary.profitabilityTrend === 'Stable' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {analysis.executiveSummary.profitabilityTrend}
              </span>
            </div>
          </div>
          
          {analysis.executiveSummary.keyStrengths?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Key Strengths</h4>
              <ul className="space-y-1">
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
              <ul className="space-y-1">
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
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
              {index + 1}
            </span>
            {section.title}
          </h3>
          
          {section.summary && (
            <p className="text-gray-700 mb-4 leading-relaxed">{section.summary}</p>
          )}
          
          {/* Metrics */}
          {section.metrics?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Key Metrics</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {section.metrics.map((metric: any, metricIndex: number) => (
                  <div key={metricIndex} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{metric.name}</h5>
                      {metric.trend && (
                        <span className={`text-sm px-2 py-1 rounded ${
                          metric.trend === 'Improving' ? 'bg-green-100 text-green-700' :
                          metric.trend === 'Declining' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {metric.trend}
                        </span>
                      )}
                    </div>
                    {metric.value && (
                      <p className="text-lg font-semibold text-green-600 mb-2">{metric.value}</p>
                    )}
                    {metric.currentValue && (
                      <p className="text-lg font-semibold text-green-600 mb-2">{metric.currentValue}</p>
                    )}
                    {metric.previousValue && (
                      <p className="text-sm text-gray-600 mb-1">Previous: {metric.previousValue}</p>
                    )}
                    {metric.yearOverYearChange && (
                      <p className="text-sm text-gray-600 mb-1">YoY Change: {metric.yearOverYearChange}</p>
                    )}
                    {metric.benchmark && (
                      <p className="text-sm text-gray-600 mb-1">Benchmark: {metric.benchmark}</p>
                    )}
                    {metric.analysis && (
                      <p className="text-sm text-gray-600">{metric.analysis}</p>
                    )}
                    {metric.explanation && (
                      <p className="text-sm text-gray-600">{metric.explanation}</p>
                    )}
                    {/* Additional Income Statement Specific Fields */}
                    {metric.timeline && (
                      <p className="text-sm text-gray-600 mb-1">Timeline: {metric.timeline}</p>
                    )}
                    {metric.threshold && (
                      <p className="text-sm text-gray-600 mb-1">Threshold: {metric.threshold}</p>
                    )}
                    {metric.action && (
                      <p className="text-sm text-gray-600 mb-1">Action: {metric.action}</p>
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
                  <div key={recIndex} className="border-l-4 border-green-500 pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium text-gray-900">{rec.category}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-gray-700 mb-1">{rec.recommendation}</p>
                    <p className="text-sm text-gray-600">{rec.rationale}</p>
                    {/* Additional Income Statement Recommendation Fields */}
                    {rec.timeline && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Timeline:</span> {rec.timeline}</p>
                    )}
                    {rec.conditions && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Conditions:</span> {rec.conditions}</p>
                    )}
                    {rec.riskMitigation && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Risk Mitigation:</span> {rec.riskMitigation}</p>
                    )}
                    {rec.measurableTargets && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Measurable Targets:</span> {rec.measurableTargets}</p>
                    )}
                    {rec.frequency && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Frequency:</span> {rec.frequency}</p>
                    )}
                    {rec.triggerEvents && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Trigger Events:</span> {rec.triggerEvents}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Credit Factors (5 C's) */}
          {section.creditFactors?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">5 C's of Credit Assessment</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.creditFactors.map((factor: any, factorIndex: number) => (
                  <div key={factorIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{factor.factor}</h5>
                      <span className={`text-sm px-2 py-1 rounded font-medium ${
                        factor.score === 'Strong' ? 'bg-green-100 text-green-800' :
                        factor.score === 'Adequate' ? 'bg-yellow-100 text-yellow-800' :
                        factor.score === 'Favorable' ? 'bg-green-100 text-green-800' :
                        factor.score === 'Neutral' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {factor.score}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{factor.assessment}</p>
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
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{finding}</span>
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

export function IncomeStatementAnalysis() {
  const [file, setFile] = useState<File | null>(null)
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
  const [showChatHistory, setShowChatHistory] = useState(false)
  const { toast } = useToast()
  const { 
    createSession, 
    addMessage, 
    getSessionByFileHash, 
    currentSessionId, 
    setCurrentSession,
    getSession 
  } = useChatContext()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create file hash for session management
      const hash = await createFileFingerprint(uploadedFile)
      setFileHash(hash)
      
      // Check for existing session
      const existingSession = getSessionByFileHash(hash, 'income_statement')
      if (existingSession) {
        setCurrentSession(existingSession.id)
        setFile(uploadedFile)
        // Load previous analysis if available
        const analysisMessage = existingSession.messages.find(m => m.type === 'analysis')
        if (analysisMessage) {
          setAnalysis(analysisMessage.content)
        }
        toast({
          title: "Previous session found",
          description: "Loaded previous analysis and chat history",
        })
      } else {
        setFile(uploadedFile)
        setAnalysis("")
        setFollowUpQuestions([])
        setFollowUpResponse("")
        setFinancialData([])
        toast({
          title: "File uploaded",
          description: `${uploadedFile.name} is ready for analysis.`,
        })
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

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
      formData.append("file", file)

      const response = await fetch("/api/analyze-income", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (!response.ok) {
        throw new Error("Failed to analyze income statement")
      }

      const data = await response.json()
      // Handle both JSON and text analysis formats
      const analysisData = data.analysis
      setAnalysis(analysisData)
      
      if (data.metrics) {
        // Transform metrics into the format expected by FinancialCharts
        const { years, ...metrics } = data.metrics as { years: number[]; [key: string]: any };
        const financialData = years.map((year: number, index: number) => ({
          year: Number(year),
          grossFarmIncome: metrics.grossFarmIncome?.[index] || 0,
          operatingExpenses: metrics.operatingExpenses?.[index] || 0,
          netFarmIncome: metrics.netFarmIncome?.[index] || 0,
          nonFarmIncome: metrics.nonFarmIncome?.[index] || 0,
          netIncome: metrics.netIncome?.[index] || 0,
          // Add other required properties with default values if needed
          currentAssets: 0,
          currentLiabilities: 0,
          totalAssets: 0,
          totalEquity: 0,
          termDebt: 0
        }));
        setFinancialData(financialData);
      }

      // Create or update session with analysis
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = createSession(file.name, fileHash, 'income_statement')
      }
      
      // Add analysis to chat history
      addMessage(sessionId, {
        type: 'analysis',
        content: typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData)
      })

      // Generate follow-up questions after analysis
      await generateFollowUpQuestions(typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData))
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing the income statement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAskQuestion = async (question?: string) => {
    const questionToAsk = question || followUpQuestion.trim();
    if (!questionToAsk || !currentSessionId) return;

    setIsAsking(true);
    setFollowUpResponse("");

    // If clicking a suggested question, update the input field
    if (question) {
      setFollowUpQuestion(question);
    }

    try {
      // Add question to chat history
      addMessage(currentSessionId, {
        type: 'question',
        content: questionToAsk
      });

      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionToAsk,
          context: analysis,
          analysisType: "income_statement",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const formattedResponse = formatMarkdown(data.response);
      setFollowUpResponse(formattedResponse);
      
      // Add response to chat history
      addMessage(currentSessionId, {
        type: 'response',
        content: formattedResponse
      });
      
      // Only clear the input if it was a manual question
      if (!question) {
        setFollowUpQuestion("");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAsking(false);
    }
  }

  const exportReport = async () => {
    if (!analysis) return

    setIsExporting(true)
    try {
      // Create a markdown file with the analysis
      const blob = new Blob([analysis], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'financial-analysis-report.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Report exported',
        description: 'The financial analysis report has been downloaded.',
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the report.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generateFollowUpQuestions = async (analysisText: string) => {
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: analysisText,
          analysisType: 'income_statement'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate follow-up questions');
      }

      const data = await response.json();
      setFollowUpQuestions(data.questions || []);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      setFollowUpQuestions([
        'What are the main expense categories?',
        'How does this year\'s income compare to previous years?',
        'What are the key profitability ratios?',
      ]);
    }
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
                <Button 
                  onClick={handleAnalyze} 
                  disabled={!file || isAnalyzing}
                  className="w-full sm:w-auto"
                >
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
            
            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing income statement...</span>
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
            <div className="space-y-6">
              {formatIncomeStatementAnalysis(analysis)}
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
                        className="text-xs"
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
            analysisType="income_statement" 
            onSelectSession={(sessionId) => {
              const session = getSession(sessionId)
              if (session) {
                const analysisMessage = session.messages.find(m => m.type === 'analysis')
                if (analysisMessage) {
                  setAnalysis(analysisMessage.content)
                }
              }
            }}
          />
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>
                Review your questions and AI responses for this document
              </CardDescription>
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
