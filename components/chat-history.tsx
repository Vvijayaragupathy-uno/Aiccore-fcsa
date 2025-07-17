"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, FileText, Clock, Trash2 } from 'lucide-react'
import { useChatContext } from '@/contexts/chat-context'
import { formatMarkdown } from '@/lib/markdown-utils'

interface ChatHistoryProps {
  analysisType: string
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, currentSessionId, setCurrentSession, deleteSession } = useChatContext()

  // Filter sessions by analysis type
  const filteredSessions = sessions.filter(session => session.analysisType === analysisType)
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onSelectSession?.(sessionId)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteSession(sessionId)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'income_statement': return 'Income Statement'
      case 'balance_sheet': return 'Balance Sheet'
      case 'combined': return 'Combined Analysis'
      default: return type
    }
  }

  if (filteredSessions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No chat history yet</p>
            <p className="text-sm">Upload a document to start a conversation</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat History
          <Badge variant="secondary">{filteredSessions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  currentSessionId === session.id ? 'bg-muted border-primary' : 'bg-background'
                }`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {session.fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getAnalysisTypeLabel(session.analysisType)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(session.lastUpdated)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
      <div className="text-center text-muted-foreground py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Session not found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[500px] w-full">
      <div className="space-y-4 p-4">
        {session.messages.map((message, index) => (
          <div key={message.id} className="space-y-2">
            {index > 0 && <Separator />}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={message.type === 'analysis' ? 'default' : 
                          message.type === 'question' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {message.type === 'analysis' ? 'Analysis' : 
                   message.type === 'question' ? 'Question' : 'Response'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(message.timestamp)}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                {message.type === 'analysis' ? (
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}