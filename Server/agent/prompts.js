// Platform rules, shared by the generate and critique prompts
export const PLATFORM_RULES = {
  instagram: 'casual and warm, 50 words max, end with 5-8 hashtags, 1-2 emojis',
  linkedin: 'professional storytelling, 200 words max, max 3 hashtags, end with a question',
  twitter: 'punchy and under 200 characters, 2-3 hashtags optional'
}

// Prompt for the vision model: turns the uploaded photo(s) into plain facts.
export const visionPrompt = (profession) => `
You are looking at a photo from a ${profession}'s work day.
Describe ONLY what is clearly visible: objects, materials, colors, lighting, setting, and any readable text.
Do not guess names, prices, brands, locations, or anything that is not visible.
Write 3-5 plain sentences. No marketing language.
`

// Step 1: turn the raw log (+ image description) into structured analysis.
export const analyzePrompt = (text, imageDescription, profession) => `
You are an expert content strategist analyzing a daily activity log
from a ${profession}.

Their log: "${text || 'No text provided'}"
${imageDescription ? `What is visible in their photo: "${imageDescription}"` : ''}

Use ONLY facts found in the log or the photo description. Do not invent details.
Keep details separate: do not combine two details into a new one.

Analyze this and return JSON only, no explanation:
{
  "keyMoments": ["the most interesting/shareable moments from their day"],
  "tone": "one of: professional / casual / inspirational / educational",
  "targetAudience": "who would genuinely care about this content",
  "contentAngles": [
    "angle 1: a specific way to frame this story",
    "angle 2: another angle",
    "angle 3: another angle"
  ],
  "emotionalHook": "the one thing that makes this relatable or interesting"
}
`

// Step 2: write 3 drafts for one platform.
// styleExamples = the user's own previously approved posts for this platform.
export const generatePrompt = (analysis, platform, profession, styleExamples = []) => {
  const styleBlock = styleExamples.length
    ? `The user's own approved posts. Match this voice:\n${styleExamples.map((s) => `- "${s}"`).join('\n')}\n`
    : ''

  return `You are a social media expert for a ${profession}.

Write 3 different ${platform} posts based on this:
- Key moments: ${analysis.keyMoments.join(', ')}
- Tone: ${analysis.tone}
- Audience: ${analysis.targetAudience}
- Hook: ${analysis.emotionalHook}

${styleBlock}Rules: ${PLATFORM_RULES[platform]}

Use only facts from the key moments above. Do not invent details.
Do not describe the client's expressions, words or emotions beyond what the facts state.
Open with a hook about the single most striking detail instead of listing every item. Mention at most 3-4 details.
Do not change how the log describes the client's reaction (if it says "loved it", do not write "approved" or "touched their heart"). Do not add metaphors or feelings that are not in the facts.
Do not combine two details into a new one (for example, an arched wall is not an arched light).
Make the 3 options clearly different in tone: casual, professional, inspirational.

You MUST return only this JSON, nothing else:
{"options":[{"text":"post text here","tone":"casual","angle":"angle used","reasoning":"why this works"},{"text":"post text here","tone":"professional","angle":"angle used","reasoning":"why this works"},{"text":"post text here","tone":"inspirational","angle":"angle used","reasoning":"why this works"}]}`
}

// Step 3: pick the best draft and improve it, without adding new facts.
export const critiquePrompt = (options, platform, profession, originalText, imageDescription) => `
You are a ruthlessly honest editor reviewing ${platform} posts
for a ${profession}.

The ONLY facts available are:
- The original log: "${originalText || 'No text provided'}"
${imageDescription ? `- The photo description: "${imageDescription}"` : ''}

Here are 3 drafts:
${options.map((o, i) => `
Option ${i} (${o.tone}):
"${o.text}"
`).join('\n')}

FACT RULE: Never add details that are not in the facts above (no new objects, names, quotes, numbers or reactions). If a draft feels generic, fix it by rephrasing, not by inventing. Remove any invented detail you find in the drafts.
The final post must still follow these platform rules: ${PLATFORM_RULES[platform]}

Evaluate each for:
1. Does it sound human or like AI wrote it?
2. Would a real ${profession}'s audience stop scrolling for this?
3. Is it authentic to their profession?

Pick the strongest one and make it better with one specific improvement.

Return JSON only. bestOptionIndex must be the number 0, 1 or 2, matching the option number shown above.
{
  "bestOptionIndex": 0,
  "whyBest": "specific reason this one works better than the others",
  "weakness": "the one thing holding it back",
  "refinedText": "the improved version: rephrased and polished, with a hook, but never a copy of the log and with no new facts"
}
`