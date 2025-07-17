"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Send, Loader2, BarChart3, Building, AlertCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"
import { formatMarkdown, extractAndFormatMetrics } from "@/lib/markdown-utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatHistory, ChatMessages } from "@/components/chat-history"
import { createFileFingerprint } from "@/lib/file-processor"

// Function to format balance sheet analysis into structured sections
function formatBalanceSheetAnalysis(analysis: any) {
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

  // New JSON format
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
              <h4 className="font-semibold text-gray-800 mb-2">Risk Level</h4>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                analysis.executiveSummary.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                analysis.executiveSummary.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {analysis.executiveSummary.riskLevel} Risk
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
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
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
                      <p className="text-lg font-semibold text-blue-600 mb-2">{metric.value}</p>
                    )}
                    {metric.currentValue && (
                      <p className="text-lg font-semibold text-blue-600 mb-2">{metric.currentValue}</p>
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
                    {metric.businessDrivers && metric.businessDrivers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Business Drivers:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {metric.businessDrivers.map((driver: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-blue-500">•</span>
                              <span>{driver}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {metric.riskImplications && metric.riskImplications.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Risk Implications:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {metric.riskImplications.map((risk: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-red-500">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Additional Balance Sheet Metric Fields */}
                    {metric.timeline && (
                      <p className="text-sm text-gray-600 mb-1">Timeline: {metric.timeline}</p>
                    )}
                    {metric.threshold && (
                      <p className="text-sm text-gray-600 mb-1">Threshold: {metric.threshold}</p>
                    )}
                    {metric.action && (
                      <p className="text-sm text-gray-600 mb-1">Action: {metric.action}</p>
                    )}
                    {/* Additional Balance Sheet Specific Fields */}
                    {metric.composition && (
                      <p className="text-sm text-gray-600 mb-1">Composition: {metric.composition}</p>
                    )}
                    {metric.realEstateValue && (
                      <p className="text-sm text-gray-600 mb-1">Real Estate Value: {metric.realEstateValue}</p>
                    )}
                    {metric.assetQuality && (
                      <p className="text-sm text-gray-600 mb-1">Asset Quality: {metric.assetQuality}</p>
                    )}
                    {metric.liquidityAssessment && (
                      <p className="text-sm text-gray-600 mb-1">Liquidity: {metric.liquidityAssessment}</p>
                    )}
                    {metric.paymentPatterns && (
                      <p className="text-sm text-gray-600 mb-1">Payment Patterns: {metric.paymentPatterns}</p>
                    )}
                    {metric.seasonalVariation && (
                      <p className="text-sm text-gray-600 mb-1">Seasonal Variation: {metric.seasonalVariation}</p>
                    )}
                    {metric.supplierRelationships && (
                      <p className="text-sm text-gray-600 mb-1">Supplier Relationships: {metric.supplierRelationships}</p>
                    )}
                    {metric.riskFactors && (
                      <p className="text-sm text-gray-600 mb-1">Risk Factors: {metric.riskFactors}</p>
                    )}
                    {metric.serviceCapacity && (
                      <p className="text-sm text-gray-600 mb-1">Service Capacity: {metric.serviceCapacity}</p>
                    )}
                    {metric.maturitySchedule && (
                      <p className="text-sm text-gray-600 mb-1">Maturity Schedule: {metric.maturitySchedule}</p>
                    )}
                    {metric.interestRateExposure && (
                      <p className="text-sm text-gray-600 mb-1">Interest Rate Exposure: {metric.interestRateExposure}</p>
                    )}
                    {metric.cashFlowAdequacy && (
                      <p className="text-sm text-gray-600 mb-1">Cash Flow Adequacy: {metric.cashFlowAdequacy}</p>
                    )}
                    {metric.interestRates && (
                      <p className="text-sm text-gray-600 mb-1">Interest Rates: {metric.interestRates}</p>
                    )}
                    {metric.maturityProfile && (
                      <p className="text-sm text-gray-600 mb-1">Maturity Profile: {metric.maturityProfile}</p>
                    )}
                    {metric.covenantCompliance && (
                      <p className="text-sm text-gray-600 mb-1">Covenant Compliance: {metric.covenantCompliance}</p>
                    )}
                    {metric.relationshipStrength && (
                      <p className="text-sm text-gray-600 mb-1">Relationship Strength: {metric.relationshipStrength}</p>
                    )}
                    {metric.lenderDiversification && (
                      <p className="text-sm text-gray-600 mb-1">Lender Diversification: {metric.lenderDiversification}</p>
                    )}
                    {metric.terms && (
                      <p className="text-sm text-gray-600 mb-1">Terms: {metric.terms}</p>
                    )}
                    {metric.refinancingOpportunities && (
                      <p className="text-sm text-gray-600 mb-1">Refinancing Opportunities: {metric.refinancingOpportunities}</p>
                    )}
                    {metric.debtServiceCoverage && (
                      <p className="text-sm text-gray-600 mb-1">Debt Service Coverage: {metric.debtServiceCoverage}</p>
                    )}
                    {metric.leverageRatios && (
                      <p className="text-sm text-gray-600 mb-1">Leverage Ratios: {metric.leverageRatios}</p>
                    )}
                    {metric.maturityLadder && (
                      <p className="text-sm text-gray-600 mb-1">Maturity Ladder: {metric.maturityLadder}</p>
                    )}
                    {metric.riskAssessment && (
                      <p className="text-sm text-gray-600 mb-1">Risk Assessment: {metric.riskAssessment}</p>
                    )}
                    {metric.loanToValueRatio && (
                      <p className="text-sm text-gray-600 mb-1">Loan-to-Value Ratio: {metric.loanToValueRatio}</p>
                    )}
                    {metric.propertyValues && (
                      <p className="text-sm text-gray-600 mb-1">Property Values: {metric.propertyValues}</p>
                    )}
                    {metric.collateralSecurity && (
                      <p className="text-sm text-gray-600 mb-1">Collateral Security: {metric.collateralSecurity}</p>
                    )}
                    {metric.lenderTypes && (
                      <p className="text-sm text-gray-600 mb-1">Lender Types: {metric.lenderTypes}</p>
                    )}
                    {metric.loanTerms && (
                      <p className="text-sm text-gray-600 mb-1">Loan Terms: {metric.loanTerms}</p>
                    )}
                    {metric.marketRates && (
                      <p className="text-sm text-gray-600 mb-1">Market Rates: {metric.marketRates}</p>
                    )}
                    {metric.refinancingPotential && (
                      <p className="text-sm text-gray-600 mb-1">Refinancing Potential: {metric.refinancingPotential}</p>
                    )}
                    {metric.totalLoanToValue && (
                      <p className="text-sm text-gray-600 mb-1">Total LTV: {metric.totalLoanToValue}</p>
                    )}
                    {metric.portfolioRisk && (
                      <p className="text-sm text-gray-600 mb-1">Portfolio Risk: {metric.portfolioRisk}</p>
                    )}
                    {metric.marketExposure && (
                      <p className="text-sm text-gray-600 mb-1">Market Exposure: {metric.marketExposure}</p>
                    )}
                    {metric.equityBuildingRate && (
                      <p className="text-sm text-gray-600 mb-1">Equity Building Rate: {metric.equityBuildingRate}</p>
                    )}
                    {metric.sustainabilityAssessment && (
                      <p className="text-sm text-gray-600 mb-1">Sustainability: {metric.sustainabilityAssessment}</p>
                    )}
                    {metric.returnOnEquity && (
                      <p className="text-sm text-gray-600 mb-1">Return on Equity: {metric.returnOnEquity}</p>
                    )}
                    {metric.equityRatio && (
                      <p className="text-sm text-gray-600 mb-1">Equity Ratio: {metric.equityRatio}</p>
                    )}
                    {metric.equityComposition && (
                      <p className="text-sm text-gray-600 mb-1">Equity Composition: {metric.equityComposition}</p>
                    )}
                    {metric.leveragePosition && (
                      <p className="text-sm text-gray-600 mb-1">Leverage Position: {metric.leveragePosition}</p>
                    )}
                    {metric.equityGrowthRate && (
                      <p className="text-sm text-gray-600 mb-1">Equity Growth Rate: {metric.equityGrowthRate}</p>
                    )}
                    {metric.benchmarkComparison && (
                      <p className="text-sm text-gray-600 mb-1">Benchmark Comparison: {metric.benchmarkComparison}</p>
                    )}
                    {metric.standardComparison && (
                      <p className="text-sm text-gray-600 mb-1">Standard Comparison: {metric.standardComparison}</p>
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
                  <div key={recIndex} className="border-l-4 border-blue-500 pl-4">
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
                    {/* Additional Balance Sheet Recommendation Fields */}
                    {rec.timeline && (
                      <p className="text-sm text-gray-600 mt-1">Timeline: {rec.timeline}</p>
                    )}
                    {rec.conditions && rec.conditions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Conditions:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.conditions.map((condition: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-blue-500">•</span>
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rec.riskMitigation && rec.riskMitigation.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Risk Mitigation:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.riskMitigation.map((risk: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-orange-500">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rec.measurableTargets && rec.measurableTargets.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Measurable Targets:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.measurableTargets.map((target: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-green-500">•</span>
                              <span>{target}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rec.frequency && (
                      <p className="text-sm text-gray-600 mt-1">Frequency: {rec.frequency}</p>
                    )}
                    {rec.triggerEvents && rec.triggerEvents.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Trigger Events:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.triggerEvents.map((event: string, index: number) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-purple-500">•</span>
                              <span>{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Balance Sheet Specific Recommendation Fields */}
                    {rec.alternativeStructures && (
                      <p className="text-sm text-gray-600 mt-1">Alternative Structures: {rec.alternativeStructures}</p>
                    )}
                    {rec.collateralRequirements && (
                      <p className="text-sm text-gray-600 mt-1">Collateral Requirements: {rec.collateralRequirements}</p>
                    )}
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

export function BalanceSheetAnalysis() {
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
  const { toast } = useToast()
  const { 
    createSession, 
    addMessage, 
    getSessionByFileHash, 
    currentSessionId, 
    setCurrentSession,
    getSession 
  } = useChatContext()

  const generateFollowUpQuestions = async (analysisText: string) => {
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: analysisText,
          analysisType: 'balance_sheet'
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
        'What are the key trends in working capital?',
        'How does the current ratio compare to industry standards?',
        'What are the main risks in the balance sheet?'
      ]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create file hash for session management
      const hash = await createFileFingerprint(uploadedFile)
      setFileHash(hash)
      
      // Check for existing session
      const existingSession = getSessionByFileHash(hash, 'balance_sheet')
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

      const response = await fetch("/api/analyze-balance", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (!response.ok) {
        throw new Error("Failed to analyze balance sheet")
      }

      const data = await response.json()
      // Handle both JSON and text analysis formats
      const analysisData = data.analysis
      setAnalysis(analysisData)
      await generateFollowUpQuestions(typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData))

      // Extract and set financial data for charts if available
      if (data.financialData) {
        setFinancialData(data.financialData)
      }

      // Create or update session with analysis
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = createSession(file.name, fileHash, 'balance_sheet')
      }
      
      // Add analysis to chat history
      addMessage(sessionId, {
        type: 'analysis',
        content: typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData)
      })

      toast({
        title: "Analysis complete",
        description: "Your balance sheet has been analyzed successfully.",
      })
    } catch (error) {
      console.error("Error analyzing balance sheet:", error)
      toast({
        title: "Error",
        description: "Failed to analyze balance sheet. Please try again.",
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
          analysisType: "balance_sheet",
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

      toast({
        title: "Question answered",
        description: "Your follow-up question has been answered.",
      });
    } catch (error) {
      console.error("Error asking question:", error);
      toast({
        title: "Error",
        description: "Failed to get response to your question.",
        variant: "destructive",
      });
    } finally {
      setIsAsking(false);
    }
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
                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
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
            
            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing balance sheet...</span>
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
            <div className="space-y-6">
              {formatBalanceSheetAnalysis(analysis)}
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
              {/* Suggested Questions */}
              <div className="space-y-4">
                {followUpQuestions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Suggested questions:</Label>
                    <div className="flex flex-wrap gap-2">
                      {followUpQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleAskQuestion(question)}
                          disabled={isAsking}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="follow-up">Ask a follow-up question</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="follow-up"
                      placeholder="Ask about the analysis..."
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      disabled={isAsking}
                    />
                    <Button
                      onClick={() => handleAskQuestion()}
                      disabled={isAsking || !followUpQuestion.trim()}
                    >
                      {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {followUpResponse && (
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <p className="whitespace-pre-line">{followUpResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat History */}
      {currentSessionId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChatHistory 
            analysisType="balance_sheet" 
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
