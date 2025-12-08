import { z } from 'zod';

// Define schemas matching current accepted shapes exactly
const MomentDataSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['journal', 'emotion', 'voice', 'photo', 'video', 'chat']),
  title: z.string().optional(),
  content: z.string(),
  timestamp: z.any().optional(), // Keep as any and optional for flexibility
  mood: z.number().min(0).max(6).optional(),
  emotions: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  intensity: z.number().min(1).max(10).optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  weather: z.string().optional()
});

export const CreateMomentSchema = z.object({
  momentData: MomentDataSchema,
  indexForSearch: z.boolean().optional()
});

export const UpdateMomentSchema = z.object({
  momentData: MomentDataSchema.partial(),
  id: z.string().min(1).optional(), // Some routes may pass ID differently
  indexForSearch: z.boolean().optional()
});

export const SearchMomentsSchema = z.object({
  userId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().positive().optional(),
  type: z.enum(['journal', 'emotion', 'voice', 'photo', 'video', 'chat']).optional(),
  emotions: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.any().optional(),
    end: z.any().optional()
  }).optional(),
  moodRange: z.object({
    min: z.number().min(0).max(6).optional(),
    max: z.number().min(0).max(6).optional()
  }).optional()
});

export const EnhancedChatSchema = z.object({
  userId: z.string().min(1),
  query: z.string().min(1),
  mode: z.enum(['explore', 'release', 'decide', 'normal']).optional(),
  source: z.string().optional(),
  stream: z.boolean().optional()
});

export const IndexUserDataSchema = z.object({
  userId: z.string().min(1),
  force: z.boolean().optional()
});

export const DataMigrationSchema = z.object({
  userId: z.string().min(1),
  options: z.object({
    dryRun: z.boolean().optional(),
    indexVectors: z.boolean().optional(),
    skipExisting: z.boolean().optional(),
    batchSize: z.number().optional(),
    includeVectorIndexing: z.boolean().optional()
  }).optional()
});