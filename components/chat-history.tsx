"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, FileText, Calendar, Trash2, Clock, BarChart3, Building, TrendingUp, Users } from "lucide-react"
import { useChatContext, type ChatMessage } from "@/contexts/chat-context"
import { formatDistanceToNow } from "date-fns"

interface ChatHistoryProps {
  analysisType: "balance_sheet" | "income_statement" | "cash_flow" | "combined"
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { getSessionsByType, deleteSession, setCurrentSession, currentSessionId } = useChatContext()

  const sessions = getSessionsByType(analysisType)

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case "balance_sheet":
        return <Building className="h-4 w-4" />
      case "income_statement":
        return <TrendingUp className="h-4 w-4" />
      case "cash_flow":
        return <BarChart3 className="h-4 w-4" />
      case "combined":
        return <Users className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getAnalysisLabel = (type: string) => {
    switch (type) {
      case "balance_sheet":
        return "Balance Sheet"
      case "income_statement":
        return "Income Statement"
      case "cash_flow":
        return "Cash Flow"
      case "combined":
        return "Combined Analysis"
      default:
        return "Financial Analysis"
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onSelectSession?.(sessionId)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      deleteSession(sessionId)
    }
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getAnalysisIcon(analysisType)}
            <span>{getAnalysisLabel(analysisType)} History</span>
          </CardTitle>
          <CardDescription>Your analysis sessions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analysis sessions yet</p>
            <p className="text-sm">Upload a document to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getAnalysisIcon(analysisType)}
            <span>{getAnalysisLabel(analysisType)} History</span>
          </div>
          <Badge variant="secondary">{sessions.length}</Badge>
        </CardTitle>
        <CardDescription>Recent analysis sessions and conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div key={session.id}>
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    currentSessionId === session.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <h4 className="text-sm font-medium truncate">{session.name}</h4>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDistanceToNow(session.createdAt, { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{session.messages.length} messages</span>
                        </div>
                      </div>

                      {session.metadata && (
                        <div className="flex items-center space-x-2 mb-2">
                          {session.metadata.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {session.metadata.confidence.toFixed(0)}% confidence
                            </Badge>
                          )}
                          {session.metadata.fileSize && (
                            <Badge variant="outline" className="text-xs">
                              {(session.metadata.fileSize / 1024 / 1024).toFixed(1)}MB
                            </Badge>
                          )}
                        </div>
                      )}

                      {session.messages.length > 0 && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          Last: {typeof session.messages[session.messages.length - 1].content === 'string' 
                            ? session.messages[session.messages.length - 1].content.substring(0, 100) + '...'
                            : 'Analysis data'}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {index < sessions.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface ChatMessagesProps {
  sessionId: string
}

export function ChatMessages({ sessionId }: ChatMessagesProps) {
  const { getSession } = useChatContext()
  const session = getSession(sessionId)

  if (!session) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Session not found</p>
      </div>
    )
  }

  if (session.messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No messages yet</p>
        <p className="text-sm">Start by asking a question about the analysis</p>
      </div>
    )
  }

  const getMessageIcon = (type: ChatMessage["type"]) => {
    switch (type) {
      case "question":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "response":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "analysis":
        return <BarChart3 className="h-4 w-4 text-purple-500" />
      case "system":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getMessageLabel = (type: ChatMessage["type"]) => {
    switch (type) {
      case "question":
        return "Question"
      case "response":
        return "AI Response"
      case "analysis":
        return "Analysis"
      case "system":
        return "System"
      default:
        return "Message"
    }
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-4">
        {session.messages.map((message) => (
          <div key={message.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getMessageIcon(message.type)}
                <span className="text-sm font-medium">{getMessageLabel(message.type)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>

            <div className="text-sm text-gray-700">
              {message.type === "analysis" ? (
                <div className="bg-gray-50 p-3 rounded border-l-4 border-purple-500">
                  <p className="font-medium mb-2">Analysis Complete</p>
                  {typeof message.content === 'string' ? (
                    <p className="text-xs text-gray-600">
                      {message.content.length > 200 ? `${message.content.substring(0, 200)}...` : message.content}
                    </p>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Analysis data summary:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(message.content?.executiveSummary || message.content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : message.type === "response" ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ 
                  __html: typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2) 
                }} />
              ) : (
                <p>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2)}</p>
              )}
            </div>

            {message.metadata && (
              <div className="mt-2 flex items-center space-x-2">
                {message.metadata.confidence && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.confidence.toFixed(0)}% confidence
                  </Badge>
                )}
                {message.metadata.processingTime && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.processingTime}ms
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
