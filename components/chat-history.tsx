"use client"

import { useChatContext } from "@/contexts/chat-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatHistoryProps {
  analysisType?: "income_statement" | "balance_sheet" | "combined"
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, currentSessionId, setCurrentSession } = useChatContext()

  const filteredSessions = analysisType ? sessions.filter((session) => session.analysisType === analysisType) : sessions

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onSelectSession?.(sessionId)
  }

  if (filteredSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Analysis History</span>
          </CardTitle>
          <CardDescription>Your previous analyses will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No previous analyses found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Analysis History</span>
        </CardTitle>
        <CardDescription>Click on a session to view previous analysis and conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
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
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm truncate flex-1 mr-2">{session.fileName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {session.analysisType.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{session.messages.length} messages</span>
                    </span>
                  </div>
                  <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
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
      <div className="text-center text-gray-500 py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Session not found</p>
      </div>
    )
  }

  if (session.messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No messages in this session</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-4">
        {session.messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.type === "question"
                ? "bg-blue-50 border-l-4 border-blue-500"
                : message.type === "response"
                  ? "bg-green-50 border-l-4 border-green-500"
                  : "bg-gray-50 border-l-4 border-gray-500"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                {message.type === "question" ? "Question" : message.type === "response" ? "AI Response" : "Analysis"}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
