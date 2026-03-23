const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ValidationError, ExternalServiceError, UnprocessableError } = require('../utils/errors');

router.use(authenticate);

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
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = buildPrompt(plant_type, photo_url);
      const response = await model.generateContent(prompt);
      const text = response.response.text();
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
