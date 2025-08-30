// File: emojiPrevention.ts
// Description: Utility functions to prevent emoji input in text fields

/**
 * Removes emoji characters from a string
 * @param text - The input text to clean
 * @returns Clean text without emojis
 */
export const removeEmojis = (text: string): string => {
  if (!text) return text;
  
  // Simplified regex to match emoji characters
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]/gu;
  
  return text.replace(emojiRegex, '');
};

/**
 * Checks if a string contains emoji characters
 * @param text - The text to check
 * @returns True if emojis are found, false otherwise
 */
export const containsEmojis = (text: string): boolean => {
  if (!text) return false;
  
  // Simplified regex to match emoji characters
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]/gu;
  
  return emojiRegex.test(text);
};

/**
 * Handler for TextInput onChangeText that prevents emoji input
 * @param text - The input text
 * @param setValue - Function to set the cleaned value
 * @param showWarning - Optional function to show warning to user
 */
export const handleTextInputChange = (
  text: string, 
  setValue: (value: string) => void, 
  showWarning?: () => void
) => {
  if (containsEmojis(text)) {
    // Remove emojis from the text
    const cleanedText = removeEmojis(text);
    setValue(cleanedText);
    
    // Show warning if provided
    if (showWarning) {
      showWarning();
    }
  } else {
    setValue(text);
  }
};
