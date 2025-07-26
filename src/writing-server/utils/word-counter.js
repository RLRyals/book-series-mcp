export function countWords(text) {
    if (!text) return 0;
    
    // Remove special characters and extra whitespace
    const cleanText = text.replace(/[\n\r]/g, ' ')   // Convert newlines to spaces
                         .replace(/[^\w\s'']/g, ' ')  // Convert punctuation to spaces, preserve apostrophes
                         .replace(/\s+/g, ' ')        // Collapse multiple spaces
                         .trim();
    
    // Split and count
    const words = cleanText.split(' ').filter(word => word.length > 0);
    return words.length;
}
