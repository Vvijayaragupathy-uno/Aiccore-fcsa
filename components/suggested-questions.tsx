"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Loader2 } from "lucide-react"
import { SuggestedQuestion } from "@/lib/question-generator"

interface SuggestedQuestionsProps {
  questions: SuggestedQuestion[]
  isLoading: boolean
  onQuestionClick: (question: string) => void
  error?: string
}

const categoryColors = {
  'financial-ratios': 'bg-blue-100 text-blue-800',
  'trends': 'bg-green-100 text-green-800',
  'risk-assessment': 'bg-red-100 text-red-800',
  'recommendations': 'bg-purple-100 text-purple-800'
}

const categoryLabels = {
  'financial-ratios': 'Financial Ratios',
  'trends': 'Trends',
  'risk-assessment': 'Risk Assessment',
  'recommendations': 'Recommendations'
}

export function SuggestedQuestions({ 
  questions, 
  isLoading, 
  onQuestionClick, 
  error 
}: SuggestedQuestionsProps) {
  // Don't render if no questions and not loading
  if (!isLoading && questions.length === 0 && !error) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5" />
          <span>Suggested Questions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-gray-600">Generating contextual questions...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Lightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">Questions Unavailable</span>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                {error.includes("timeout") ? "The AI service is taking longer than expected." :
                 error.includes("Rate limit") ? "Too many requests. Please wait a moment." :
                 error.includes("unavailable") ? "The AI service is temporarily unavailable." :
                 "Unable to generate contextual questions right now."}
              </p>
              <p className="text-yellow-600 text-xs">
                You can still ask custom questions in the section below.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && questions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Click on any question below to explore deeper insights about your financial analysis:
            </p>
            
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${categoryColors[question.category]} flex-shrink-0 mt-1`}
                  >
                    {categoryLabels[question.category]}
                  </Badge>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-4 hover:bg-gray-50"
                  onClick={() => onQuestionClick(question.question)}
                >
                  <div className="text-sm leading-relaxed">
                    {question.question}
                  </div>
                </Button>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 These questions are generated based on your specific analysis results to help you gain deeper insights.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}