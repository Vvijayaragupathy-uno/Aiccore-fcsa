"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, TrendingUp, BarChart3, MessageSquare } from "lucide-react"
import { IncomeStatementAnalysis } from "@/components/income-statement-analysis"
import { BalanceSheetAnalysis } from "@/components/balance-sheet-analysis"
import { CombinedAnalysis } from "@/components/combined-analysis"

export default function FinancialAnalysisPlatform() {
  const [activeTab, setActiveTab] = useState("income")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AgriLend Insight </h1>
                <p className="text-sm text-gray-600">AI-Powered Financial Statement Analysis for Credit Underwriting</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income Statement Analysis</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Earnings Trends</div>
              <p className="text-xs text-muted-foreground">
                Analyze profitability, cash flow, and debt coverage ratios
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Sheet Analysis</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Capital Structure</div>
              <p className="text-xs text-muted-foreground">
                Evaluate working capital, equity trends, and leverage ratios
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Combined Analysis</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Comprehensive</div>
              <p className="text-xs text-muted-foreground">Integrated view of financial health and lending risk</p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Tabs */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Financial Statement Analysis</span>
            </CardTitle>
            <CardDescription>
              Upload your financial statements and get comprehensive AI-powered analysis with follow-up insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="income" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Income Statement</span>
                </TabsTrigger>
                <TabsTrigger value="balance" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Balance Sheet</span>
                </TabsTrigger>
                <TabsTrigger value="combined" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Combined Analysis</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="mt-6">
                <IncomeStatementAnalysis />
              </TabsContent>

              <TabsContent value="balance" className="mt-6">
                <BalanceSheetAnalysis />
              </TabsContent>

              <TabsContent value="combined" className="mt-6">
                <CombinedAnalysis />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
