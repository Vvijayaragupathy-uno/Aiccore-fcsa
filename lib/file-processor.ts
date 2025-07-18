// File processing utilities for financial documents
import { createHash } from "crypto"

export interface ProcessedFileData {
  content: string
  hash: string
  metadata: {
    fileName: string
    fileSize: number
    fileType: string
    processedAt: Date
  }
}

export async function createFileFingerprint(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()
    const hashSum = createHash("sha256")
    hashSum.update(new Uint8Array(buffer))
    const hex = hashSum.digest("hex")

    // Create a shorter, more manageable hash
    return `${file.name.replace(/[^a-zA-Z0-9]/g, "_")}_${hex.substring(0, 16)}_${Date.now()}`
  } catch (error) {
    console.error("Error creating file fingerprint:", error)
    // Fallback to simple hash
    return `${file.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export function extractFileMetadata(file: File) {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || getFileTypeFromExtension(file.name),
    lastModified: new Date(file.lastModified),
    extension: getFileExtension(file.name),
  }
}

function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().substring(fileName.lastIndexOf("."))
}

function getFileTypeFromExtension(fileName: string): string {
  const extension = getFileExtension(fileName)
  const typeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
  }
  return typeMap[extension] || "application/octet-stream"
}

export function validateFileIntegrity(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const result = reader.result as ArrayBuffer
        // Basic integrity check - file should have content
        resolve(result.byteLength > 0)
      } catch (error) {
        console.error("File integrity check failed:", error)
        resolve(false)
      }
    }

    reader.onerror = () => {
      console.error("File reading failed during integrity check")
      resolve(false)
    }

    // Read first 1KB to check if file is readable
    reader.readAsArrayBuffer(file.slice(0, 1024))
  })
}

export async function processFileForAnalysis(file: File): Promise<ProcessedFileData> {
  const metadata = extractFileMetadata(file)
  const hash = await createFileFingerprint(file)

  // For now, we'll create a placeholder content
  // In a real implementation, this would use libraries like xlsx or pdf-parse
  const content = `File processed: ${file.name}
Size: ${file.size} bytes
Type: ${metadata.fileType}
Extension: ${metadata.extension}
Processed at: ${new Date().toISOString()}
Hash: ${hash}

This is a placeholder for actual file content extraction.
In a production environment, this would contain the actual
extracted text and data from the financial document.`

  return {
    content,
    hash,
    metadata: {
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      fileType: metadata.fileType,
      processedAt: new Date(),
    },
  }
}
