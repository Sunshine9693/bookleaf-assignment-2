// Candidate only. Never adds facts, policy, words, or an AI-generated claim.
export function normalizeProviderText(content) {
  if (typeof content !== 'string') return content;
  return content.replace(/\*\*([^*\r\n]+)\*\*/g, '$1')
    .split(/\r?\n/)
    .filter(line => !/^\s*(?:[-*]\s*)?Royalty Status\s*:\s*(?:Red|Green|Yellow)\s*$/i.test(line))
    .join('\n');
}

export function auditHardenedBody(body, promptData) {
  if (/\b(?:Red|Green|Yellow)\b/i.test(body)) return 'AI output contains an internal badge label';
  if (/\*\*|^\s*#{1,6}\s|\[[^\]]+\]\([^\)]+\)|```/m.test(body)) return 'AI output contains unsupported Markdown';
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 200 || words > 400) return 'AI output must contain 200–400 body words';
  if (promptData?.totals.pending > 0 && (!/quarter/i.test(body) || !/45\s*[- ]?\s*days?|forty[- ]five days/i.test(body))) return 'Pending summary omits the quarterly 45-day policy';
  if (promptData && !promptData.flags.below_threshold && /\broll(?:s|ed|ing)?\s*over\b|\brollover\b|\bminimum (?:payout|payment)\b|\bbelow[^.\n]{0,50}\bthreshold\b/i.test(body)) return 'AI output applies an inapplicable payout threshold or rollover';
  return '';
}

export function parseHardenedResponse(response, promptData, originalParser) {
  let normalized = response;
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    normalized = JSON.parse(JSON.stringify(response));
    normalized.choices[0].message.content = normalizeProviderText(content);
  }
  const parsed = originalParser(normalized, promptData);
  if (!parsed.valid) return parsed;
  const error = auditHardenedBody(parsed.summary_body, promptData);
  return error ? { valid: false, error } : parsed;
}
