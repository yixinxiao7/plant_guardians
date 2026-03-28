const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ValidationError, ExternalServiceError, UnprocessableError } = require('../utils/errors');

router.use(authenticate);

/**
 * Model fallback chain for 429 rate-limit responses (T-048).
 * If a model returns 429, the next model in the chain is tried.
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

/**
 * Detect whether an error is a 429 rate-limit error.
 */
function isRateLimitError(err) {
  if (err && err.status === 429) return true;
  if (err && typeof err.message === 'string' && err.message.includes('429')) return true;
  return false;
}

/**
 * Build a prompt for Gemini based on the input.
 */
function buildPrompt(plantType, photoUrl) {
  let prompt = `You are a plant care expert. `;

  if (plantType && photoUrl) {
    prompt += `The user says the plant is "${plantType}" and has provided a photo at this URL: ${photoUrl}. `;
  } else if (plantType) {
    prompt += `The user has a "${plantType}" plant. `;
  } else if (photoUrl) {
    prompt += `The user has provided a photo of their plant at this URL: ${photoUrl}. Please identify the plant. `;
  }

  prompt += `
Please provide structured care recommendations in the following JSON format. Respond ONLY with valid JSON, no additional text:
{
  "identified_plant_type": "string or null (only if identifying from photo)",
  "confidence": "high | medium | low | null (only if identifying from photo)",
  "care_advice": {
    "watering": {
      "frequency_value": <integer>,
      "frequency_unit": "days | weeks | months",
      "notes": "string or null"
    },
    "fertilizing": {
      "frequency_value": <integer>,
      "frequency_unit": "days | weeks | months",
      "notes": "string or null"
    },
    "repotting": {
      "frequency_value": <integer>,
      "frequency_unit": "months",
      "notes": "string or null"
    },
    "light": "string or null",
    "humidity": "string or null",
    "additional_tips": "string or null"
  }
}`;

  return prompt;
}

/**
 * Parse the Gemini response text into our structured format.
 */
function parseGeminiResponse(text) {
  try {
    // Extract JSON from the response (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * Try generating content with the model fallback chain (T-048).
 * On 429, falls through to the next model. Non-429 errors throw immediately.
 * If all models return 429, throws ExternalServiceError.
 */
async function generateWithFallback(genAI, prompt) {
  for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
    const modelName = MODEL_FALLBACK_CHAIN[i];
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(prompt);
      return response.response.text();
    } catch (err) {
      if (isRateLimitError(err) && i < MODEL_FALLBACK_CHAIN.length - 1) {
        // 429 — try next model in the chain
        console.warn(`Gemini model ${modelName} returned 429, falling back to next model.`);
        continue;
      }
      // Non-429 error or last model in chain — rethrow
      throw err;
    }
  }
}

// POST /api/v1/ai/advice
router.post('/advice', async (req, res, next) => {
  try {
    const { plant_type, photo_url } = req.body;

    if (!plant_type && !photo_url) {
      throw new ValidationError('At least one of plant_type or photo_url must be provided.');
    }

    if (plant_type && typeof plant_type === 'string' && plant_type.length > 200) {
      throw new ValidationError('plant_type must be at most 200 characters.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      throw new ExternalServiceError(
        'AI service is not configured.',
        'AI_SERVICE_UNAVAILABLE'
      );
    }

    let result;
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = buildPrompt(plant_type, photo_url);
      const text = await generateWithFallback(genAI, prompt);
      result = parseGeminiResponse(text);
    } catch (err) {
      console.error('Gemini API error:', err.message);
      throw new ExternalServiceError(
        'AI service returned an error or timed out.',
        'AI_SERVICE_UNAVAILABLE'
      );
    }

    if (!result || !result.care_advice) {
      throw new UnprocessableError(
        'Could not identify the plant or generate care advice. Try again with a clearer photo or enter the plant type manually.',
        'PLANT_NOT_IDENTIFIABLE'
      );
    }

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// Exported for testing
module.exports.MODEL_FALLBACK_CHAIN = MODEL_FALLBACK_CHAIN;
module.exports.isRateLimitError = isRateLimitError;
module.exports.generateWithFallback = generateWithFallback;
