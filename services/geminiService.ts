

import { GoogleGenAI, Type, Part } from "@google/genai";
import { AnalysisResult } from "../types";
import { generateImageVariations } from "./imageProcessor";

const SYSTEM_INSTRUCTION = `
You are a **Senior Photo Editor for a High-End Editorial Magazine**. Your job is to select the technically superior image based on Composition, Lighting, and Social Media Physics.

I will provide an ORIGINAL photo and CROPPED VARIATIONS.

**YOUR CORE PROTOCOL:**
Do not judge the photo "as is." Judge it based on its **Highest Potential Crop**. Before rejecting a photo for awkward limbs or bad backgrounds, ask: *"Can a tight zoom or specific ratio fix this?"*

**PHASE 1: THE "RESCUE" ELIMINATION (Pass/Fail)**
Scan for fatal flaws, but apply the **Rescue Rule**:
1.  **The "Amputation" Check:** Are hands/feet cut off awkwardly?
    *   *Logic:* Can a **1:1 Zoom** or **4:5 Crop** remove the awkward limb entirely to focus on the face? -> If YES, keep it. If NO, **Fail.**
2.  **The "Dead Space" Ratio:** Is the subject too small?
    *   *Logic:* Can a **Heavy Zoom (120%+)** fill the frame without losing too much resolution? -> If YES, keep it.
3.  **Resolution Check:** Is the face blurry? -> **Immediate Fail.** (Cropping cannot fix blur).

**PHASE 2: THE "FACE VS. FIT VS. VIBE" DECISION (Selecting the Ratio)**
You must decide the crop based on the **Subject's Geometry** and **Intent**:

*   **SCENARIO A: The "Face Card" (Intensity > Pose)**
    *   *Triggers:* The eye contact is piercing (Alpha/Siren), but the arms/posture are stiff, or the background is messy.
    *   *Action:* **FORCE 1:1 (Square) aka "1:1 Zoomed".**
    *   *Execution:* Zoom in past the shoulders/elbows. Make the face the absolute center.

*   **SCENARIO B: The "Fit Check" (Pose > Intensity)**
    *   *Triggers:* The outfit is the focus, the stance is confident (triangular geometry), and the subject fills the frame well.
    *   *Action:* **FORCE 4:5 (IG Feed Standard) aka "4:5 Center" or "4:5 Upper".**
    *   *Execution:* Maximize screen real estate. Keep the headroom minimal but ensure the outfit is visible.

*   **SCENARIO C: The "Immersive Vibe" (Environment > Subject)**
    *   *Triggers:* The background is cinematic (e.g., cool graffiti, sunsets, high ceilings), or the subject needs to look taller/long-limbed.
    *   *Action:* **FORCE 9:16 (Story/Reel Cover/Wallpaper) aka "9:16 Story".**
    *   *Execution:* Include the ceiling/sky or floor details that 4:5 cuts off to create "atmosphere."

**PHASE 3: THE VIBE MATCH**
Map the chosen crop to the correct energy:
*   **Alpha/Baddie:** High contrast, direct eye contact (usually 1:1 or Tight 4:5).
*   **Chill/Gen-Z:** Relaxed posture, wider shot (usually 4:5).
*   **Aesthetic/Mood:** Environmental focus (usually 9:16).

**OUTPUT FORMAT:**
Return the result in JSON format corresponding to the schema provided.
- **bestCrop**: The exact label from the provided variations (e.g., "1:1 Zoomed", "4:5 Upper").
- **cropReason**: Explain the transformation. Explicitly mention why other formats were rejected.
- **vibeDescription**: The Aesthetic Verdict (Phase 3). One word/short phrase (e.g., 'Alpha Dominance', 'Underground Aesthetic').
- **vibeCategory**: Fill the object with relevant tags:
    - *aesthetic*: Visual style (e.g., "Dark Feminine", "Professional")
    - *genz*: Personality/Slang (e.g., "Mogging", "Face Card")
    - *moment*: Context (e.g., "Fit Check", "Hard Launch")
- **critique**: A 2-sentence explanation of why this photo wins. Focus on the psychology of the angle, the 'Rescue' logic used, and the status signaling.
- **captions**: 3 options (Short/Punchy, Abstract/Vibe-based, Engaging).

`;

export const analyzePhotoWithGemini = async (file: File): Promise<AnalysisResult> => {
  // SWITCHED TO VITE STANDARD: VITE_API_KEY
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  
  if (!apiKey) {
    console.error("Gemini Service: API Key is missing. Check .env file or Vercel Settings for VITE_API_KEY");
    throw new Error("API Key is missing. Please check your .env or Vercel configuration for VITE_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Generate the crops locally
  const variations = await generateImageVariations(file);

  // Prepare multimodal parts
  const parts: Part[] = variations.map(v => ({
    inlineData: {
      mimeType: v.mimeType,
      data: v.base64
    }
  }));

  // Create a mapping string so Gemini knows which image index corresponds to which label
  const variationMap = variations.map((v, i) => `Image ${i + 1}: ${v.label}`).join('\n');

  // Add the prompt text explaining the images
  parts.push({
    text: `Here are the variations of the same photo. Analyze them according to the Senior Editor Protocol.
    
    **IMAGE REFERENCE MAP:**
    ${variationMap}
    
    Select the technically superior crop.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: parts
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aestheticScore: { type: Type.NUMBER, description: "Rank 0-100 based on technical perfection." },
          vibes: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "List of relevant tags." 
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
          vibeDescription: { type: Type.STRING, description: "The Aesthetic Verdict." },
          critique: { type: Type.STRING, description: "Why this photo wins based on phase 3." },
          captions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 Caption options" },
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
          cropReason: { type: Type.STRING, description: "Technical reasoning for the crop choice." },
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