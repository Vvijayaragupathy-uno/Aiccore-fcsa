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
  analysisType: "income_statement" | "balance_sheet" | "combined"
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  sessions: ChatSession[]
  currentSessionId: string | null
  createSession: (fileName: string, fileHash: string, analysisType: ChatSession["analysisType"]) => string
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void
  getSession: (sessionId: string) => ChatSession | undefined
  getSessionByFileHash: (fileHash: string, analysisType: ChatSession["analysisType"]) => ChatSession | undefined
  setCurrentSession: (sessionId: string) => void
  clearSessions: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const createSession = useCallback(
    (fileName: string, fileHash: string, analysisType: ChatSession["analysisType"]): string => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newSession: ChatSession = {
        id: sessionId,
        fileName,
        fileHash,
        analysisType,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setSessions((prev) => [...prev, newSession])
      setCurrentSessionId(sessionId)
      return sessionId
    },
    [],
  )

  const addMessage = useCallback((sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, fullMessage],
              updatedAt: new Date(),
            }
          : session,
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
    (fileHash: string, analysisType: ChatSession["analysisType"]): ChatSession | undefined => {
      return sessions.find((session) => session.fileHash === fileHash && session.analysisType === analysisType)
    },
    [sessions],
  )

  const setCurrentSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
  }, [])

  const clearSessions = useCallback(() => {
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
    clearSessions,
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
