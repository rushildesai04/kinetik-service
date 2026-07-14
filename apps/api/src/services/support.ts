interface SupportContext {
  injuryType: string;
  sport?: string;
  recoveryPhase: string;
  adherenceRate: number;
  readinessScore?: number;
  readinessRecommendation?: string;
  painScore?: number;
  confidenceScore?: number;
  exercisesRemaining: number;
  exercisesTotal: number;
  streak: number;
}

export function generateSupportReply(message: string, ctx: SupportContext): string {
  const lower = message.toLowerCase();

  if (lower.includes("readiness") || lower.includes("score") || lower.includes("doing")) {
    if (ctx.readinessScore != null) {
      return `Your readiness score is ${Math.round(ctx.readinessScore)}/100 — ${ctx.readinessRecommendation ?? "keep building consistency"}. Adherence is at ${Math.round(ctx.adherenceRate)}% with a ${ctx.streak}-day streak. ${ctx.exercisesRemaining > 0 ? `You have ${ctx.exercisesRemaining} exercise${ctx.exercisesRemaining === 1 ? "" : "s"} left today.` : "You've completed today's program — great work."}`;
    }
    return "You don't have a readiness score yet. Complete your daily check-in and at least one exercise session to generate your first score.";
  }

  if (lower.includes("intensity") || lower.includes("safe") || lower.includes("increase")) {
    if ((ctx.painScore ?? 0) >= 7) {
      return `Your recent pain score is ${ctx.painScore}/10, which is elevated. I'd recommend staying at current intensity and contacting your clinician before progressing. Focus on form quality over load today.`;
    }
    if (ctx.readinessScore != null && ctx.readinessScore >= 70) {
      return `With readiness at ${Math.round(ctx.readinessScore)}% and pain at ${ctx.painScore ?? "—"}/10, gradual intensity increases look reasonable. Add one challenging set per exercise this week rather than jumping volume.`;
    }
    return `For ${ctx.injuryType} recovery, maintain current load until readiness exceeds 70% and pain stays below 4/10. You're at ${ctx.readinessScore != null ? Math.round(ctx.readinessScore) : "—"}% readiness — consistency beats intensity right now.`;
  }

  if (lower.includes("session") || lower.includes("focus") || lower.includes("next") || lower.includes("today")) {
    if (ctx.exercisesRemaining > 0) {
      return `Focus on completing your remaining ${ctx.exercisesRemaining} exercise${ctx.exercisesRemaining === 1 ? "" : "s"} today with controlled tempo and full range of motion. Prioritize form scores above 80% before adding reps.`;
    }
    return "Today's program is complete. Use this time for light mobility work or rest. Tomorrow, lead with your highest-priority exercise while pain and confidence are fresh.";
  }

  if (lower.includes("pain")) {
    return ctx.painScore != null
      ? `Your latest pain score is ${ctx.painScore}/10. ${ctx.painScore >= 7 ? "This is high — reduce load and notify your clinician if it persists." : ctx.painScore >= 4 ? "Monitor closely during sessions and avoid sharp increases in volume." : "Pain levels look manageable — keep tracking daily to catch any flare-ups early."}`
      : "Complete a daily check-in so I can track your pain trends and give personalized guidance.";
  }

  if (lower.includes("confidence") || lower.includes("fear") || lower.includes("hesit")) {
    return ctx.confidenceScore != null
      ? `Your confidence score is ${ctx.confidenceScore}/10. ${ctx.confidenceScore < 5 ? "Low confidence is normal post-injury — progress through low-risk movements before sport-specific drills." : "Confidence is building well. Pair each session with a small challenge slightly outside your comfort zone."}`
      : "Log your confidence in the daily check-in — psychological readiness is 25% of your overall score.";
  }

  return `I'm synced with your ${ctx.injuryType} recovery data${ctx.sport ? ` (${ctx.sport})` : ""}. You're in the ${ctx.recoveryPhase.replace(/_/g, " ").toLowerCase()} phase at ${Math.round(ctx.adherenceRate)}% adherence. Ask me about readiness, pain, session focus, or whether it's safe to increase intensity.`;
}
