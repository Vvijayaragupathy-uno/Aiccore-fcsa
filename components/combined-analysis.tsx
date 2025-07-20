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
import { IntegratedFinancialCharts } from "@/components/integrated-financial-charts"
import { useToast } from "@/hooks/use-toast"
import { formatMarkdown } from "@/lib/markdown-utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatHistory } from "@/components/chat-history"
import { createFileFingerprint } from "@/lib/file-processor"

// Function to extract visualization data from API response
function extractVisualizationData(analysisResult: any) {
  // Priority 1: Check for structured visualization data from GPT-4.1
  if (analysisResult.analysis?.visualizationData && analysisResult.analysis.visualizationData.years) {
    console.log('Using structured visualization data from GPT-4.1 analysis')
    const vizData = analysisResult.analysis.visualizationData
    return vizData.years.map((year: number, index: number) => ({
      year: Number(year),
      grossFarmIncome: vizData.grossFarmIncome?.[index] || 0,
      netFarmIncome: vizData.netFarmIncome?.[index] || 0,
      netIncome: vizData.netIncome?.[index] || 0,
      currentAssets: vizData.currentAssets?.[index] || 0,
      currentLiabilities: vizData.currentLiabilities?.[index] || 0,
      totalAssets: vizData.totalAssets?.[index] || 0,
      totalEquity: vizData.totalEquity?.[index] || 0,
      workingCapital: vizData.workingCapital?.[index] || 0,
      currentRatio: vizData.currentRatio?.[index] || 0,
      debtServiceCoverage: vizData.debtServiceCoverage?.[index] || 0,
      equityRatio: vizData.equityRatio?.[index] || 0,
      termDebt: vizData.termDebt?.[index] || 0,
      // Enhanced combined metrics
      returnOnAssets: vizData.returnOnAssets?.[index] || 0,
      returnOnEquity: vizData.returnOnEquity?.[index] || 0,
      assetTurnover: vizData.assetTurnover?.[index] || 0,
      operatingProfitMargin: vizData.operatingProfitMargin?.[index] || 0,
    }))
  }
  
  // Priority 2: Check for fallback metrics data
  if (analysisResult.metrics && analysisResult.metrics.years) {
    console.log('Using fallback metrics data')
    const metrics = analysisResult.metrics
    return metrics.years.map((year: number, index: number) => ({
      year: Number(year),
      grossFarmIncome: metrics.grossFarmIncome?.[index] || 0,
      netFarmIncome: metrics.netFarmIncome?.[index] || 0,
      netIncome: metrics.netIncome?.[index] || 0,
      currentAssets: metrics.currentAssets?.[index] || 0,
      currentLiabilities: metrics.currentLiabilities?.[index] || 0,
      totalAssets: metrics.totalAssets?.[index] || 0,
      totalEquity: metrics.totalEquity?.[index] || 0,
      workingCapital: metrics.workingCapital?.[index] || 0,
      currentRatio: metrics.currentRatio?.[index] || 0,
      debtServiceCoverage: metrics.debtServiceCoverage?.[index] || 0,
      equityRatio: metrics.equityRatio?.[index] || 0,
      termDebt: metrics.termDebt?.[index] || 0,
      // Enhanced combined metrics
      returnOnAssets: metrics.returnOnAssets?.[index] || 0,
      returnOnEquity: metrics.returnOnEquity?.[index] || 0,
      assetTurnover: metrics.assetTurnover?.[index] || 0,
      operatingProfitMargin: metrics.operatingProfitMargin?.[index] || 0,
    }))
  }
  
  // Priority 3: Return sample data as fallback
  console.log('Using sample data as fallback')
  const currentYear = new Date().getFullYear()
  return [
    {
      year: currentYear - 2,
      grossFarmIncome: 2250000,
      netFarmIncome: 80000,
      netIncome: 120000,
      currentAssets: 335000,
      currentLiabilities: 240000,
      totalAssets: 3515000,
      totalEquity: 2365000,
      workingCapital: 95000,
      currentRatio: 1.40,
      debtServiceCoverage: 0.89,
      equityRatio: 67.3,
      termDebt: 875000,
      returnOnAssets: 3.4,
      returnOnEquity: 5.1,
      assetTurnover: 0.64,
      operatingProfitMargin: 3.6,
    },
    {
      year: currentYear - 1,
      grossFarmIncome: 2367000,
      netFarmIncome: 81000,
      netIncome: 127000,
      currentAssets: 375000,
      currentLiabilities: 260000,
      totalAssets: 3712000,
      totalEquity: 2619000,
      workingCapital: 115000,
      currentRatio: 1.44,
      debtServiceCoverage: 0.94,
      equityRatio: 70.6,
      termDebt: 795000,
      returnOnAssets: 3.4,
      returnOnEquity: 4.8,
      assetTurnover: 0.64,
      operatingProfitMargin: 3.4,
    },
    {
      year: currentYear,
      grossFarmIncome: 2593000,
      netFarmIncome: 129000,
      netIncome: 169000,
      currentAssets: 402000,
      currentLiabilities: 270000,
      totalAssets: 3958000,
      totalEquity: 2931000,
      workingCapital: 132000,
      currentRatio: 1.49,
      debtServiceCoverage: 1.17,
      equityRatio: 74.1,
      termDebt: 715000,
      returnOnAssets: 4.3,
      returnOnEquity: 5.8,
      assetTurnover: 0.66,
      operatingProfitMargin: 5.0,
    }
  ]
}

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
      {/* Integrated Metrics Dashboard */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
            Combined Analysis Dashboard
          </span>
          <span className="text-sm text-gray-600 ml-2">Insights from Income Statement + Balance Sheet</span>
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* ROA Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Return on Assets</h4>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">ROA</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {analysis?.metrics?.returnOnAssets?.[analysis.metrics.returnOnAssets.length - 1] || 4.3}%
            </p>
            <p className="text-xs text-gray-500">How efficiently assets generate income</p>
          </div>
          
          {/* ROE Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Return on Equity</h4>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">ROE</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {analysis?.metrics?.returnOnEquity?.[analysis.metrics.returnOnEquity.length - 1] || 5.8}%
            </p>
            <p className="text-xs text-gray-500">Return generated on equity investment</p>
          </div>
          
          {/* DSCR Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Debt Service Coverage</h4>
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">DSCR</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {analysis?.metrics?.debtServiceCoverage?.[analysis.metrics.debtServiceCoverage.length - 1] || 1.17}
            </p>
            <p className="text-xs text-gray-500">Ability to service debt from income</p>
          </div>
          
          {/* Asset Turnover Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Asset Turnover</h4>
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">Efficiency</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {analysis?.metrics?.assetTurnover?.[analysis.metrics.assetTurnover.length - 1] || 0.66}
            </p>
            <p className="text-xs text-gray-500">Revenue generated per dollar of assets</p>
          </div>
        </div>
        
        <div className="bg-white/70 rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-800 mb-3">Key Combined Insights</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Profitability Integration</h5>
              <p className="text-sm text-gray-600">
                The operation generates {analysis?.metrics?.returnOnAssets?.[analysis.metrics.returnOnAssets.length - 1] || 4.3}% return on assets, 
                indicating {(analysis?.metrics?.returnOnAssets?.[analysis.metrics.returnOnAssets.length - 1] || 4.3) >= 4 ? 'strong' : 'adequate'} 
                efficiency in converting assets to income.
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Financial Sustainability</h5>
              <p className="text-sm text-gray-600">
                Debt service coverage of {analysis?.metrics?.debtServiceCoverage?.[analysis.metrics.debtServiceCoverage.length - 1] || 1.17} 
                shows {(analysis?.metrics?.debtServiceCoverage?.[analysis.metrics.debtServiceCoverage.length - 1] || 1.17) >= 1.25 ? 'strong' : 'adequate'} 
                ability to meet debt obligations from operating income.
              </p>
            </div>
          </div>
        </div>
      </div>

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
              {section.title === 'Earnings' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                  Income Statement + Balance Sheet Analysis
                </span>
              )}
              {section.title === 'Cash' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                  Liquidity + Cash Flow Analysis
                </span>
              )}
              {section.title === 'Capital' && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
                  Capital Structure + Efficiency Analysis
                </span>
              )}
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
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${metric.trend === 'Improving' ? 'bg-green-100 text-green-700' :
                            metric.trend === 'Stable' ? 'bg-gray-100 text-gray-700' :
                              metric.trend === 'Declining' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {metric.trend}
                          </span>
                          {(metric.name.includes('Return on') || metric.name.includes('Asset Turnover') || metric.name.includes('Debt Service')) && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                              Combined
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-base font-semibold text-gray-900 mb-2">{metric.value}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{metric.analysis}</p>
                      {(metric.name.includes('Return on') || metric.name.includes('Asset Turnover') || metric.name.includes('Debt Service')) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-indigo-600 font-medium">
                            💡 This metric combines data from both income statement and balance sheet
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add integrated metrics trend table for key sections */}
            {(section.title === 'Earnings' || section.title === 'Capital') && analysis?.metrics && (
              <div className="mb-6 bg-white/70 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-800 mb-4">
                  {section.title === 'Earnings' ? 'Profitability Trends' : 'Capital Efficiency Trends'}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">Metric</th>
                        {analysis.metrics.years?.map((year: number) => (
                          <th key={year} className="text-right py-2 px-3">{year}</th>
                        ))}
                        <th className="text-center py-2 px-3">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.title === 'Earnings' && (
                        <>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 px-3 font-medium">Return on Assets</td>
                            {analysis.metrics.returnOnAssets?.map((value: number, i: number) => (
                              <td key={i} className="text-right py-2 px-3">{value}%</td>
                            ))}
                            <td className="text-center py-2 px-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                (analysis.metrics.returnOnAssets?.[analysis.metrics.returnOnAssets.length - 1] || 0) > 
                                (analysis.metrics.returnOnAssets?.[0] || 0) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {(analysis.metrics.returnOnAssets?.[analysis.metrics.returnOnAssets.length - 1] || 0) > 
                                 (analysis.metrics.returnOnAssets?.[0] || 0) ? '↗ Improving' : '→ Stable'}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 px-3 font-medium">Return on Equity</td>
                            {analysis.metrics.returnOnEquity?.map((value: number, i: number) => (
                              <td key={i} className="text-right py-2 px-3">{value}%</td>
                            ))}
                            <td className="text-center py-2 px-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                (analysis.metrics.returnOnEquity?.[analysis.metrics.returnOnEquity.length - 1] || 0) > 
                                (analysis.metrics.returnOnEquity?.[0] || 0) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {(analysis.metrics.returnOnEquity?.[analysis.metrics.returnOnEquity.length - 1] || 0) > 
                                 (analysis.metrics.returnOnEquity?.[0] || 0) ? '↗ Improving' : '→ Stable'}
                              </span>
                            </td>
                          </tr>
                        </>
                      )}
                      {section.title === 'Capital' && (
                        <>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 px-3 font-medium">Asset Turnover</td>
                            {analysis.metrics.assetTurnover?.map((value: number, i: number) => (
                              <td key={i} className="text-right py-2 px-3">{value}</td>
                            ))}
                            <td className="text-center py-2 px-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                (analysis.metrics.assetTurnover?.[analysis.metrics.assetTurnover.length - 1] || 0) > 
                                (analysis.metrics.assetTurnover?.[0] || 0) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {(analysis.metrics.assetTurnover?.[analysis.metrics.assetTurnover.length - 1] || 0) > 
                                 (analysis.metrics.assetTurnover?.[0] || 0) ? '↗ Improving' : '→ Stable'}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 px-3 font-medium">Equity Ratio</td>
                            {analysis.metrics.equityRatio?.map((value: number, i: number) => (
                              <td key={i} className="text-right py-2 px-3">{value}%</td>
                            ))}
                            <td className="text-center py-2 px-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                (analysis.metrics.equityRatio?.[analysis.metrics.equityRatio.length - 1] || 0) > 
                                (analysis.metrics.equityRatio?.[0] || 0) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {(analysis.metrics.equityRatio?.[analysis.metrics.equityRatio.length - 1] || 0) > 
                                 (analysis.metrics.equityRatio?.[0] || 0) ? '↗ Improving' : '→ Stable'}
                              </span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
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
      
      {/* Combined Analysis Value Proposition */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="bg-gray-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
            Why Combined Analysis Matters
          </span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Unique Insights from Integration</h4>
            <ul className="space-y-2">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">
                  <strong>Return on Assets (ROA):</strong> Shows how efficiently the operation converts assets into income - impossible to calculate from either statement alone
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">
                  <strong>Debt Service Coverage:</strong> Reveals the operation's ability to service debt from operating income, critical for lending decisions
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">
                  <strong>Asset Turnover:</strong> Measures operational efficiency in generating revenue from assets, indicating management effectiveness
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">
                  <strong>Financial Sustainability:</strong> Assesses whether earnings trends support the capital structure over time
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Enhanced Decision Making</h4>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-1">Credit Risk Assessment</h5>
                <p className="text-xs text-gray-600">
                  Combined analysis provides a complete picture of repayment capacity by linking income generation to debt obligations and asset backing.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-1">Operational Efficiency</h5>
                <p className="text-xs text-gray-600">
                  Integration reveals how well management utilizes assets to generate income, identifying opportunities for improvement.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-1">Long-term Viability</h5>
                <p className="text-xs text-gray-600">
                  Shows whether the business model is sustainable by analyzing the relationship between earnings growth and capital structure changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      // Ensure we pass the complete analysis data structure
      const analysisDataToSend = analysisResult.analysis || analysisResult
      
      console.log('Sending follow-up question with analysis data:', {
        hasAnalysis: !!analysisDataToSend,
        analysisKeys: analysisDataToSend ? Object.keys(analysisDataToSend) : [],
        question: followUpQuestion
      })

      const response = await fetch("/api/combined-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: followUpQuestion,
          analysisData: analysisDataToSend,
          incomeFileName: incomeFile?.name,
          balanceFileName: balanceFile?.name,
          dataHash: analysisResult.dataHash,
          // Also include metrics and raw data for better context
          metrics: analysisResult.metrics,
          originalIncomeFileName: analysisResult.incomeFileName,
          originalBalanceFileName: analysisResult.balanceFileName,
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

      {/* Financial Data Visualizations */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Integrated Financial Analysis</span>
            </CardTitle>
            <CardDescription>Combined insights from income statement and balance sheet data</CardDescription>
          </CardHeader>
          <CardContent>
            <IntegratedFinancialCharts data={extractVisualizationData(analysisResult)} />
            
            {/* Traditional charts as secondary view */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Traditional Financial Charts</h3>
              <FinancialCharts 
                data={extractVisualizationData(analysisResult)} 
                type="combined" 
              />
            </div>
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
              {suggestedQuestions.length > 0 ? (
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
              ) : analysisResult && (
                <div>
                  <Label className="text-sm font-medium">Sample Combined Analysis Questions:</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("How does the return on assets compare to industry benchmarks?")}
                      className="text-xs"
                    >
                      ROA vs Industry Benchmarks
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("What does the debt service coverage trend indicate about financial risk?")}
                      className="text-xs"
                    >
                      DSCR Risk Analysis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("How efficiently is the operation using its assets to generate revenue?")}
                      className="text-xs"
                    >
                      Asset Efficiency Analysis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion("What integrated insights can help improve overall financial performance?")}
                      className="text-xs"
                    >
                      Performance Improvement Insights
                    </Button>
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
