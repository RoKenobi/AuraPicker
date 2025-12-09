import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";
import { generateImageVariations } from "./imageProcessor";

const SYSTEM_INSTRUCTION = `
You are a High-End Social Media Curator and Personal Brand Strategist.
Your goal is to find the ONE photo in a batch that radiates the most "Main Character Energy", status, and authentic beauty.

I will provide an ORIGINAL photo and several CROPPED VARIATIONS.

Your Task:
1. **Analyze with a Critical Eye**: Look for confidence, lighting, and composition. Ignore blurry or awkward shots.
2. **Assign Premium Vibes**: Categorize the photo into these 3 specific buckets using ASPIRATIONAL tags:

   - **"Aesthetic" (Visual Style)**:
     *   DO USE: Cinematic, Old Money, Dark Academia, Minimalist, Golden Hour, Editorial, High-Flash, Grainy, Dreamy.
     *   DO NOT USE: Nice, Good Lighting, Bright.

   - **"Gen-Z" (Personality/Slang)**:
     *   DO USE: Main Character, Unbothered, Aura, That Girl/Guy, Chaos, Lowkey, Nonchalant, Locked In, Face Card.
     *   DO NOT USE: Fun, Cool, Trendy.

   - **"The Moment" (Context)**:
     *   DO USE: Core Memory, Plot Twist, Hard Launch, POV, Off-Duty, PFP Material, Dump Worthy.
     *   DO NOT USE: Walking, Standing, Eating.

3. **Select the Masterpiece**: Pick the crop that makes the subject look the most attractive and dominant.
4. **Critique**: Be hyping but specific. Tell them why this photo is the "Winner".

Return the result in JSON.
`;

export const analyzePhotoWithGemini = async (file: File): Promise<AnalysisResult> => {
  // Vite exposes VITE_* vars via import.meta.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key missing. Check Vercel VITE_GEMINI_API_KEY env var.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const variations = await generateImageVariations(file);

  const parts = variations.map(v => ({
    inlineData: {
      mimeType: v.mimeType,
      data: v.base64
    }
  }));

  parts.push({
    // @ts-ignore
    text: `Analyze these 5 versions. 
    Assign 1 premium tag for 'Aesthetic', 1 premium tag for 'Gen-Z', and 1 premium tag for 'The Moment'.
    Select the best crop.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: parts as any 
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aestheticScore: { type: Type.NUMBER, description: "Rank 0-100 based on 'Postability'." },
          vibes: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "Flattened list of all tags found." 
          },
          vibeCategory: {
             type: Type.OBJECT,
             properties: {
                aesthetic: { type: Type.STRING, description: "Visual style tag" },
                genz: { type: Type.STRING, description: "Personality slang tag" },
                moment: { type: Type.STRING, description: "Context tag" }
             },
             required: ["aesthetic", "genz", "moment"]
          },
          bestFor: { type: Type.STRING, description: "Best context (e.g. 'Dump', 'PFP', 'Story')" },
          vibeDescription: { type: Type.STRING, description: "A punchy 3-5 word headline about the energy." },
          critique: { type: Type.STRING, description: "Why this photo wins. Focus on confidence and composition." },
          bestCrop: { 
            type: Type.STRING, 
            enum: ["Original", "4:5 Center", "4:5 Upper", "1:1 Zoomed", "9:16 Story"], 
            description: "The label of the best version." 
          },
          cropAlignment: {
            type: Type.STRING,
            enum: ["center", "top", "bottom"],
            description: "How the crop should be aligned"
          },
          cropReason: { type: Type.STRING, description: "Why this framing works." },
          cropSuggestion: { type: Type.STRING, description: "Quick editing tip." },
          bestFitFormat: { type: Type.STRING, enum: ["1:1", "4:5", "9:16"] },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["aestheticScore", "vibes", "vibeCategory", "bestFor", "vibeDescription", "critique", "bestCrop", "cropAlignment", "cropReason", "cropSuggestion", "bestFitFormat", "hashtags"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response text from Gemini");
  }

  return JSON.parse(response.text) as AnalysisResult;
};
