import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getLocalServiceInfo = async (
  query: string,
  location?: { lat: number; lng: number }
) => {
  try {
    const prompt = location 
      ? `Find local home services (plumbers, electricians, etc.) near latitude ${location.lat}, longitude ${location.lng} matching this query: "${query}". Provide a helpful, concise summary of what's available in this area.`
      : `Find local home services (plumbers, electricians, etc.) matching this query: "${query}". Provide a helpful, concise summary of what's available.`;
    
    const config: any = {
      tools: [{ googleMaps: {} }]
    };

    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config
    });

    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error('Error getting local info:', error);
    throw error;
  }
};

export const detectFakeCustomer = async (
  bookingDetails: {
    userName: string;
    userEmail: string;
    userPhone?: string;
    address?: string;
    category: string;
    date: string;
    time: string;
    distance: number;
  }
): Promise<{ isFake: boolean; reason: string }> => {
  try {
    const prompt = `
      Analyze the following booking request for a home service (e.g., electrician, plumber) and determine if it looks like a fake, spam, or suspicious booking.
      
      Booking Details:
      - Name: ${bookingDetails.userName}
      - Email: ${bookingDetails.userEmail}
      - Phone: ${bookingDetails.userPhone || 'Not provided'}
      - Address: ${bookingDetails.address || 'Not provided'}
      - Service: ${bookingDetails.category}
      - Date: ${bookingDetails.date}
      - Time: ${bookingDetails.time}
      - Distance from technician: ${bookingDetails.distance.toFixed(1)} km
      
      Consider factors like:
      - Missing or highly generic names (e.g., "Test", "asdf")
      - Suspicious email addresses (e.g., temporary emails, gibberish)
      - Missing address or phone number for a physical home service
      - Unusually large distances (e.g., > 100km for a local service)
      
      Return a JSON object with 'isFake' (boolean) and 'reason' (string explaining why).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFake: {
              type: Type.BOOLEAN,
              description: "True if the booking appears to be fake or spam, false otherwise.",
            },
            reason: {
              type: Type.STRING,
              description: "A brief explanation of why the booking was classified as fake or genuine.",
            },
          },
          required: ["isFake", "reason"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      isFake: result.isFake || false,
      reason: result.reason || "Unable to analyze.",
    };
  } catch (error) {
    console.error("Error detecting fake customer:", error);
    // Default to false if ML fails, to not block legitimate users
    return { isFake: false, reason: "ML analysis failed." };
  }
};
