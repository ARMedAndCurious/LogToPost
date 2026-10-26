import groq from '../config/groq.js'
import { visionPrompt, analyzePrompt, generatePrompt, critiquePrompt } from './prompts.js'

const MODEL = 'openai/gpt-oss-20b'
const PLATFORMS = ['instagram', 'linkedin', 'twitter']

// Read at call time (not import time) so dotenv has already loaded.
// Check console.groq.com/docs/vision for the current vision model ID.
const getVisionModel = () =>
  process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b'

// ---------- Helpers ----------

// Every text LLM call goes through this: send prompt, get a JSON object back.
const callLLM = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 4096,
    reasoning_effort: 'low'
  })

  const choice = response.choices[0]
  const raw = choice.message.content

  if (!raw || raw.trim() === '') {
    console.error('Empty response. finish_reason:', choice.finish_reason, 'usage:', response.usage)
    throw new Error('LLM returned empty response')
  }

  // Models sometimes wrap JSON in extra text: grab first "{" to last "}"
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('No JSON found. Raw:', raw)
    throw new Error('No JSON found in response')
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('JSON parse failed. Raw:', raw)
    throw new Error('LLM returned invalid JSON')
  }
}

// Check the JSON has the shape the next step needs.
const validateAnalysis = (r) => {
  if (!Array.isArray(r?.keyMoments) || r.keyMoments.length === 0) {
    throw new Error('Invalid analysis shape')
  }
  return r
}

const validateOptions = (r) => {
  if (
    !Array.isArray(r?.options) ||
    r.options.length !== 3 ||
    r.options.some((o) => typeof o.text !== 'string')
  ) {
    throw new Error('Invalid options shape')
  }
  return r
}

const validateRefined = (r) => {
  if (typeof r?.refinedText !== 'string' || r.refinedText.trim() === '') {
    console.error('Bad critique output:', JSON.stringify(r))
    throw new Error('Invalid critique shape')
  }
  const idx = Number(r.bestOptionIndex)
  return {
    ...r,
    bestOptionIndex: Number.isInteger(idx) && idx >= 0 && idx <= 2 ? idx : 0
  }
}

// Run a function; if it throws, try again (attempts = total tries).
const withRetry = async (fn, label, attempts = 2) => {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      console.log(`${label} failed (attempt ${i}/${attempts}): ${err.message}`)
      if (i === attempts) throw err
    }
  }
}

// ---------- Step 0: read the image(s) ----------

// Sends image URL(s) to a vision model and returns a plain-text description.
// If it fails, we continue without it so the post can still be generated.
const describeImages = async (imageUrls, profession) => {
  if (!imageUrls || imageUrls.length === 0) return null

  console.log('Step 0: Reading image...')
  try {
    const response = await groq.chat.completions.create({
      model: getVisionModel(),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt(profession) },
            ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
          ]
        }
      ],
      max_completion_tokens: 2000
    })
        const content = response.choices[0].message.content || ''
    const description = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || null
    console.log('Image description:', description)
    return description
  } catch (err) {
    console.error('Vision step failed, continuing without image details:', err.message)
    return null
  }
}

// ---------- Steps 1-3 ----------

const analyzeInput = (text, imageDescription, profession) => {
  console.log('Step 1: Analyzing input...')
  return withRetry(
    async () => validateAnalysis(await callLLM(analyzePrompt(text, imageDescription, profession))),
    'Analyze'
  )
}

const generateForPlatform = (analysis, platform, profession, styleExamples) => {
  console.log(`Step 2: Generating ${platform} content...`)
  return withRetry(
    async () =>
      validateOptions(await callLLM(generatePrompt(analysis, platform, profession, styleExamples))),
    `Generate ${platform}`
  )
}

const critiqueAndRefine = (options, platform, profession, text, imageDescription) => {
  console.log(`Step 3: Refining ${platform} content...`)
  return withRetry(
    async () =>
      validateRefined(
        await callLLM(critiquePrompt(options, platform, profession, text, imageDescription))
      ),
    `Critique ${platform}`
  )
}

// ---------- Main ----------

// imageUrls: array of image URLs (empty array if none)
// styleExamples: [{ platform, text }] of the user's previously approved posts
export const runAgentPipeline = async (text, imageUrls = [], profession, styleExamples = []) => {
  try {
    // Step 0: look at the image(s)
    const urls = Array.isArray(imageUrls) ? imageUrls : imageUrls ? [imageUrls] : []
    const imageDescription = await describeImages(urls, profession)

    // Step 1: analyze text + image description
    const analysis = await analyzeInput(text, imageDescription, profession)

    // Steps 2 and 3, one platform at a time.
    // Sequential on purpose: keeps us under Groq's free-tier rate limits.
    const platforms = {}
    for (const platform of PLATFORMS) {
      const examples = styleExamples
        .filter((s) => s.platform === platform && s.text)
        .slice(0, 2)
        .map((s) => s.text)

      const raw = await generateForPlatform(analysis, platform, profession, examples)
      const refined = await critiqueAndRefine(
        raw.options,
        platform,
        profession,
        text,
        imageDescription
      )

      platforms[platform] = { options: raw.options, refined }
    }

    return { analysis, imageDescription, platforms }
  } catch (error) {
    console.error('Pipeline failed:', error.message)
    throw new Error(`Agent pipeline failed: ${error.message}`)
  }
}