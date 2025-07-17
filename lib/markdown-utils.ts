/**
 * Completely removes markdown formatting and creates clean, beautiful text display
 */
export const formatMarkdown = (text: string | any): string => {
  // Handle null, undefined, or empty values
  if (text === null || text === undefined || text === '') return '';
  
  // Handle non-string inputs by converting to string
  let textString: string;
  try {
    if (typeof text === 'string') {
      textString = text;
    } else if (typeof text === 'object') {
      textString = JSON.stringify(text, null, 2);
    } else {
      textString = String(text);
    }
  } catch (error) {
    console.warn('Error converting text to string:', error);
    return '';
  }
  
  // Additional safety check
  if (!textString || typeof textString !== 'string') {
    return '';
  }

  let formatted = textString
    // Remove all markdown headers and convert to clean section titles
    .replace(/^#{1,6}\s*(.*)$/gm, '\n\n$1\n' + '─'.repeat(50) + '\n')
    // Remove all bold markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove all italic markdown
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Clean up lists - convert to clean bullet points
    .replace(/^(\s*)[-*+]\s+/gm, '$1• ')
    // Remove horizontal rules
    .replace(/\n-{3,}\n/g, '\n\n')
    // Remove code blocks
    .replace(/```[\s\S]*?\n([\s\S]*?)\n```/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Format sections with proper spacing and structure
  const lines = formatted.split('\n');
  const formattedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      formattedLines.push('');
      continue;
    }
    
    // Check if this looks like a section header (all caps or numbered)
    if (line.match(/^[A-Z\s\d\.\-:]+$/) && line.length < 80) {
      formattedLines.push('');
      formattedLines.push(line);
      formattedLines.push('─'.repeat(Math.min(line.length, 50)));
      formattedLines.push('');
    } else {
      formattedLines.push(line);
    }
  }
  
  return formattedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * Extracts and formats key metrics from analysis text
 */
export const extractAndFormatMetrics = (text: string): string[] => {
  if (!text) return [];
  
  // Look for common financial metrics patterns
  const metricRegex = /([A-Z][^.:!?]+(?:ratio|growth|margin|debt|equity|assets|liabilities|income|expense|profit|return)[^.:!?]*)(?=\s*[\n.])/gi;
  const metrics = text.match(metricRegex) || [];
  
  return metrics
    .map(metric => metric.trim())
    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    .slice(0, 5); // Limit to top 5 metrics
};
