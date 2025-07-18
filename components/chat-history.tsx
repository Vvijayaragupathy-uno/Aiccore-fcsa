"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, MessageSquare } from "lucide-react"
import { useChatContext } from "@/contexts/chat-context"

interface ChatHistoryProps {
  analysisType: "income" | "balance_sheet" | "combined"
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, currentSessionId, setCurrentSession } = useChatContext()

  const filteredSessions = sessions.filter((session) => session.analysisType === analysisType)

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onSelectSession?.(sessionId)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Income Statement"
      case "balance_sheet":
        return "Balance Sheet"
      case "combined":
        return "Combined Analysis"
      default:
        return type
    }
  }

  if (filteredSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Session History</span>
          </CardTitle>
          <CardDescription>
            Your {getAnalysisTypeLabel(analysisType).toLowerCase()} analysis sessions will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No sessions yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Session History</span>
        </CardTitle>
        <CardDescription>Previous {getAnalysisTypeLabel(analysisType).toLowerCase()} analysis sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handleSelectSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{session.fileName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(session.createdAt)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getAnalysisTypeLabel(session.analysisType)}
                    </Badge>
                  </div>
                  {session.messages.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                      <MessageSquare className="h-3 w-3" />
                      <span>{session.messages.length} messages</span>
                    </div>
                  )}
                </div>
                {currentSessionId === session.id && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
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

  if (!session || session.messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No messages in this conversation yet</p>
      </div>
    )
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "question":
        return "❓"
      case "response":
        return "🤖"
      case "analysis":
        return "📊"
      default:
        return "💬"
    }
  }

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "question":
        return "Question"
      case "response":
        return "AI Response"
      case "analysis":
        return "Analysis"
      default:
        return "Message"
    }
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {session.messages.map((message) => (
        <div key={message.id} className="border-l-4 border-blue-200 pl-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getMessageIcon(message.type)}</span>
              <span className="text-sm font-medium text-gray-700">{getMessageTypeLabel(message.type)}</span>
            </div>
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {message.type === "analysis" ? (
              <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {typeof message.content === "string"
                  ? message.content.substring(0, 200) + (message.content.length > 200 ? "..." : "")
                  : JSON.stringify(message.content, null, 2).substring(0, 200) + "..."}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: message.content }} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
