"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react"
import { 
  isValidValue, 
  hasValidData, 
  hasNonZeroData,
  getValidValues, 
  calculateDebtCoverageRatio,
  validateDebtCoverageInputs 
} from "@/lib/validation-utils"

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

export function FinancialCharts({ data, type }: FinancialChartsProps) {

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
    // Hide chart if no valid data at all
    if (!hasValidData(values)) {
      return (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
            No data available for {title.toLowerCase()}
          </div>
        </div>
      )
    }

    const validValues = getValidValues(values)
    const maxValue = Math.max(...validValues, 1) // Ensure at least 1 to avoid division by zero
    const hasNonZero = hasNonZeroData(values)

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        {!hasNonZero && (
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            All values are zero - may indicate missing or incomplete data
          </div>
        )}
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
                    className={`${color} h-6 rounded-full flex items-center justify-end pr-2 ${value === 0 ? 'opacity-50' : ''}`}
                    style={{ width: `${maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 2}%` }}
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
      return (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
            No data available for {title.toLowerCase()}
          </div>
        </div>
      )
    }

    const validValues = getValidValues(values)
    const maxValue = Math.max(...validValues)
    const minValue = Math.min(...validValues)
    const range = maxValue - minValue || 1 // Prevent division by zero
    const hasNonZero = hasNonZeroData(values)

    // Filter data to only include valid points
    const validDataPoints = values
      .map((value, index) => ({ value, index, label: labels[index] }))
      .filter(point => isValidValue(point.value))

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        {!hasNonZero && (
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            All values are zero - trend analysis not meaningful
          </div>
        )}
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
                stroke={hasNonZero ? "#3b82f6" : "#9ca3af"}
                strokeWidth="2"
                strokeDasharray={hasNonZero ? "none" : "5,5"}
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
              return <circle key={index} cx={x} cy={y} r="4" fill={hasNonZero ? "#3b82f6" : "#9ca3af"} />
            })}

            {/* Zero line indicator when all values are zero */}
            {!hasNonZero && (
              <line x1="0" y1="50" x2="400" y2="50" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            )}
          </svg>

          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {validDataPoints.map((point, index) => (
              <span key={index}>{point.label}</span>
            ))}
          </div>
        </div>
        {hasNonZero && validDataPoints.length >= 2 && (
          <div className="text-xs text-gray-600">
            Trend: {validDataPoints[validDataPoints.length - 1].value > validDataPoints[0].value ? '↗️ Increasing' : 
                   validDataPoints[validDataPoints.length - 1].value < validDataPoints[0].value ? '↘️ Decreasing' : '→ Stable'}
          </div>
        )}
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

    // Handle edge cases for display
    if (!isFinite(value)) {
      return (
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-600">{title}</h4>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-sm text-gray-500">Data unavailable</div>
        </div>
      )
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
    const netIncomeValues = data.map((d) => d.netIncome).filter((v): v is number => v !== undefined)
    const grossIncomeValues = data.map((d) => d.grossFarmIncome).filter((v): v is number => v !== undefined)
    const years = data.map((d) => d.year.toString())

    const netIncomeTrend = calculateTrend(netIncomeValues)
    const grossIncomeTrend = calculateTrend(grossIncomeValues)

    // Use proper debt coverage calculation with validation
    const currentYear = data[data.length - 1]
    const debtCoverageRatio = calculateDebtCoverageRatio(currentYear)
    const isDebtCoverageValid = validateDebtCoverageInputs(currentYear).isValid

    // Check if we have any valid data to show
    const hasGrossIncomeData = hasValidData(grossIncomeValues)
    const hasNetIncomeData = hasValidData(netIncomeValues)
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

        {(isDebtCoverageValid || hasValidCurrentNetIncome || hasValidCurrentGrossIncome) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDebtCoverageValid && debtCoverageRatio && (
                <RatioCard
                  title="Debt Coverage Ratio"
                  value={debtCoverageRatio}
                  benchmark={1.25}
                  status={debtCoverageRatio >= 1.25 ? "good" : debtCoverageRatio >= 1.0 ? "warning" : "critical"}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                {hasValidCurrentNetIncome && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">Net Income</span>
                      <TrendIcon trend={netIncomeTrend} />
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(currentYear.netIncome!)}</div>
                  </div>
                )}

                {hasValidCurrentGrossIncome && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">Gross Income</span>
                      <TrendIcon trend={grossIncomeTrend} />
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(currentYear.grossFarmIncome!)}</div>
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
              values={data.map((d) => d.grossFarmIncome).filter((v): v is number => v !== undefined)}
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
    const workingCapital = data.map((d) => (d.currentAssets || 0) - (d.currentLiabilities || 0)).filter(v => !isNaN(v))
    const currentRatio = (currentYear.currentAssets && currentYear.currentLiabilities) 
      ? currentYear.currentAssets / currentYear.currentLiabilities 
      : 0
    const equityRatio = (currentYear.totalEquity && currentYear.totalAssets) 
      ? (currentYear.totalEquity / currentYear.totalAssets) * 100 
      : 0
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
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(currentYear.totalAssets || 0)}</div>
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
                values={data.map((d) => d.currentAssets).filter((v): v is number => v !== undefined)}
                labels={years}
                title="Current Assets"
                color="bg-blue-500"
              />
              <BarChart
                values={data.map((d) => (d.totalAssets || 0) - (d.currentAssets || 0)).filter(v => !isNaN(v))}
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
  const workingCapital = (currentYear.currentAssets || 0) - (currentYear.currentLiabilities || 0)
  const currentRatio = (currentYear.currentAssets && currentYear.currentLiabilities) 
    ? currentYear.currentAssets / currentYear.currentLiabilities 
    : 0
  const equityRatio = (currentYear.totalEquity && currentYear.totalAssets) 
    ? (currentYear.totalEquity / currentYear.totalAssets) * 100 
    : 0
  
  // Use proper debt coverage calculation with validation
  const debtCoverageRatio = calculateDebtCoverageRatio(currentYear)
  const isDebtCoverageValid = validateDebtCoverageInputs(currentYear).isValid

  // Filter out metrics that should be hidden
  const validMetrics = [
    isValidValue(currentRatio) && {
      component: <RatioCard
        title="Current Ratio"
        value={currentRatio}
        benchmark={1.5}
        status={currentRatio >= 1.5 ? "good" : currentRatio >= 1.0 ? "warning" : "critical"}
      />,
      key: "current-ratio"
    },
    isDebtCoverageValid && debtCoverageRatio && {
      component: <RatioCard
        title="Debt Coverage"
        value={debtCoverageRatio}
        benchmark={1.25}
        status={debtCoverageRatio >= 1.25 ? "good" : debtCoverageRatio >= 1.0 ? "warning" : "critical"}
      />,
      key: "debt-coverage"
    },
    isValidValue(equityRatio) && {
      component: <RatioCard
        title="Equity Ratio"
        value={equityRatio}
        benchmark={60}
        status={equityRatio >= 60 ? "good" : equityRatio >= 40 ? "warning" : "critical"}
      />,
      key: "equity-ratio"
    },
    isValidValue(workingCapital) && {
      component: <RatioCard 
        title="Working Capital" 
        value={workingCapital} 
        status={workingCapital > 0 ? "good" : "critical"} 
      />,
      key: "working-capital"
    }
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Key Metrics Dashboard - Only show if we have valid metrics */}
      {validMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {validMetrics.map((metric: any) => (
            <div key={metric.key}>{metric.component}</div>
          ))}
        </div>
      )}

      {/* Comprehensive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profitability Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              values={data.map((d) => d.netIncome).filter((v): v is number => v !== undefined)}
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
              values={data.map((d) => (d.currentAssets || 0) - (d.currentLiabilities || 0)).filter(v => !isNaN(v))}
              labels={data.map((d) => d.year.toString())}
              title="Working Capital Trend"
            />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
