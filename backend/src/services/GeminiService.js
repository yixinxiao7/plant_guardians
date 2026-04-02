/**
 * GeminiService — Handles all communication with the Google Gemini API.
 * Created in Sprint 17 (T-077, T-078).
 *
 * Features:
 * - Text-based care advice (plant name → structured care recommendations)
 * - Image-based plant identification (photo → identification + care recommendations)
 * - 429 model fallback chain (Sprint 9 / T-048 behavior preserved)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ExternalServiceError } = require('../utils/errors');

/**
 * Model fallback chain for 429 rate-limit responses (T-048).
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

/**
 * Shared JSON schema instruction appended to all prompts.
 */
const RESPONSE_SCHEMA_INSTRUCTION = `
Respond ONLY with valid JSON in this exact format — no additional text, no markdown code fences:
{
  "identified_plant": "string — the matched/normalized plant name",
  "confidence": "high | medium | low",
  "care": {
    "watering_interval_days": <integer — days between watering>,
    "fertilizing_interval_days": <integer or null — null if not applicable>,
    "repotting_interval_days": <integer or null — null if not applicable>,
    "light_requirement": "string — e.g. Bright indirect light",
    "humidity_preference": "string — e.g. Moderate",
    "care_tips": "string — 1-3 sentences of care advice"
  }
}`;

/**
 * Detect whether an error is a 429 rate-limit error.
 */
function isRateLimitError(err) {
  if (err && err.status === 429) return true;
  if (err && typeof err.message === 'string' && err.message.includes('429')) return true;
  return false;
}

/**
 * Parse the Gemini response text into our structured format.
 * Validates all required fields are present.
 * Returns the parsed object or null if invalid.
 */
function parseGeminiResponse(text) {
  try {
    // Extract JSON from the response (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required top-level fields
    if (
      typeof parsed.identified_plant !== 'string' ||
      !parsed.identified_plant ||
      !['high', 'medium', 'low'].includes(parsed.confidence) ||
      !parsed.care ||
      typeof parsed.care.watering_interval_days !== 'number'
    ) {
      return null;
    }

    // Normalize the response — ensure optional fields are null if missing
    return {
      identified_plant: parsed.identified_plant,
      confidence: parsed.confidence,
      care: {
        watering_interval_days: parsed.care.watering_interval_days,
        fertilizing_interval_days:
          typeof parsed.care.fertilizing_interval_days === 'number'
            ? parsed.care.fertilizing_interval_days
            : null,
        repotting_interval_days:
          typeof parsed.care.repotting_interval_days === 'number'
            ? parsed.care.repotting_interval_days
            : null,
        light_requirement: parsed.care.light_requirement || 'Unknown',
        humidity_preference: parsed.care.humidity_preference || 'Unknown',
        care_tips: parsed.care.care_tips || '',
      },
    };
  } catch {
    return null;
  }
}

class GeminiService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Try generating content with the model fallback chain (T-048).
   * On 429, falls through to the next model. Non-429 errors throw immediately.
   * If all models return 429, throws ExternalServiceError.
   */
  async _generateWithFallback(parts) {
    for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
      const modelName = MODEL_FALLBACK_CHAIN[i];
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(parts);
        return response.response.text();
      } catch (err) {
        if (isRateLimitError(err) && i < MODEL_FALLBACK_CHAIN.length - 1) {
          console.warn(`Gemini model ${modelName} returned 429, falling back to next model.`);
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Text-based care advice: plant name → structured care recommendations.
   * @param {string} plantType — The plant's common or scientific name
   * @returns {object} Parsed and validated care advice object
   * @throws {ExternalServiceError} If Gemini fails or returns unparseable response
   */
  async getAdvice(plantType) {
    const prompt = `You are a plant care expert. The user has a "${plantType}" plant. Provide structured care recommendations for this plant.${RESPONSE_SCHEMA_INSTRUCTION}`;

    let text;
    try {
      text = await this._generateWithFallback(prompt);
    } catch (err) {
      console.error('Gemini API error (text advice):', err.message);
      throw new ExternalServiceError(
        'AI advice is temporarily unavailable. Please try again.',
        'EXTERNAL_SERVICE_ERROR'
      );
    }

    const result = parseGeminiResponse(text);
    if (!result) {
      throw new ExternalServiceError(
        'AI advice is temporarily unavailable. Please try again.',
        'EXTERNAL_SERVICE_ERROR'
      );
    }

    return result;
  }

  /**
   * Image-based plant identification: photo → identification + care recommendations.
   * @param {Buffer} imageBuffer — The image file contents
   * @param {string} mimeType — The image MIME type (e.g. 'image/jpeg')
   * @returns {object} Parsed and validated identification + care advice object
   * @throws {ExternalServiceError} If Gemini fails or returns unparseable response
   */
  async identifyFromImage(imageBuffer, mimeType) {
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType,
      },
    };

    const textPart = `You are a plant identification and care expert. Identify the plant in this image and provide structured care recommendations.${RESPONSE_SCHEMA_INSTRUCTION}`;

    let text;
    try {
      text = await this._generateWithFallback([textPart, imagePart]);
    } catch (err) {
      console.error('Gemini API error (image identification):', err.message);
      throw new ExternalServiceError(
        'AI advice is temporarily unavailable. Please try again.',
        'EXTERNAL_SERVICE_ERROR'
      );
    }

    const result = parseGeminiResponse(text);
    if (!result) {
      throw new ExternalServiceError(
        'AI advice is temporarily unavailable. Please try again.',
        'EXTERNAL_SERVICE_ERROR'
      );
    }

    return result;
  }
}

module.exports = GeminiService;

// Exported for testing
module.exports.MODEL_FALLBACK_CHAIN = MODEL_FALLBACK_CHAIN;
module.exports.isRateLimitError = isRateLimitError;
module.exports.parseGeminiResponse = parseGeminiResponse;
