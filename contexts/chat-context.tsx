"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface ChatMessage {
  id: string
  type: "analysis" | "question" | "response"
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  fileName: string
  fileHash: string
  analysisType: "income_statement" | "balance_sheet" | "combined"
  createdAt: Date
  messages: ChatMessage[]
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

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem("chat-sessions")
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions)
        // Convert date strings back to Date objects
        const sessionsWithDates = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setSessions(sessionsWithDates)
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error)
    }
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem("chat-sessions", JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving chat sessions:", error)
    }
  }, [sessions])

  const createSession = (fileName: string, fileHash: string, analysisType: ChatSession["analysisType"]): string => {
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
  }

  const addMessage = (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, messages: [...session.messages, fullMessage] } : session,
      ),
    )
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

  const setCurrentSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  const clearSessions = () => {
    setSessions([])
    setCurrentSessionId(null)
    localStorage.removeItem("chat-sessions")
  }

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        createSession,
        addMessage,
        getSession,
        getSessionByFileHash,
        setCurrentSession,
        clearSessions,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}
