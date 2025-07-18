"use client"

import { useChatContext } from "@/contexts/chat-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMarkdown } from "@/lib/markdown-utils"

interface ChatHistoryProps {
  sessionId: string
}

export function ChatHistory({ sessionId }: ChatHistoryProps) {
  const { getSessionMessages } = useChatContext()
  const messages = getSessionMessages(sessionId)

  if (!messages || messages.length === 0) {
    return <div className="text-center text-gray-500 py-4">No chat history available for this session.</div>
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {messages.map((message, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge
              variant={message.type === "analysis" ? "default" : message.type === "question" ? "secondary" : "outline"}
            >
              {message.type === "analysis" ? "Analysis" : message.type === "question" ? "Question" : "Response"}
            </Badge>
            <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleString()}</span>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div
                className="text-sm text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(
                    typeof message.content === "string" ? message.content : JSON.stringify(message.content, null, 2),
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

export interface ChatMessage {
  type: "analysis" | "question" | "response"
  content: string | any
  timestamp: number
}

export type ChatMessages = ChatMessage[]
