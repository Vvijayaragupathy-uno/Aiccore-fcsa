"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export interface ChatMessage {
  id: string
  type: "question" | "response" | "analysis"
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  fileName: string
  fileHash: string
  analysisType: "balance_sheet" | "income_statement" | "combined"
  createdAt: Date
  messages: ChatMessage[]
}

interface ChatContextType {
  sessions: ChatSession[]
  currentSessionId: string | null
  createSession: (
    fileName: string,
    fileHash: string,
    analysisType: "balance_sheet" | "income_statement" | "combined",
  ) => string
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void
  getSession: (sessionId: string) => ChatSession | undefined
  getSessionByFileHash: (fileHash: string, analysisType: string) => ChatSession | undefined
  setCurrentSession: (sessionId: string | null) => void
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const createSession = useCallback(
    (fileName: string, fileHash: string, analysisType: "balance_sheet" | "income_statement" | "combined"): string => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newSession: ChatSession = {
        id: sessionId,
        fileName,
        fileHash,
        analysisType,
        createdAt: new Date(),
        messages: [],
      }

      setSessions((prev) => [...prev, newSession])
      setCurrentSessionId(sessionId)

      return sessionId
    },
    [],
  )

  const addMessage = useCallback((sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, messages: [...session.messages, newMessage] } : session,
      ),
    )
  }, [])

  const getSession = useCallback(
    (sessionId: string): ChatSession | undefined => {
      return sessions.find((session) => session.id === sessionId)
    },
    [sessions],
  )

  const getSessionByFileHash = useCallback(
    (fileHash: string, analysisType: string): ChatSession | undefined => {
      return sessions.find((session) => session.fileHash === fileHash && session.analysisType === analysisType)
    },
    [sessions],
  )

  const setCurrentSession = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId)
  }, [])

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
      }
    },
    [currentSessionId],
  )

  const clearAllSessions = useCallback(() => {
    setSessions([])
    setCurrentSessionId(null)
  }, [])

  const value: ChatContextType = {
    sessions,
    currentSessionId,
    createSession,
    addMessage,
    getSession,
    getSessionByFileHash,
    setCurrentSession,
    deleteSession,
    clearAllSessions,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}
