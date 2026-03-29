import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  keyHash: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "キー名を入力してください").max(100),
});
