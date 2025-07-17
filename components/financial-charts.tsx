"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react"

interface FinancialData {
  year: number
  grossFarmIncome: number
  netFarmIncome: number
  netNonfarmIncome: number
  netIncome: number
  currentAssets: number
  currentLiabilities: number
  totalAssets: number
  totalEquity: number
  termDebt: number
}

interface FinancialChartsProps {
  data: FinancialData[]
  type: "income" | "balance" | "combined"
}

export function FinancialCharts({ data, type }: FinancialChartsProps) {
  // Helper function to check if a value is valid (not NaN, null, undefined, or 0)
  const isValidValue = (value: number | null | undefined): boolean => {
    return value !== null && value !== undefined && !isNaN(value) && value !== 0
  }

  // Helper function to check if an array has valid data
  const hasValidData = (values: (number | null | undefined)[]): boolean => {
    return values.some(value => isValidValue(value))
  }

  // Helper function to filter out invalid values
  const getValidValues = (values: number[]): number[] => {
    return values.filter(value => isValidValue(value))
  }

  const calculateTrend = (values: number[]) => {
    const validValues = getValidValues(values)
    if (validValues.length < 2) return "stable"
    const recent = validValues[validValues.length - 1]
    const previous = validValues[validValues.length - 2]
    const change = ((recent - previous) / previous) * 100

    if (change > 5) return "up"
    if (change < -5) return "down"
    return "stable"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const BarChart = ({
    values,
    labels,
    title,
    color = "bg-blue-500",
  }: {
    values: number[]
    labels: string[]
    title: string
    color?: string
  }) => {
    // Hide chart if no valid data
    if (!hasValidData(values)) {
      return null
    }

    const validValues = getValidValues(values)
    const maxValue = Math.max(...validValues)

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-2">
          {values.map((value, index) => {
            // Skip invalid values
            if (!isValidValue(value)) {
              return null
            }
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-16 text-xs text-gray-600">{labels[index]}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className={`${color} h-6 rounded-full flex items-center justify-end pr-2`}
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{formatCurrency(value)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const LineChart = ({
    values,
    labels,
    title,
  }: {
    values: number[]
    labels: string[]
    title: string
  }) => {
    // Hide chart if no valid data
    if (!hasValidData(values)) {
      return null
    }

    const validValues = getValidValues(values)
    const maxValue = Math.max(...validValues)
    const minValue = Math.min(...validValues)
    const range = maxValue - minValue || 1 // Prevent division by zero

    // Filter data to only include valid points
    const validDataPoints = values
      .map((value, index) => ({ value, index, label: labels[index] }))
      .filter(point => isValidValue(point.value))

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="relative h-32 bg-gray-50 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 400 100">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e5e7eb" strokeWidth="1" />
            ))}

            {/* Data line */}
            {validDataPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={validDataPoints
                  .map((point, index) => {
                    const x = (index / (validDataPoints.length - 1)) * 400
                    const y = 100 - ((point.value - minValue) / range) * 100
                    return `${x},${y}`
                  })
                  .join(" ")}
              />
            )}

            {/* Data points */}
            {validDataPoints.map((point, index) => {
              const x = (index / Math.max(validDataPoints.length - 1, 1)) * 400
              const y = 100 - ((point.value - minValue) / range) * 100
              return <circle key={index} cx={x} cy={y} r="4" fill="#3b82f6" />
            })}
          </svg>

          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {validDataPoints.map((point, index) => (
              <span key={index}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const RatioCard = ({
    title,
    value,
    benchmark,
    status,
  }: {
    title: string
    value: number
    benchmark?: number
    status: "good" | "warning" | "critical"
  }) => {
    // Hide card if value is invalid
    if (!isValidValue(value)) {
      return null
    }

    const statusConfig = {
      good: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
      warning: { color: "text-yellow-600", bg: "bg-yellow-50", icon: AlertTriangle },
      critical: { color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
    }

    const config = statusConfig[status]
    const StatusIcon = config.icon

    return (
      <div className={`p-4 rounded-lg ${config.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{title}</h4>
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className={`text-2xl font-bold ${config.color}`}>
          {title.includes("Ratio") ? `${value.toFixed(2)}:1` : formatCurrency(value)}
        </div>
        {benchmark && (
          <div className="text-xs text-gray-600 mt-1">
            Benchmark: {title.includes("Ratio") ? `${benchmark.toFixed(2)}:1` : formatCurrency(benchmark)}
          </div>
        )}
      </div>
    )
  }

  if (type === "income") {
    const netIncomeValues = data.map((d) => d.netIncome)
    const grossIncomeValues = data.map((d) => d.grossFarmIncome)
    const years = data.map((d) => d.year.toString())

    const netIncomeTrend = calculateTrend(netIncomeValues)
    const grossIncomeTrend = calculateTrend(grossIncomeValues)

    // Calculate debt coverage ratio (simplified)
    const currentYear = data[data.length - 1]
    const debtCoverageRatio = isValidValue(currentYear.netIncome) ? (currentYear.netIncome + 50000) / 285000 : NaN

    // Check if we have any valid data to show
    const hasGrossIncomeData = hasValidData(grossIncomeValues)
    const hasNetIncomeData = hasValidData(netIncomeValues)
    const hasValidDebtRatio = isValidValue(debtCoverageRatio)
    const hasValidCurrentNetIncome = isValidValue(currentYear.netIncome)
    const hasValidCurrentGrossIncome = isValidValue(currentYear.grossFarmIncome)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(hasGrossIncomeData || hasNetIncomeData) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income Trends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LineChart values={grossIncomeValues} labels={years} title="Gross Farm Income Trend" />
              <LineChart values={netIncomeValues} labels={years} title="Net Income Trend" />
              {!hasGrossIncomeData && !hasNetIncomeData && (
                <div className="text-center text-gray-500 py-8">
                  No valid income trend data available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(hasValidDebtRatio || hasValidCurrentNetIncome || hasValidCurrentGrossIncome) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RatioCard
                title="Debt Coverage Ratio"
                value={debtCoverageRatio}
                benchmark={1.25}
                status={debtCoverageRatio >= 1.25 ? "good" : debtCoverageRatio >= 1.0 ? "warning" : "critical"}
              />

              <div className="grid grid-cols-2 gap-4">
                {hasValidCurrentNetIncome && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">Net Income</span>
                      <TrendIcon trend={netIncomeTrend} />
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(currentYear.netIncome)}</div>
                  </div>
                )}

                {hasValidCurrentGrossIncome && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">Gross Income</span>
                      <TrendIcon trend={grossIncomeTrend} />
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(currentYear.grossFarmIncome)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Income Composition Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              values={data.map((d) => d.grossFarmIncome)}
              labels={years}
              title="Gross Farm Income by Year"
              color="bg-green-500"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (type === "balance") {
    const currentYear = data[data.length - 1]
    const workingCapital = data.map((d) => d.currentAssets - d.currentLiabilities)
    const currentRatio = currentYear.currentAssets / currentYear.currentLiabilities
    const equityRatio = (currentYear.totalEquity / currentYear.totalAssets) * 100
    const years = data.map((d) => d.year.toString())

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liquidity Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RatioCard
              title="Current Ratio"
              value={currentRatio}
              benchmark={1.5}
              status={currentRatio >= 1.5 ? "good" : currentRatio >= 1.0 ? "warning" : "critical"}
            />

            <RatioCard
              title="Working Capital"
              value={workingCapital[workingCapital.length - 1]}
              status={workingCapital[workingCapital.length - 1] > 0 ? "good" : "critical"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capital Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RatioCard
              title="Equity Ratio"
              value={equityRatio}
              benchmark={60}
              status={equityRatio >= 60 ? "good" : equityRatio >= 40 ? "warning" : "critical"}
            />

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Total Assets</h4>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(currentYear.totalAssets)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Working Capital Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart values={workingCapital} labels={years} title="Working Capital Over Time" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Asset Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <BarChart
                values={data.map((d) => d.currentAssets)}
                labels={years}
                title="Current Assets"
                color="bg-blue-500"
              />
              <BarChart
                values={data.map((d) => d.totalAssets - d.currentAssets)}
                labels={years}
                title="Non-Current Assets"
                color="bg-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Combined analysis
  const currentYear = data[data.length - 1]
  const workingCapital = currentYear.currentAssets - currentYear.currentLiabilities
  const currentRatio = currentYear.currentAssets / currentYear.currentLiabilities
  const equityRatio = (currentYear.totalEquity / currentYear.totalAssets) * 100
  const debtCoverageRatio = (currentYear.netIncome + 50000) / 285000

  return (
    <div className="space-y-6">
      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RatioCard
          title="Current Ratio"
          value={currentRatio}
          benchmark={1.5}
          status={currentRatio >= 1.5 ? "good" : currentRatio >= 1.0 ? "warning" : "critical"}
        />
        <RatioCard
          title="Debt Coverage"
          value={debtCoverageRatio}
          benchmark={1.25}
          status={debtCoverageRatio >= 1.25 ? "good" : debtCoverageRatio >= 1.0 ? "warning" : "critical"}
        />
        <RatioCard
          title="Equity Ratio"
          value={equityRatio}
          benchmark={60}
          status={equityRatio >= 60 ? "good" : equityRatio >= 40 ? "warning" : "critical"}
        />
        <RatioCard title="Working Capital" value={workingCapital} status={workingCapital > 0 ? "good" : "critical"} />
      </div>

      {/* Comprehensive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profitability Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              values={data.map((d) => d.netIncome)}
              labels={data.map((d) => d.year.toString())}
              title="Net Income Trend"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liquidity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              values={data.map((d) => d.currentAssets - d.currentLiabilities)}
              labels={data.map((d) => d.year.toString())}
              title="Working Capital Trend"
            />
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Assessment Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">High Risk</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {currentRatio < 1.0 && <li>• Current ratio below 1.0</li>}
                {workingCapital < 0 && <li>• Negative working capital</li>}
                {debtCoverageRatio < 1.0 && <li>• Debt coverage below 1.0</li>}
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Moderate Risk</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {currentRatio >= 1.0 && currentRatio < 1.5 && <li>• Current ratio below benchmark</li>}
                {debtCoverageRatio >= 1.0 && debtCoverageRatio < 1.25 && <li>• Debt coverage below benchmark</li>}
                {equityRatio < 60 && equityRatio >= 40 && <li>• Equity ratio moderate</li>}
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {currentYear.totalAssets > 5000000 && <li>• Strong asset base</li>}
                {equityRatio >= 60 && <li>• Strong equity position</li>}
                {currentYear.netNonfarmIncome > 50000 && <li>• Diversified income</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
