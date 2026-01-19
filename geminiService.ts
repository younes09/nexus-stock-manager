
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Invoice } from "./types";

export const getStockInsights = async (products: Product[], invoices: Invoice[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `You are a clinical dental inventory expert working in Algeria. Analyze the stock levels, expiry dates, and transactions for this Dental Practice. 
      Identify critical shortages for clinical procedures (Composite, Anesthetics, Impression Materials).
      Analyze shelf-life risk for items nearing expiry.
      All prices and costs are in Algerian Dinars (DA).
      Suggest restocking based on medical supply chain priorities and waste prevention.
      
      Inventory Data: ${JSON.stringify(products.map(p => ({ 
        name: p.name, 
        stock: p.stock, 
        min: p.minStock, 
        expiry: p.expiryDate || 'N/A',
        category: p.category 
      })))}
      Recent Transactions: ${JSON.stringify(invoices.slice(0, 10).map(i => ({ type: i.type, date: i.date, total: i.total })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            restockSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  product: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "Low, Medium, or High (Clinical Criticality)" }
                },
                required: ["product", "reason", "priority"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["restockSuggestions", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Insights Error:", error);
    return null;
  }
};
