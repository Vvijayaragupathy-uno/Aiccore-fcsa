"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Send, Loader2, BarChart3, Building, AlertCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FinancialCharts } from "@/components/financial-charts"
import { useToast } from "@/hooks/use-toast"
import { formatMarkdown } from "@/lib/markdown-utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatHistory, ChatMessages } from "@/components/chat-history"
import { createFileFingerprint } from "@/lib/file-processor"
import {
  validateFinancialFile,
  validateFollowUpQuestion,
  sanitizeInput,
  analysisRateLimiter,
  questionRateLimiter,
} from "@/lib/input-validation"

// Function to format balance sheet analysis into structured sections
function formatBalanceSheetAnalysis(analysis: any) {
  if (!analysis) return null

  // Handle both old text format and new JSON format
  if (typeof analysis === "string") {
    try {
      const parsedAnalysis = JSON.parse(analysis)
      return formatBalanceSheetAnalysis(parsedAnalysis)
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

  // New JSON format - Display ALL sections and data
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
            {analysis.executiveSummary.creditRecommendation && (
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
            )}
          </div>

          {/* Business Drivers */}
          {analysis.executiveSummary.businessDrivers?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Business Drivers</h4>
              <ul className="space-y-2">
                {analysis.executiveSummary.businessDrivers.map((driver: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Industry Context */}
          {analysis.executiveSummary.industryContext && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Industry Context</h4>
              <p className="text-gray-700 leading-relaxed">{analysis.executiveSummary.industryContext}</p>
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

      {/* Five C's Analysis */}
      {analysis.fiveCsAnalysis && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
              5 C's
            </span>
            Five C's of Credit Analysis
          </h3>

          <div className="grid md:grid-cols-1 gap-4">
            {Object.entries(analysis.fiveCsAnalysis).map(([key, value]: [string, any]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-900 mb-2 capitalize">{key}</h4>
                <p className="text-gray-700 mb-2">{value.assessment}</p>
                {value.keyFactors && value.keyFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Key Factors:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {value.keyFactors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="text-purple-500">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {value.keyMetrics && value.keyMetrics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Key Metrics:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {value.keyMetrics.map((metric: string, index: number) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="text-purple-500">•</span>
                          <span>{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {value.keyRatios && value.keyRatios.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Key Ratios:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {value.keyRatios.map((ratio: string, index: number) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="text-purple-500">•</span>
                          <span>{ratio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {value.assetValues && value.assetValues.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Asset Values:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {value.assetValues.map((asset: string, index: number) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="text-purple-500">•</span>
                          <span>{asset}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {value.riskFactors && value.riskFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Risk Factors:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {value.riskFactors.map((risk: string, index: number) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="text-red-500">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Sections - Display ALL sections */}
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

          {/* Metrics - Display ALL metric fields */}
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

                    {/* Display ALL metric properties */}
                    {metric.value && <p className="text-lg font-semibold text-blue-600 mb-2">{metric.value}</p>}
                    {metric.currentValue && (
                      <p className="text-lg font-semibold text-blue-600 mb-2">{metric.currentValue}</p>
                    )}
                    {metric.previousValue && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Previous:</strong> {metric.previousValue}
                      </p>
                    )}
                    {metric.yearOverYearChange && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>YoY Change:</strong> {metric.yearOverYearChange}
                      </p>
                    )}
                    {metric.gapToStandard && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Gap to Standard:</strong> {metric.gapToStandard}
                      </p>
                    )}
                    {metric.standardComparison && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Standard Comparison:</strong> {metric.standardComparison}
                      </p>
                    )}
                    {metric.calculation && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Calculation:</strong> {metric.calculation}
                      </p>
                    )}
                    {metric.industryBenchmark && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Industry Benchmark:</strong> {metric.industryBenchmark}
                      </p>
                    )}
                    {metric.seasonalFactors && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Seasonal Factors:</strong> {metric.seasonalFactors}
                      </p>
                    )}
                    {metric.riskImplications && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Risk Implications:</strong> {metric.riskImplications}
                      </p>
                    )}
                    {metric.depreciationPattern && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Depreciation Pattern:</strong> {metric.depreciationPattern}
                      </p>
                    )}
                    {metric.marketValue && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Market Value:</strong> {metric.marketValue}
                      </p>
                    )}
                    {metric.utilizationAssessment && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Utilization Assessment:</strong> {metric.utilizationAssessment}
                      </p>
                    )}
                    {metric.collateralQuality && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Collateral Quality:</strong> {metric.collateralQuality}
                      </p>
                    )}
                    {metric.composition && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Composition:</strong> {metric.composition}
                      </p>
                    )}
                    {metric.realEstateValue && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Real Estate Value:</strong> {metric.realEstateValue}
                      </p>
                    )}
                    {metric.assetQuality && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Asset Quality:</strong> {metric.assetQuality}
                      </p>
                    )}
                    {metric.liquidityAssessment && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Liquidity Assessment:</strong> {metric.liquidityAssessment}
                      </p>
                    )}
                    {metric.paymentPatterns && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Payment Patterns:</strong> {metric.paymentPatterns}
                      </p>
                    )}
                    {metric.seasonalVariation && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Seasonal Variation:</strong> {metric.seasonalVariation}
                      </p>
                    )}
                    {metric.supplierRelationships && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Supplier Relationships:</strong> {metric.supplierRelationships}
                      </p>
                    )}
                    {metric.riskFactors && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Risk Factors:</strong> {metric.riskFactors}
                      </p>
                    )}
                    {metric.serviceCapacity && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Service Capacity:</strong> {metric.serviceCapacity}
                      </p>
                    )}
                    {metric.maturitySchedule && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Maturity Schedule:</strong> {metric.maturitySchedule}
                      </p>
                    )}
                    {metric.interestRateExposure && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Interest Rate Exposure:</strong> {metric.interestRateExposure}
                      </p>
                    )}
                    {metric.cashFlowAdequacy && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Cash Flow Adequacy:</strong> {metric.cashFlowAdequacy}
                      </p>
                    )}
                    {metric.interestRates && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Interest Rates:</strong> {metric.interestRates}
                      </p>
                    )}
                    {metric.maturityProfile && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Maturity Profile:</strong> {metric.maturityProfile}
                      </p>
                    )}
                    {metric.covenantCompliance && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Covenant Compliance:</strong> {metric.covenantCompliance}
                      </p>
                    )}
                    {metric.relationshipStrength && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Relationship Strength:</strong> {metric.relationshipStrength}
                      </p>
                    )}
                    {metric.lenderDiversification && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Lender Diversification:</strong> {metric.lenderDiversification}
                      </p>
                    )}
                    {metric.terms && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Terms:</strong> {metric.terms}
                      </p>
                    )}
                    {metric.refinancingOpportunities && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Refinancing Opportunities:</strong> {metric.refinancingOpportunities}
                      </p>
                    )}
                    {metric.debtServiceCoverage && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Debt Service Coverage:</strong> {metric.debtServiceCoverage}
                      </p>
                    )}
                    {metric.leverageRatios && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Leverage Ratios:</strong> {metric.leverageRatios}
                      </p>
                    )}
                    {metric.maturityLadder && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Maturity Ladder:</strong> {metric.maturityLadder}
                      </p>
                    )}
                    {metric.riskAssessment && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Risk Assessment:</strong> {metric.riskAssessment}
                      </p>
                    )}
                    {metric.loanToValueRatio && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Loan-to-Value Ratio:</strong> {metric.loanToValueRatio}
                      </p>
                    )}
                    {metric.propertyValues && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Property Values:</strong> {metric.propertyValues}
                      </p>
                    )}
                    {metric.collateralSecurity && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Collateral Security:</strong> {metric.collateralSecurity}
                      </p>
                    )}
                    {metric.lenderTypes && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Lender Types:</strong> {metric.lenderTypes}
                      </p>
                    )}
                    {metric.loanTerms && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Loan Terms:</strong> {metric.loanTerms}
                      </p>
                    )}
                    {metric.marketRates && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Market Rates:</strong> {metric.marketRates}
                      </p>
                    )}
                    {metric.refinancingPotential && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Refinancing Potential:</strong> {metric.refinancingPotential}
                      </p>
                    )}
                    {metric.totalLoanToValue && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Total LTV:</strong> {metric.totalLoanToValue}
                      </p>
                    )}
                    {metric.portfolioRisk && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Portfolio Risk:</strong> {metric.portfolioRisk}
                      </p>
                    )}
                    {metric.marketExposure && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Market Exposure:</strong> {metric.marketExposure}
                      </p>
                    )}
                    {metric.equityBuildingRate && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Equity Building Rate:</strong> {metric.equityBuildingRate}
                      </p>
                    )}
                    {metric.sustainabilityAssessment && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Sustainability:</strong> {metric.sustainabilityAssessment}
                      </p>
                    )}
                    {metric.returnOnEquity && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Return on Equity:</strong> {metric.returnOnEquity}
                      </p>
                    )}
                    {metric.equityRatio && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Equity Ratio:</strong> {metric.equityRatio}
                      </p>
                    )}
                    {metric.equityComposition && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Equity Composition:</strong> {metric.equityComposition}
                      </p>
                    )}
                    {metric.leveragePosition && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Leverage Position:</strong> {metric.leveragePosition}
                      </p>
                    )}
                    {metric.equityGrowthRate && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Equity Growth Rate:</strong> {metric.equityGrowthRate}
                      </p>
                    )}
                    {metric.benchmarkComparison && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Benchmark Comparison:</strong> {metric.benchmarkComparison}
                      </p>
                    )}

                    {/* Main analysis text */}
                    {metric.analysis && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          <strong>Analysis:</strong> {metric.analysis}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations - Display ALL recommendation fields */}
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
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Timeline:</strong> {rec.timeline}
                      </p>
                    )}
                    {rec.conditions && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Conditions:</strong> {rec.conditions}
                      </p>
                    )}
                    {rec.riskMitigation && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Risk Mitigation:</strong> {rec.riskMitigation}
                      </p>
                    )}
                    {rec.alternativeStructures && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Alternative Structures:</strong> {rec.alternativeStructures}
                      </p>
                    )}
                    {rec.collateralRequirements && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Collateral Requirements:</strong> {rec.collateralRequirements}
                      </p>
                    )}
                    {rec.measurableTargets && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Measurable Targets:</strong> {rec.measurableTargets}
                      </p>
                    )}
                    {rec.frequency && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Frequency:</strong> {rec.frequency}
                      </p>
                    )}
                    {rec.triggerEvents && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Trigger Events:</strong> {rec.triggerEvents}
                      </p>
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
  const { createSession, addMessage, getSessionByFileHash, currentSessionId, setCurrentSession, getSession } =
    useChatContext()

  const generateFollowUpQuestions = async (analysisText: string) => {
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: analysisText,
          analysisType: "balance_sheet",
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
        "What are the key trends in working capital?",
        "How does the current ratio compare to industry standards?",
        "What are the main risks in the balance sheet?",
      ])
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]

    if (!uploadedFile) {
      return
    }

    // Validate file using enhanced validation
    const validation = validateFinancialFile(uploadedFile)
    if (!validation.isValid) {
      toast({
        title: "File validation failed",
        description: validation.error,
        variant: "destructive",
      })
      // Clear the input
      event.target.value = ""
      return
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast({
          title: "File Warning",
          description: warning,
          variant: "default",
        })
      })
    }

    try {
      // Create file hash for session management
      const hash = await createFileFingerprint(uploadedFile)
      setFileHash(hash)

      // Check for existing session
      const existingSession = getSessionByFileHash(hash, "balance_sheet")
      if (existingSession) {
        setCurrentSession(existingSession.id)
        setFile(uploadedFile)
        // Load previous analysis if available
        const analysisMessage = existingSession.messages.find((m) => m.type === "analysis")
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
          title: "File uploaded successfully",
          description: `${uploadedFile.name} is ready for analysis.`,
        })
      }
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "File processing error",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      })
      // Clear the input
      event.target.value = ""
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a balance sheet file first.",
        variant: "destructive",
      })
      return
    }

    // Check rate limiting for analysis
    if (!analysisRateLimiter.canMakeCall()) {
      const waitTime = Math.ceil(analysisRateLimiter.getTimeUntilNextCall() / 1000)
      toast({
        title: "Analysis rate limit exceeded",
        description: `Please wait ${waitTime} seconds before starting another analysis.`,
        variant: "destructive",
      })
      return
    }

    // Validate file again before analysis
    const validation = validateFinancialFile(file)
    if (!validation.isValid) {
      toast({
        title: "File validation failed",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

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

      console.log("Starting balance sheet analysis...")

      const response = await fetch("/api/analyze-balance", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
        console.error("API Error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Analysis data received:", data.success)

      if (!data.success) {
        throw new Error(data.error || "Analysis failed")
      }

      // Handle both JSON and text analysis formats
      const analysisData = data.analysis
      setAnalysis(analysisData)

      // Generate follow-up questions
      try {
        await generateFollowUpQuestions(typeof analysisData === "string" ? analysisData : JSON.stringify(analysisData))
      } catch (questionError) {
        console.warn("Failed to generate follow-up questions:", questionError)
        // Set default questions if generation fails
        setFollowUpQuestions([
          "What are the key trends in working capital?",
          "How does the current ratio compare to industry standards?",
          "What are the main risks in the balance sheet?",
        ])
      }

      // Check if we have structured visualization data from GPT-4.1
      if (analysisData && typeof analysisData === 'object' && analysisData.visualizationData) {
        // Priority 1: Use structured visualization data from GPT-4.1 analysis
        console.log('Using structured visualization data from GPT-4.1 analysis')
        const vizData = analysisData.visualizationData
        const financialData = vizData.years?.map((year: number, index: number) => ({
          year: Number(year),
          currentAssets: vizData.currentAssets?.[index] || 0,
          currentLiabilities: vizData.currentLiabilities?.[index] || 0,
          totalAssets: vizData.totalAssets?.[index] || 0,
          totalLiabilities: vizData.totalLiabilities?.[index] || 0,
          totalEquity: vizData.totalEquity?.[index] || 0,
          workingCapital: vizData.workingCapital?.[index] || 0,
          currentRatio: vizData.currentRatio?.[index] || 0,
          equityRatio: vizData.equityRatio?.[index] || 0,
        })) || []
        setFinancialData(financialData)
      } else if (data.metrics) {
        // Priority 2: Use fallback metrics data
        console.log('Using fallback metrics data')
        setFinancialData(data.metrics)
      }

      // Create or update session with analysis
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = createSession(file.name, fileHash, "balance_sheet")
      }

      // Add analysis to chat history
      addMessage(sessionId, {
        type: "analysis",
        content: typeof analysisData === "string" ? analysisData : JSON.stringify(analysisData),
      })

      toast({
        title: "Analysis complete",
        description: "Your balance sheet has been analyzed successfully.",
      })
    } catch (error) {
      console.error("Error analyzing balance sheet:", error)

      let errorMessage = "Failed to analyze balance sheet. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("timeout")) {
          errorMessage = "Analysis timed out. Please try with a smaller file."
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Too many requests. Please wait a moment and try again."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const handleAskQuestion = async (question?: string) => {
    const questionToAsk = question || followUpQuestion.trim()

    // Validate question input
    if (!questionToAsk) {
      toast({
        title: "Question required",
        description: "Please enter a question before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!currentSessionId) {
      toast({
        title: "No active session",
        description: "Please upload and analyze a file first.",
        variant: "destructive",
      })
      return
    }

    // Validate question content
    const validation = validateFollowUpQuestion(questionToAsk)
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors)[0]
      toast({
        title: "Invalid question",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    // Show warnings if any
    if (validation.warnings && Object.keys(validation.warnings).length > 0) {
      const warningMessage = Object.values(validation.warnings)[0]
      toast({
        title: "Question Warning",
        description: warningMessage,
        variant: "default",
      })
    }

    // Check rate limiting
    if (!questionRateLimiter.canMakeCall()) {
      const waitTime = Math.ceil(questionRateLimiter.getTimeUntilNextCall() / 1000)
      toast({
        title: "Rate limit exceeded",
        description: `Please wait ${waitTime} seconds before asking another question.`,
        variant: "destructive",
      })
      return
    }

    setIsAsking(true)
    setFollowUpResponse("")

    // If clicking a suggested question, update the input field
    if (question) {
      setFollowUpQuestion(question)
    }

    try {
      // Sanitize the question before processing
      const sanitizedQuestion = sanitizeInput(questionToAsk)

      // Add question to chat history
      addMessage(currentSessionId, {
        type: "question",
        content: sanitizedQuestion,
      })

      const response = await fetch("/api/balance-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: sanitizedQuestion,
          analysisData: analysis,
          fileName: file?.name,
          dataHash: fileHash
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      const formattedResponse = formatMarkdown(data.answer)
      setFollowUpResponse(formattedResponse)

      // Add response to chat history
      addMessage(currentSessionId, {
        type: "response",
        content: formattedResponse,
      })

      // Only clear the input if it was a manual question
      if (!question) {
        setFollowUpQuestion("")
      }

      toast({
        title: "Question answered",
        description: "Your follow-up question has been answered.",
      })
    } catch (error) {
      console.error("Error asking question:", error)
      toast({
        title: "Error",
        description: "Failed to get response to your question.",
        variant: "destructive",
      })
    } finally {
      setIsAsking(false)
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
            <div className="space-y-6">{formatBalanceSheetAnalysis(analysis)}</div>
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
                          className="text-xs bg-transparent"
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
                      onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                      disabled={isAsking}
                    />
                    <Button onClick={() => handleAskQuestion()} disabled={isAsking || !followUpQuestion.trim()}>
                      {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {followUpResponse && (
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div dangerouslySetInnerHTML={{ __html: followUpResponse }} />
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
