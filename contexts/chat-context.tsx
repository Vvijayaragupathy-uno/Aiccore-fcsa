"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface ChatMessage {
  id: string
  type: "question" | "response" | "analysis" | "system"
  content: string | any // Allow for object content in analysis messages
  timestamp: Date
  metadata?: {
    analysisType?: string
    confidence?: number
    processingTime?: number
  }
}

export interface ChatSession {
  id: string
  name: string
  fileHash: string
  analysisType: "balance_sheet" | "income_statement" | "cash_flow" | "combined"
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
  metadata?: {
    fileName?: string
    fileSize?: number
    documentType?: string
    confidence?: number
  }
}

interface ChatContextType {
  sessions: ChatSession[]
  currentSessionId: string | null
  createSession: (
    name: string,
    fileHash: string,
    analysisType: ChatSession["analysisType"],
    metadata?: ChatSession["metadata"],
  ) => string
  getSession: (sessionId: string) => ChatSession | undefined
  getSessionByFileHash: (fileHash: string, analysisType: ChatSession["analysisType"]) => ChatSession | undefined
  setCurrentSession: (sessionId: string) => void
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
  getSessionsByType: (analysisType: ChatSession["analysisType"]) => ChatSession[]
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem("financial-analysis-sessions")
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setSessions(parsedSessions)
      }
    } catch (error) {
      console.error("Error loading sessions from localStorage:", error)
    }
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem("financial-analysis-sessions", JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving sessions to localStorage:", error)
    }
  }, [sessions])

  const createSession = (
    name: string,
    fileHash: string,
    analysisType: ChatSession["analysisType"],
    metadata?: ChatSession["metadata"],
  ): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const newSession: ChatSession = {
      id: sessionId,
      name,
      fileHash,
      analysisType,
      createdAt: now,
      updatedAt: now,
      messages: [],
      metadata,
    }

    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(sessionId)

    return sessionId
  }

  const getSession = (sessionId: string): ChatSession | undefined => {
    return sessions.find((session) => session.id === sessionId)
  }

  const getSessionByFileHash = (
    fileHash: string,
    analysisType: ChatSession["analysisType"],
  ): ChatSession | undefined => {
    return sessions.find((session) => session.fileHash === fileHash && session.analysisType === analysisType)
  }

  const setCurrentSession = (sessionId: string): void => {
    setCurrentSessionId(sessionId)
  }

  const addMessage = (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): void => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const newMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: now,
    }

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: [...session.messages, newMessage],
            updatedAt: now,
          }
        }
        return session
      }),
    )
  }

  const updateMessage = (sessionId: string, messageId: string, updates: Partial<ChatMessage>): void => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: session.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)),
            updatedAt: new Date(),
          }
        }
        return session
      }),
    )
  }

  const deleteSession = (sessionId: string): void => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
  }

  const clearAllSessions = (): void => {
    setSessions([])
    setCurrentSessionId(null)
  }

  const getSessionsByType = (analysisType: ChatSession["analysisType"]): ChatSession[] => {
    return sessions.filter((session) => session.analysisType === analysisType)
  }

  const contextValue: ChatContextType = {
    sessions,
    currentSessionId,
    createSession,
    getSession,
    getSessionByFileHash,
    setCurrentSession,
    addMessage,
    updateMessage,
    deleteSession,
    clearAllSessions,
    getSessionsByType,
  }

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
}
