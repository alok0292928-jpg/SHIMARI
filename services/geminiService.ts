
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the environment variable exclusively.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const validateMatchAction = async (
  playerName: string,
  balance: number,
  kills: number,
  lastLoot: number
) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Validate the following game session snapshot for Shikaar.ai (Real-Money Worm Game). 
      Player: ${playerName}
      Current Balance: $${balance.toFixed(2)}
      Total Kills: ${kills}
      Last Loot Amount: $${lastLoot.toFixed(2)}
      
      Determine if these stats are mathematically plausible for a 2-minute session.
      Return "VALID" if everything looks normal, or "FLAGGED: [Reason]" if it looks like cheating (e.g., impossible growth).`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    // Accessing .text as a property as per guidelines
    return response.text || "VALID";
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return "OFFLINE_VALID";
  }
};

export const getAITaunt = async (killer: string, victim: string, loot: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, edgy, cyberpunk-style "kill notification" for a game feed.
      Killer: ${killer} killed ${victim} and looted $${loot.toFixed(2)}.
      Keep it under 10 words. Example: "Loot secured. ${killer} drained ${victim}'s wallet."`,
    });
    // Accessing .text as a property (not a function)
    return response.text?.trim() || `${killer} looted ${victim}`;
  } catch {
    return `${killer} looted $${loot.toFixed(2)} from ${victim}`;
  }
};
