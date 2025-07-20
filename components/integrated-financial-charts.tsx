"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';

interface IntegratedFinancialChartsProps {
  data: Array<{
    year: number;
    grossFarmIncome: number;
    netFarmIncome: number;
    netIncome: number;
    currentAssets: number;
    currentLiabilities: number;
    totalAssets: number;
    totalEquity: number;
    workingCapital: number;
    currentRatio: number;
    debtServiceCoverage: number;
    equityRatio: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    assetTurnover?: number;
    operatingProfitMargin?: number;
  }>;
}

export function IntegratedFinancialCharts({ data }: IntegratedFinancialChartsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No data available for charts</p>
      </div>
    );
  }

  // Format data for better display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => `${value}%`;
  const formatRatio = (value: number) => value.toFixed(2);

  return (
    <div className="space-y-6">
      {/* Combined Profitability Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
            Integrated Profitability Analysis
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          These metrics combine income statement and balance sheet data to show how efficiently the operation generates returns.
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'Return on Assets' || name === 'Return on Equity') {
                  return [`${value}%`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="right" dataKey="returnOnAssets" fill="#10b981" name="Return on Assets (%)" />
            <Bar yAxisId="right" dataKey="returnOnEquity" fill="#3b82f6" name="Return on Equity (%)" />
            <Line yAxisId="left" type="monotone" dataKey="assetTurnover" stroke="#f59e0b" strokeWidth={3} name="Asset Turnover" />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded">
            <p className="text-xs text-green-600 font-medium">Latest ROA</p>
            <p className="text-lg font-bold text-green-800">{data[data.length - 1]?.returnOnAssets || 0}%</p>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-xs text-blue-600 font-medium">Latest ROE</p>
            <p className="text-lg font-bold text-blue-800">{data[data.length - 1]?.returnOnEquity || 0}%</p>
          </div>
          <div className="bg-amber-50 p-3 rounded">
            <p className="text-xs text-amber-600 font-medium">Asset Turnover</p>
            <p className="text-lg font-bold text-amber-800">{data[data.length - 1]?.assetTurnover || 0}</p>
          </div>
        </div>
      </div>

      {/* Financial Health Integration */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
            Financial Health Integration
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Shows how income generation supports debt obligations and capital structure over time.
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'Equity Ratio') {
                  return [`${value}%`, name];
                }
                if (name === 'Debt Service Coverage') {
                  return [value, name];
                }
                return [formatCurrency(value), name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="workingCapital" fill="#8b5cf6" name="Working Capital" />
            <Line yAxisId="right" type="monotone" dataKey="debtServiceCoverage" stroke="#ef4444" strokeWidth={3} name="Debt Service Coverage" />
            <Line yAxisId="right" type="monotone" dataKey="equityRatio" stroke="#10b981" strokeWidth={2} name="Equity Ratio (%)" />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-xs text-purple-600 font-medium">Working Capital</p>
            <p className="text-lg font-bold text-purple-800">{formatCurrency(data[data.length - 1]?.workingCapital || 0)}</p>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <p className="text-xs text-red-600 font-medium">DSCR</p>
            <p className="text-lg font-bold text-red-800">{data[data.length - 1]?.debtServiceCoverage || 0}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-xs text-green-600 font-medium">Equity Ratio</p>
            <p className="text-lg font-bold text-green-800">{data[data.length - 1]?.equityRatio || 0}%</p>
          </div>
        </div>
      </div>

      {/* Income vs Balance Sheet Relationship */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
            Income vs Balance Sheet Relationship
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Demonstrates how income performance relates to balance sheet strength and asset base.
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name.includes('Income') || name.includes('Assets') || name.includes('Equity')) {
                  return [formatCurrency(value), name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="netIncome" fill="#10b981" name="Net Income" />
            <Bar yAxisId="left" dataKey="totalEquity" fill="#3b82f6" name="Total Equity" />
            <Line yAxisId="right" type="monotone" dataKey="currentRatio" stroke="#f59e0b" strokeWidth={3} name="Current Ratio" />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 bg-gray-50 p-4 rounded">
          <h4 className="font-medium text-gray-800 mb-2">Key Relationships</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">
                <strong>Income Growth:</strong> Net income has {
                  (data[data.length - 1]?.netIncome || 0) > (data[0]?.netIncome || 0) ? 'increased' : 'decreased'
                } by {
                  Math.abs(((data[data.length - 1]?.netIncome || 0) - (data[0]?.netIncome || 0)) / (data[0]?.netIncome || 1) * 100).toFixed(1)
                }% over the period.
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <strong>Equity Growth:</strong> Total equity has {
                  (data[data.length - 1]?.totalEquity || 0) > (data[0]?.totalEquity || 0) ? 'increased' : 'decreased'
                } by {
                  Math.abs(((data[data.length - 1]?.totalEquity || 0) - (data[0]?.totalEquity || 0)) / (data[0]?.totalEquity || 1) * 100).toFixed(1)
                }% over the period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Integrated Trend Analysis</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Positive Trends</h4>
            <ul className="space-y-2">
              {(data[data.length - 1]?.returnOnAssets || 0) > (data[0]?.returnOnAssets || 0) && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Return on Assets improving</span>
                </li>
              )}
              {(data[data.length - 1]?.debtServiceCoverage || 0) > (data[0]?.debtServiceCoverage || 0) && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Debt service coverage strengthening</span>
                </li>
              )}
              {(data[data.length - 1]?.equityRatio || 0) > (data[0]?.equityRatio || 0) && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Equity position strengthening</span>
                </li>
              )}
              {(data[data.length - 1]?.workingCapital || 0) > (data[0]?.workingCapital || 0) && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Working capital increasing</span>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Areas for Attention</h4>
            <ul className="space-y-2">
              {(data[data.length - 1]?.returnOnAssets || 0) <= (data[0]?.returnOnAssets || 0) && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Return on Assets needs improvement</span>
                </li>
              )}
              {(data[data.length - 1]?.debtServiceCoverage || 0) < 1.25 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Debt service coverage below optimal level</span>
                </li>
              )}
              {(data[data.length - 1]?.currentRatio || 0) < 1.5 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Current ratio could be stronger</span>
                </li>
              )}
              {(data[data.length - 1]?.assetTurnover || 0) < 0.6 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Asset utilization efficiency could improve</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
