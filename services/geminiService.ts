
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, AIAnalysisResult, PromotionAnalysis, CustomerROIStats } from "../types";

export const generateROIAnalysis = async (
  data: AppState, 
  calculatedStats?: { promotions: PromotionAnalysis[], customerStats: CustomerROIStats[] }
): Promise<AIAnalysisResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare context from calculated stats if available, otherwise raw data (fallback)
    let contextPrompt = "";
    
    if (calculatedStats && calculatedStats.customerStats.length > 0) {
       const topCustomers = JSON.stringify(calculatedStats.customerStats.slice(0, 10));
       const topPromos = JSON.stringify(calculatedStats.promotions.sort((a,b) => b.roiPercent - a.roiPercent).slice(0, 5));
       const bottomPromos = JSON.stringify(calculatedStats.promotions.sort((a,b) => a.roiPercent - b.roiPercent).slice(0, 5));

       contextPrompt = `
         I have performed a deterministic ROI calculation linking Promotion Data to Nielsen Sales Data.
         
         AGGREGATED CUSTOMER PERFORMANCE:
         ${topCustomers}

         TOP 5 BEST PERFORMING PROMOTIONS (High ROI):
         ${topPromos}

         BOTTOM 5 LOWEST PERFORMING PROMOTIONS (Low ROI):
         ${bottomPromos}
         
         METRICS DEFINITION:
         - roiPercent: ((Incremental Revenue - Final Spend) / Final Spend) * 100
         - incrementalRevenue: Nielsen Incremental Units * Unit Price
         - finalSpend: Actuals from FI Document (if available) or Planned Spend
       `;
    } else {
      // Fallback to raw data summary if calculation failed or empty
      contextPrompt = `
        Raw Data Summary:
        Nielsen Rows: ${data.nielsenData?.rows.length || 0}
        Promotion Rows: ${data.promotionData?.rows.length || 0}
        FI Rows: ${data.fiData?.rows.length || 0}
        (Calculation yielded no mapped results. Please advise on data quality.)
      `;
    }

    const prompt = `
      You are a senior financial analyst.
      
      ${contextPrompt}
      
      ANALYSIS TASK:
      1. Analyze the ROI performance across customers. Who is driving the most efficient growth?
      2. Identify patterns in the high vs low performing promotions.
      3. Provide strategic recommendations for future trade spend allocation.
      
      Generate a JSON response with:
      - roiScore (0-100 overall health score based on the data)
      - summary (Executive summary paragraph)
      - recommendations (List of strings)
      - riskAssessment (Short text)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roiScore: { type: Type.NUMBER, description: "Calculated ROI score from 0 to 100" },
            summary: { type: Type.STRING, description: "Executive summary of the analysis" },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of actionable recommendations" 
            },
            riskAssessment: { type: Type.STRING, description: "Assessment of potential financial risks" }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    return JSON.parse(resultText) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      roiScore: 50,
      summary: "Analysis failed. Please check if data is uploaded and mapped correctly (TerritoryID -> Nielsen Customer).",
      recommendations: ["Verify API Key", "Ensure Territory Mapping is complete", "Check Date formats in Excel"],
      riskAssessment: "Unable to calculate risk due to missing or unlinked data."
    };
  }
};
