import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getAI();

export async function extractNeedsFromText(text: string) {
  if (!ai) {
    console.error("Gemini API key is missing. Cannot perform extraction.");
    return [];
  }
  const prompt = `
    Analyze the following field report, survey, or interview snippet and extract community needs into a structured JSON format.
    
    ### CRITICAL CONSTRAINTS:
    1. **Strict Taxonomy**: Use concise, normalized category names for 'type'. Preferred categories: Clean Water, Food Supply, Medical Aid, Shelter, Power, Sanitation, Communication, Transportation.
    2. **Location Accuracy**: Use the most specific location mentioned. If NO location is mentioned, you MUST set 'location' to "Unknown (Not specified in report)". NEVER hallucinate or guess a location.
    3. **Urgency Scoring**:
       - Critical: Life-threatening, immediate danger (e.g., "no oxygen", "no water for 3 days").
       - High: Severe hardship, potential danger if not addressed within 24-48 hours.
       - Medium: Significant difficulty but not immediately life-threatening.
       - Low: Minor issues or general concerns.
    4. **Deduplication**: If multiple sentences describe the same single need (e.g., "No water. The pump is broken."), extract it as a SINGLE entry.
    5. **Temporal Nuance**: Only extract CURRENT needs. If a report says "We had no water this morning but it is fixed now", do NOT extract it as a water need.
    6. **Hallucination Guard**: Only extract what is explicitly stated or strongly implied. If a report says "People are struggling" without details, return an empty 'needs' array or mark as general struggling if absolutely necessary, but prefer specific needs.
    7. **Hidden Urgency**: Detect life-critical subtle mentions (e.g., "Clinic low on oxygen" = Critical).
    8. **Future vs Present**: Do NOT mark future risks ("we might run out next week") as High/Critical. Mark as Low or Medium depending on the certainty of the threat.
    9. **Multilingual**: Parse non-English text but return the JSON values in English.
    
    ### OUTPUT FORMAT:
    Return valid JSON ONLY.
    {
      "needs": [
        {
          "type": "Normalized Category",
          "urgency": "Low" | "Medium" | "High" | "Critical",
          "location": "Specific Location or 'Unknown (Not specified in report)'",
          "source_text": "The relevant snippet from the text",
          "estimated_impact": "Short description (e.g. 'Affects elderly residents', 'Approx 200 families')",
          "resource_match": "Concrete resource needed (e.g. 'Oxygen Cylinders', 'Water Purification Tablets')",
          "confidence": number (0.0 to 1.0)
        }
      ]
    }

    ### TEXT TO ANALYZE:
    "${text}"
  `;

  try {
    console.log("Extracting needs from text...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const responseText = response.text || '';
    console.log("Gemini RAW response:", responseText);
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    return data.needs || [];
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return [];
  }
}

export async function extractNeedsFromImage(base64Data: string, mimeType: string) {
  if (!ai) {
    console.error("Gemini API key is missing. Cannot perform extraction.");
    return [];
  }
  const prompt = `
    Extract community needs from this survey image or document.
    
    ### CRITICAL CONSTRAINTS:
    1. **Strict Taxonomy**: Use concise, normalized category names for 'type' (e.g., Clean Water, Food Supply, Medical Aid, Shelter).
    2. **Location Accuracy**: Use the most specific location mentioned. If NO location is mentioned, set 'location' to "Unknown (Not specified in document)".
    3. **Urgency Scoring**: 
       - Critical: Life-threatening/Immediate.
       - High: Severe hardship.
       - Medium: Significant difficulty.
       - Low: Minor issues.
    4. **Deduplication**: Collapse repetitive info into single entries.
    5. **Confidence**: Be conservative with handwritten text.
    
    ### OUTPUT FORMAT:
    Return valid JSON ONLY.
    {
      "needs": [
        {
          "type": "Normalized Category",
          "urgency": "Low" | "Medium" | "High" | "Critical",
          "location": "Specific Location or 'Unknown (Not specified in document)'",
          "source_text": "The relevant snippet/line from the text",
          "estimated_impact": "Short description of scale",
          "resource_match": "Concrete resource needed",
          "confidence": number (0.0 to 1.0)
        }
      ]
    }
  `;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  try {
    console.log("Extracting needs from image/PDF...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt, }, imagePart] },
    });

    const responseText = response.text || '';
    console.log("Gemini Image RAW response:", responseText);
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    return data.needs || [];
  } catch (error) {
    console.error("Gemini Image Extraction Error:", error);
    return [];
  }
}
