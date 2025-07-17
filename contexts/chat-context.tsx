"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface ChatMessage {
  id: string
  type: 'analysis' | 'question' | 'response'
  content: string
  timestamp: Date
  analysisType?: string
}

interface ChatSession {
  id: string
  fileName: string
  fileHash: string
  analysisType: string
  messages: ChatMessage[]
  createdAt: Date
  lastUpdated: Date
}

interface ChatContextType {
  sessions: ChatSession[]
  currentSessionId: string | null
  createSession: (fileName: string, fileHash: string, analysisType: string) => string
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  getSession: (sessionId: string) => ChatSession | undefined
  setCurrentSession: (sessionId: string | null) => void
  getSessionByFileHash: (fileHash: string, analysisType: string) => ChatSession | undefined
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('financial-analysis-chat-sessions')
      const savedCurrentSessionId = localStorage.getItem('financial-analysis-current-session')
      
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdated: new Date(session.lastUpdated),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setSessions(parsedSessions)
      }
      
      if (savedCurrentSessionId) {
        setCurrentSessionId(savedCurrentSessionId)
      }
    } catch (error) {
      console.error('Error loading chat sessions from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('financial-analysis-chat-sessions', JSON.stringify(sessions))
      } catch (error) {
        console.error('Error saving chat sessions to localStorage:', error)
      }
    }
  }, [sessions, isLoaded])

  // Save current session ID to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        if (currentSessionId) {
          localStorage.setItem('financial-analysis-current-session', currentSessionId)
        } else {
          localStorage.removeItem('financial-analysis-current-session')
        }
      } catch (error) {
        console.error('Error saving current session ID to localStorage:', error)
      }
    }
  }, [currentSessionId, isLoaded])

  const createSession = useCallback((fileName: string, fileHash: string, analysisType: string): string => {
    const sessionId = `${fileHash}-${analysisType}-${Date.now()}`
    const newSession: ChatSession = {
      id: sessionId,
      fileName,
      fileHash,
      analysisType,
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    }
    
    setSessions(prev => [...prev, newSession])
    setCurrentSessionId(sessionId)
    return sessionId
  }, [])

  const addMessage = useCallback((sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const newMessage: ChatMessage = {
          ...message,
          id: `${sessionId}-${Date.now()}-${Math.random()}`,
          timestamp: new Date()
        }
        return {
          ...session,
          messages: [...session.messages, newMessage],
          lastUpdated: new Date()
        }
      }
      return session
    }))
  }, [])

  const getSession = useCallback((sessionId: string): ChatSession | undefined => {
    return sessions.find(session => session.id === sessionId)
  }, [sessions])

  const getSessionByFileHash = useCallback((fileHash: string, analysisType: string): ChatSession | undefined => {
    return sessions.find(session => session.fileHash === fileHash && session.analysisType === analysisType)
  }, [sessions])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
  }, [currentSessionId])

  const clearAllSessions = useCallback(() => {
    setSessions([])
    setCurrentSessionId(null)
  }, [])

  const setCurrentSession = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId)
  }, [])

  const value: ChatContextType = {
    sessions,
    currentSessionId,
    createSession,
    addMessage,
    getSession,
    setCurrentSession,
    getSessionByFileHash,
    deleteSession,
    clearAllSessions
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}