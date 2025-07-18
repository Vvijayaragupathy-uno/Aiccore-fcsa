"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"

interface FinancialData {
  year: number
  grossFarmIncome?: number
  operatingExpenses?: number
  netFarmIncome?: number
  nonFarmIncome?: number
  netIncome?: number
  currentAssets?: number
  currentLiabilities?: number
  totalAssets?: number
  totalEquity?: number
  termDebt?: number
}

interface FinancialChartsProps {
  data: FinancialData[]
  type?: "income" | "balance" | "combined"
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function FinancialCharts({ data, type = "combined" }: FinancialChartsProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No financial data available for visualization</div>
  }

  // Income Statement Charts
  const renderIncomeCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income Trends</CardTitle>
          <CardDescription>Farm and non-farm income over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              grossFarmIncome: {
                label: "Gross Farm Income",
                color: "#8884d8",
              },
              netFarmIncome: {
                label: "Net Farm Income",
                color: "#82ca9d",
              },
              nonFarmIncome: {
                label: "Non-Farm Income",
                color: "#ffc658",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="grossFarmIncome"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Gross Farm Income"
                />
                <Line type="monotone" dataKey="netFarmIncome" stroke="#82ca9d" strokeWidth={2} name="Net Farm Income" />
                <Line type="monotone" dataKey="nonFarmIncome" stroke="#ffc658" strokeWidth={2} name="Non-Farm Income" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Profitability Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability Analysis</CardTitle>
          <CardDescription>Net income and operating expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              netIncome: {
                label: "Net Income",
                color: "#8884d8",
              },
              operatingExpenses: {
                label: "Operating Expenses",
                color: "#ff7300",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="netIncome" fill="#8884d8" name="Net Income" />
                <Bar dataKey="operatingExpenses" fill="#ff7300" name="Operating Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )

  // Balance Sheet Charts
  const renderBalanceCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assets vs Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Assets vs Liabilities</CardTitle>
          <CardDescription>Financial position over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              totalAssets: {
                label: "Total Assets",
                color: "#8884d8",
              },
              currentLiabilities: {
                label: "Current Liabilities",
                color: "#ff7300",
              },
              termDebt: {
                label: "Term Debt",
                color: "#ff0000",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="totalAssets" stroke="#8884d8" strokeWidth={2} name="Total Assets" />
                <Line
                  type="monotone"
                  dataKey="currentLiabilities"
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="Current Liabilities"
                />
                <Line type="monotone" dataKey="termDebt" stroke="#ff0000" strokeWidth={2} name="Term Debt" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Equity Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Equity Growth</CardTitle>
          <CardDescription>Owner's equity and current assets</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              totalEquity: {
                label: "Total Equity",
                color: "#82ca9d",
              },
              currentAssets: {
                label: "Current Assets",
                color: "#8884d8",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalEquity" fill="#82ca9d" name="Total Equity" />
                <Bar dataKey="currentAssets" fill="#8884d8" name="Current Assets" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )

  // Combined Charts
  const renderCombinedCharts = () => (
    <div className="space-y-6">
      {/* Comprehensive Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Assets</CardTitle>
            <CardDescription>Relationship between income and asset base</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                netIncome: {
                  label: "Net Income",
                  color: "#8884d8",
                },
                totalAssets: {
                  label: "Total Assets",
                  color: "#82ca9d",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="netIncome" stroke="#8884d8" strokeWidth={2} name="Net Income" />
                  <Line type="monotone" dataKey="totalAssets" stroke="#82ca9d" strokeWidth={2} name="Total Assets" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debt vs Equity</CardTitle>
            <CardDescription>Capital structure analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                termDebt: {
                  label: "Term Debt",
                  color: "#ff7300",
                },
                totalEquity: {
                  label: "Total Equity",
                  color: "#82ca9d",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="termDebt" fill="#ff7300" name="Term Debt" />
                  <Bar dataKey="totalEquity" fill="#82ca9d" name="Total Equity" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Key Financial Ratios</CardTitle>
          <CardDescription>Calculated ratios for financial health assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((yearData, index) => {
              const currentRatio =
                yearData.currentAssets && yearData.currentLiabilities
                  ? (yearData.currentAssets / yearData.currentLiabilities).toFixed(2)
                  : "N/A"

              const debtToEquity =
                yearData.termDebt && yearData.totalEquity
                  ? (yearData.termDebt / yearData.totalEquity).toFixed(2)
                  : "N/A"

              const returnOnAssets =
                yearData.netIncome && yearData.totalAssets
                  ? ((yearData.netIncome / yearData.totalAssets) * 100).toFixed(1)
                  : "N/A"

              return (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">{yearData.year}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current Ratio:</span>
                      <span
                        className={`font-medium ${
                          currentRatio !== "N/A" && Number.parseFloat(currentRatio) >= 1.5
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {currentRatio}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debt-to-Equity:</span>
                      <span
                        className={`font-medium ${
                          debtToEquity !== "N/A" && Number.parseFloat(debtToEquity) <= 0.5
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {debtToEquity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROA (%):</span>
                      <span
                        className={`font-medium ${
                          returnOnAssets !== "N/A" && Number.parseFloat(returnOnAssets) >= 5
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {returnOnAssets}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render based on type
  switch (type) {
    case "income":
      return renderIncomeCharts()
    case "balance":
      return renderBalanceCharts()
    default:
      return renderCombinedCharts()
  }
}
