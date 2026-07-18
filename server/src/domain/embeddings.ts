// Text embeddings for dedup (PRD 3.3 step 4 uses pgvector similarity).
//
// Interface + deterministic stub. The stub produces a stable pseudo-embedding
// from the text hash so similar text yields identical vectors in dev; wire a
// real embedding model in `providerEmbed` (guarded by OPENAI_API_KEY).

import { env } from "../env";

export const EMBEDDING_DIM = 1536; // matches reports.description_embedding VECTOR(1536)

export interface Embedder {
  embed(text: string): Promise<number[]>;
}

// Deterministic, seeded pseudo-embedding. NOT semantically meaningful - it just
// lets the dedup path run without a provider. Identical text => identical vec.
function pseudoEmbed(text: string): number[] {
  const clean = text.toLowerCase().replace(/\s+/g, " ").trim();
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  let seed = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    seed ^= clean.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
    const idx = seed % EMBEDDING_DIM;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  // L2 normalize so cosine distance behaves.
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export const stubEmbedder: Embedder = {
  async embed(text: string) {
    return pseudoEmbed(text || "");
  },
};

const providerEmbedder: Embedder = {
  async embed(text: string) {
    // TODO: call the embedding model (must return EMBEDDING_DIM floats).
    return stubEmbedder.embed(text);
  },
};

export function getEmbedder(): Embedder {
  return env.openaiApiKey ? providerEmbedder : stubEmbedder;
}

export function embedText(text: string): Promise<number[]> {
  return getEmbedder().embed(text);
}

// pgvector literal, e.g. "[0.1,0.2,...]".
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
