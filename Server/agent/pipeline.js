import groq from '../config/groq.js'
import { analyzePrompt, generatePrompt, critiquePrompt } from './prompts.js'

const MODEL = 'openai/gpt-oss-20b'

// Helper — every LLM call goes through this
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
// Step 1
const analyzeInput = async (text, imageDescription, profession) => {
  console.log('🔍 Step 1: Analyzing input...')
  return await callLLM(analyzePrompt(text, imageDescription, profession))
}

// Step 2 — one platform
const generateForPlatform = async (analysis, platform, profession) => {
  console.log(`✍️  Step 2: Generating ${platform} content...`)
  const prompt = generatePrompt(analysis, platform, profession)
  return await callLLM(prompt)
}

// Step 3 — one platform
const critiqueAndRefine = async (options, platform, profession) => {
  console.log(`🎯 Step 3: Refining ${platform} content...`)
  return await callLLM(critiquePrompt(options, platform, profession))
}

const generateWithRetry = async (analysis, platform, profession, retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateForPlatform(analysis, platform, profession)
    } catch (err) {
      console.log(`Retry ${i + 1} for ${platform}...`)
      if (i === retries - 1) throw err
    }
  }
}

// Main function — orchestrates everything
export const runAgentPipeline = async (text, imageUrl, profession) => {
  try {
    // Step 1: Analyze
    const analysis = await analyzeInput(
      text,
      imageUrl ? 'User uploaded an image of their work' : null,
      profession
    )

    const platforms = ['instagram', 'linkedin', 'twitter']


    // Step 2: Generate for all 3 platforms 
    
    const instagramRaw = await generateForPlatform(analysis, 'instagram', profession)
    const linkedinRaw = await generateForPlatform(analysis, 'linkedin', profession)
    const twitterRaw = await generateForPlatform(analysis, 'twitter', profession)

    // Step 3: Critique all 3 
    const instagramRefined = await critiqueAndRefine(instagramRaw.options, 'instagram', profession)
    const linkedinRefined = await critiqueAndRefine(linkedinRaw.options, 'linkedin', profession)
    const twitterRefined = await critiqueAndRefine(twitterRaw.options, 'twitter', profession)

    // Return everything structured
    return {
      analysis,
      platforms: {
        instagram: {
          options: instagramRaw.options,
          refined: instagramRefined
        },
        linkedin: {
          options: linkedinRaw.options,
          refined: linkedinRefined
        },
        twitter: {
          options: twitterRaw.options,
          refined: twitterRefined
        }
      }
    }

  } catch (error) {
    console.error('Pipeline failed:', error.message)
    throw new Error(`Agent pipeline failed: ${error.message}`)
  }
}

