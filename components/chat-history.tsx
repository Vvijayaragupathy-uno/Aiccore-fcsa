"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, MessageSquare, FileText, Clock } from "lucide-react"
import { useChatContext, type ChatMessage } from "@/contexts/chat-context"
import { formatDistanceToNow } from "date-fns"

interface ChatHistoryProps {
  analysisType: "balance_sheet" | "income_statement" | "cash_flow" | "combined"
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, currentSessionId, setCurrentSession, deleteSession } = useChatContext()

  const filteredSessions = sessions.filter((session) => session.analysisType === analysisType)

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onSelectSession?.(sessionId)
  }

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      balance_sheet: "Balance Sheet",
      income_statement: "Income Statement",
      cash_flow: "Cash Flow",
      combined: "Combined Analysis",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      balance_sheet: "bg-blue-100 text-blue-800",
      income_statement: "bg-green-100 text-green-800",
      cash_flow: "bg-purple-100 text-purple-800",
      combined: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (filteredSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Chat History</span>
          </CardTitle>
          <CardDescription>
            Previous {getAnalysisTypeLabel(analysisType).toLowerCase()} analysis sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No previous sessions found</p>
            <p className="text-sm">Upload and analyze a document to start your first session</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Chat History</span>
        </CardTitle>
        <CardDescription>
          {filteredSessions.length} {getAnalysisTypeLabel(analysisType).toLowerCase()} session
          {filteredSessions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{session.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`text-xs ${getAnalysisTypeColor(session.analysisType)}`}>
                        {getAnalysisTypeLabel(session.analysisType)}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                  </p>
                  {session.messages.length > 0 && (
                    <p className="truncate mt-1">
                      Last: {session.messages[session.messages.length - 1].content.substring(0, 60)}...
                    </p>
                  )}
                </div>
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

  const getMessageIcon = (type: ChatMessage["type"]) => {
    switch (type) {
      case "analysis":
        return "🤖"
      case "question":
        return "❓"
      case "response":
        return "💬"
      case "system":
        return "⚙️"
      default:
        return "📝"
    }
  }

  const getMessageTypeLabel = (type: ChatMessage["type"]) => {
    const labels = {
      analysis: "AI Analysis",
      question: "Your Question",
      response: "AI Response",
      system: "System Message",
    }
    return labels[type] || type
  }

  if (session.messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No messages in this session</p>
        <p className="text-sm">Start by asking a question about the analysis</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-4">
        {session.messages.map((message) => (
          <div key={message.id} className="border-l-4 border-blue-200 pl-4 py-2">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getMessageIcon(message.type)}</span>
              <span className="text-sm font-medium text-gray-700">{getMessageTypeLabel(message.type)}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              {message.type === "analysis" ? (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Analysis Complete</p>
                  <p>AI analysis has been generated and is displayed above.</p>
                </div>
              ) : message.type === "response" ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: message.content }} />
              ) : (
                <p className="leading-relaxed">{message.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
