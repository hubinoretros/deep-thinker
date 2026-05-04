import { ZodError } from "zod";

export interface FriendlyError {
  status: "error";
  error: string;
  message: string;
  field?: string;
  hint?: string;
  example?: unknown;
}

export function formatZodError(err: ZodError, toolName: string): FriendlyError {
  const firstIssue = err.issues[0];
  const field = firstIssue.path.join(".");

  const hints: Record<string, string> = {
    confidence: "confidence 0 ile 1 arasında bir sayı olmalı. Örnek: confidence: 0.7",
    strategy: "Geçerli stratejiler: sequential, dialectic, parallel, analogical, abductive, first_principles, counterfactual, systems_thinking, mcts, auto",
    type: "Geçerli tipler: hypothesis, analysis, evidence, conclusion, question, assumption, insight, critique, synthesis, observation",
    content: "content boş olamaz ve string olmalı",
    nodeId: 'nodeId için "last", "best", "root" alias\'larını veya graph aracından aldığınız ID\'yi kullanın',
    action: `${toolName} için geçerli action değerlerini görmek üzere help aracını çağırın`,
    depth: "depth 1 ile 5 arasında bir tam sayı olmalı",
    years: "years bir sayı olmalı (pozitif=gelecek, negatif=geçmiş)",
  };

  return {
    status: "error",
    error: "VALIDATION_ERROR",
    message: `"${field}" parametresinde hata: ${firstIssue.message}`,
    field,
    hint: hints[field] ?? `${field} parametresini kontrol edin`,
  };
}

export function formatUnknownError(err: unknown, context: string): FriendlyError {
  const message = err instanceof Error ? err.message : String(err);
  return {
    status: "error",
    error: "INTERNAL_ERROR",
    message: `${context} sırasında hata oluştu: ${message}`,
    hint: "Sorun devam ederse reset aracıyla yeni bir oturum başlatın",
  };
}
