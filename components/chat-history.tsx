"use client"
import { useChatContext } from "@/contexts/chat-context"

interface ChatHistoryProps {
  analysisType?: "income_statement" | "balance_sheet" | "combined"
  onSelectSession?: (sessionId: string) => void
}

interface ChatMessagesProps {
  sessionId: string
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, setCurrentSession, currentSession } = useChatContext()
  
  const filteredSessions = analysisType 
    ? sessions.filter(session => session.analysisType === analysisType)
    : sessions

  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b\
