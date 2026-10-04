export const analyzePrompt = (text, imageDescription, profession) => `
You are an expert content strategist analyzing a daily activity log 
from a ${profession}.

Their log: "${text || 'No text provided'}"
${imageDescription ? `Image context: "${imageDescription}"` : ''}

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

export const generatePrompt = (analysis, platform, profession) => {
  const rules = {
    instagram: 'casual and warm, 50 words max , end with 5-8 hashtags, 1-2 emojis',
    linkedin: 'professional storytelling, 200 words max , max 3 hashtags, end with a question',
    twitter: 'punchy and under 200 characters, 2-3 hashtags optional'
  }

  return `You are a social media expert for a ${profession}.

Write 3 different ${platform} posts based on this:
- Key moments: ${analysis.keyMoments.join(', ')}
- Tone: ${analysis.tone}
- Audience: ${analysis.targetAudience}
- Hook: ${analysis.emotionalHook}

Rules: ${rules[platform]}

You MUST return only this JSON, nothing else:
{"options":[{"text":"post text here","tone":"casual","angle":"angle used","reasoning":"why this works"},{"text":"post text here","tone":"professional","angle":"angle used","reasoning":"why this works"},{"text":"post text here","tone":"inspirational","angle":"angle used","reasoning":"why this works"}]}`
}
export const critiquePrompt = (options, platform, profession) => `
You are a ruthlessly honest editor reviewing ${platform} posts 
for a ${profession}.

Here are 3 drafts:
${options.map((o, i) => `
Option ${i + 1} (${o.tone}):
"${o.text}"
`).join('\n')}

Evaluate each for:
1. Does it sound human or like AI wrote it?
2. Would a real ${profession}'s audience stop scrolling for this?
3. Is it authentic to their profession?

Pick the strongest one and make it better with one specific improvement.

Return JSON only:
{
  "bestOptionIndex": 0,
  "whyBest": "specific reason this one works better than the others",
  "weakness": "the one thing holding it back",
  "refinedText": "the improved version — make it feel more human and authentic"
}
`