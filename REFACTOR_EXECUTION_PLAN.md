# SoulSpect Refactor Execution Plan

## Refactor Batches Overview

### Phase 1: Zero-Risk Foundation
1. **Batch 1.1: Duplicate Hooks Cleanup** - Remove identical duplicate implementations
2. **Batch 1.2: Constants Extraction** - Extract magic numbers and strings
3. **Batch 1.3: File Naming Standardization** - Standardize naming conventions

### Phase 2: Type Safety & Security
4. **Batch 2.1: API Validation Layer** - Add Zod schemas to all API routes
5. **Batch 2.2: Type Assertions Removal** - Replace unsafe type assertions with type guards
6. **Batch 2.3: Missing Type Definitions** - Add missing TypeScript interfaces

### Phase 3: Component Architecture
7. **Batch 3.1: Log Page Decomposition** - Split overgrown log page
8. **Batch 3.2: ItemCarousel Decomposition** - Split carousel into focused components
9. **Batch 3.3: Component Feature Organization** - Reorganize components by feature

### Phase 4: Service Layer Consolidation
10. **Batch 4.1: Data Access Consolidation** - Unify data access patterns
11. **Batch 4.2: AI Services Organization** - Centralize AI service configuration
12. **Batch 4.3: Base Carousel Creation** - Create shared carousel base component

---

## Detailed Operations Per Batch

### Batch 1.1: Duplicate Hooks Cleanup
**Priority**: High  
**Risk**: None  
**Scope**: Remove duplicate hook implementations

#### Exact Operations:
1. **Delete duplicate mobile hook file**:
   ```
   DELETE: src/hooks/use-mobile.tsx
   KEEP: src/hooks/use-mobile.ts (canonical)
   ```

2. **Delete duplicate toast hook**:
   ```
   DELETE: src/hooks/use-toast.ts
   KEEP: src/components/ui/use-toast.ts (canonical)
   ```

3. **Update imports for mobile hook** - Search and replace in all files:
   ```
   OLD: import { useMobile } from '@/hooks/use-mobile.tsx'
   NEW: import { useMobile } from '@/hooks/use-mobile'
   
   OLD: import { useMobile } from '../hooks/use-mobile.tsx'
   NEW: import { useMobile } from '../hooks/use-mobile'
   ```

4. **Update imports for toast hook** - Search and replace in all files:
   ```
   OLD: import { useToast } from '@/hooks/use-toast'
   NEW: import { useToast } from '@/components/ui/use-toast'
   
   OLD: import { useToast } from '../hooks/use-toast'
   NEW: import { useToast } from '@/components/ui/use-toast'
   ```

5. **Files to check for imports**:
   - Run: `grep -r "use-mobile\|useToast" src/ --include="*.tsx" --include="*.ts"`
   - Update each file found

---

### Batch 1.2: Constants Extraction
**Priority**: Low  
**Risk**: None  
**Scope**: Extract magic numbers and strings to configuration

#### Exact Operations:
1. **Create new constants file**: `src/config/constants.ts`
   ```typescript
   export const AUTOSAVE_DELAY_MS = 1500;
   export const LOCALSTORAGE_BACKUP_DELAY_MS = 2000;
   
   export const MOOD_SCALE = {
     MIN: 0,
     MAX: 6
   } as const;
   
   export const INTENSITY_SCALE = {
     MIN: 1,
     MAX: 10
   } as const;
   
   export const MOMENT_TYPES = [
     'journal',
     'emotion',
     'voice',
     'photo',
     'video',
     'chat'
   ] as const;
   
   export type MomentType = typeof MOMENT_TYPES[number];
   
   export const DEFAULT_LIMITS = {
     EMOTION_LOGS: 50,
     JOURNAL_ENTRIES: 100,
     MOMENTS: 200
   } as const;
   ```

2. **Update `src/app/(protected)/dashboard/log/page.tsx`**:
   - Line 82: Remove `const AUTOSAVE_DELAY_MS = 1500`
   - Line 83: Remove `const LOCALSTORAGE_BACKUP_DELAY_MS = 2000`
   - Add import: `import { AUTOSAVE_DELAY_MS, LOCALSTORAGE_BACKUP_DELAY_MS } from '@/config/constants'`

3. **Update files using magic numbers** (search for literal values):
   - Search for `1500` (autosave delay)
   - Search for `2000` (localStorage delay)
   - Search for `mood` with values 0-6
   - Search for `intensity` with values 1-10
   - Replace with imported constants

---

### Batch 1.3: File Naming Standardization
**Priority**: Low  
**Risk**: None  
**Scope**: Standardize file naming conventions

#### Exact Operations:
1. **Rename hook files from kebab-case to camelCase**:
   ```
   RENAME: src/hooks/use-auto-resize-textarea.ts → src/hooks/useAutoResizeTextarea.ts
   RENAME: src/hooks/use-callback-ref.ts → src/hooks/useCallbackRef.ts
   RENAME: src/hooks/use-click-away.ts → src/hooks/useClickAway.ts
   RENAME: src/hooks/use-cursor-visibility.ts → src/hooks/useCursorVisibility.ts
   RENAME: src/hooks/use-data-table.ts → src/hooks/useDataTable.ts
   RENAME: src/hooks/use-debounced-callback.ts → src/hooks/useDebouncedCallback.ts
   RENAME: src/hooks/use-menu-navigation.ts → src/hooks/useMenuNavigation.ts
   RENAME: src/hooks/use-mobile.ts → src/hooks/useMobile.ts
   RENAME: src/hooks/use-tiptap-editor.ts → src/hooks/useTiptapEditor.ts
   RENAME: src/hooks/use-window-size.ts → src/hooks/useWindowSize.ts
   ```

2. **Update all imports** - For each renamed file:
   ```
   OLD: from '@/hooks/use-auto-resize-textarea'
   NEW: from '@/hooks/useAutoResizeTextarea'
   ```
   (Apply pattern for all renamed files)

3. **Verify component naming** (already PascalCase - no changes needed)

---

### Batch 2.1: API Validation Layer
**Priority**: High  
**Risk**: None  
**Scope**: Add Zod validation to all API routes

#### Exact Operations:
1. **Create validation schemas file**: `src/lib/validation/schemas.ts`
   ```typescript
   import { z } from 'zod';
   
   // Define schemas matching current accepted shapes exactly
   export const CreateMomentSchema = z.object({
     userId: z.string().min(1),
     type: z.enum(['journal', 'emotion', 'voice', 'photo', 'video', 'chat']),
     title: z.string().optional(),
     content: z.string(),
     timestamp: z.any(), // Keep as any for now to match current behavior
     mood: z.number().min(0).max(6).optional(),
     emotions: z.array(z.string()).optional(),
     triggers: z.array(z.string()).optional(),
     intensity: z.number().min(1).max(10).optional(),
     attachments: z.array(z.string()).optional(),
     tags: z.array(z.string()).optional(),
     location: z.string().optional(),
     weather: z.string().optional()
   });
   
   export const UpdateMomentSchema = CreateMomentSchema.partial().extend({
     id: z.string().min(1)
   });
   
   export const SearchMomentsSchema = z.object({
     userId: z.string().min(1),
     query: z.string().optional(),
     type: z.enum(['journal', 'emotion', 'voice', 'photo', 'video', 'chat']).optional(),
     limit: z.number().positive().optional(),
     startDate: z.string().optional(),
     endDate: z.string().optional()
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
   ```

2. **Update `src/app/api/moments/route.ts`**:
   - Add import: `import { CreateMomentSchema } from '@/lib/validation/schemas'`
   - In POST handler, after `const body = await request.json()`:
     ```typescript
     const validatedData = CreateMomentSchema.parse(body);
     // Use validatedData instead of body for the rest of the function
     ```

3. **Update `src/app/api/moments/[id]/route.ts`**:
   - Add import: `import { UpdateMomentSchema } from '@/lib/validation/schemas'`
   - In PUT handler: `const validatedData = UpdateMomentSchema.parse(body)`

4. **Update `src/app/api/moments/search/route.ts`**:
   - Add import: `import { SearchMomentsSchema } from '@/lib/validation/schemas'`
   - In POST handler: `const validatedData = SearchMomentsSchema.parse(body)`

5. **Update `src/app/api/ai/enhanced-chat/route.ts`**:
   - Add import: `import { EnhancedChatSchema } from '@/lib/validation/schemas'`
   - In POST handler: `const validatedData = EnhancedChatSchema.parse(body)`

6. **Update remaining API routes similarly**:
   - `src/app/api/ai/index-user-data/route.ts`
   - `src/app/api/ai/reindex-user-data/route.ts`
   - `src/app/api/data-sync/migrate/route.ts`

---

### Batch 2.2: Type Assertions Removal
**Priority**: Medium  
**Risk**: None  
**Scope**: Replace unsafe type assertions with type guards

#### Exact Operations:
1. **Create type guards file**: `src/lib/utils/typeGuards.ts`
   ```typescript
   import { User, EmotionLog, JournalEntry, Moment } from '@/lib/types';
   
   export function isUser(data: any): data is User {
     return (
       data &&
       typeof data.uid === 'string' &&
       typeof data.email === 'string'
     );
   }
   
   export function isMoment(data: any): data is Moment {
     return (
       data &&
       typeof data.userId === 'string' &&
       typeof data.type === 'string' &&
       ['journal', 'emotion', 'voice', 'photo', 'video', 'chat'].includes(data.type)
     );
   }
   
   export function isEmotionLog(data: any): data is EmotionLog {
     return (
       data &&
       typeof data.mood === 'number' &&
       Array.isArray(data.emotions)
     );
   }
   
   export function isJournalEntry(data: any): data is JournalEntry {
     return (
       data &&
       typeof data.content === 'string' &&
       data.date !== undefined
     );
   }
   ```

2. **Update `src/lib/dbHelpers.ts`**:
   - Line 25: Replace `{ id: userDoc.id, ...userDoc.data() } as unknown as User`
     with:
     ```typescript
     const userData = { id: userDoc.id, ...userDoc.data() };
     if (!isUser(userData)) {
       return null;
     }
     return userData;
     ```
   - Apply similar pattern for other unsafe assertions

3. **Update `src/lib/moments.ts`**:
   - Replace all `as Moment` with type guard validation
   - Replace `as any` with proper types or validation

---

### Batch 2.3: Missing Type Definitions
**Priority**: Low  
**Risk**: None  
**Scope**: Add missing TypeScript interfaces

#### Exact Operations:
1. **Create API types file**: `src/types/api.ts`
   ```typescript
   export interface ApiResponse<T = any> {
     data?: T;
     error?: string;
     message?: string;
   }
   
   export interface PaginatedResponse<T> {
     items: T[];
     total: number;
     page: number;
     pageSize: number;
     hasMore: boolean;
   }
   
   export interface StreamResponse {
     type: 'data' | 'error' | 'end';
     content?: string;
     error?: string;
   }
   ```

2. **Create component prop types**: `src/types/components.ts`
   ```typescript
   export interface BaseLayoutProps {
     children: React.ReactNode;
     className?: string;
   }
   
   export interface ModalProps {
     isOpen: boolean;
     onClose: () => void;
     children: React.ReactNode;
     title?: string;
   }
   ```

3. **Update components and API routes** to use these types where applicable

---

### Batch 3.1: Log Page Decomposition
**Priority**: Medium  
**Risk**: Low  
**Scope**: Split 983-line log page into focused modules

#### Exact Operations:
1. **Create directory structure**:
   ```
   CREATE: src/app/(protected)/dashboard/log/hooks/
   CREATE: src/app/(protected)/dashboard/log/components/
   CREATE: src/app/(protected)/dashboard/log/utils/
   CREATE: src/app/(protected)/dashboard/log/types/
   ```

2. **Extract hooks from page.tsx**:
   - **Create**: `src/app/(protected)/dashboard/log/hooks/useJournalState.ts`
     - Move lines 52-101 (JournalState and MetaState interfaces and initial states)
     - Move state management logic (useState calls and state update functions)
   
   - **Create**: `src/app/(protected)/dashboard/log/hooks/useAutoSave.ts`
     - Move autosave useEffect and debounced save logic
     - Export: `export function useAutoSave(journalState, metaState, userId)`
   
   - **Create**: `src/app/(protected)/dashboard/log/hooks/useAIReflection.ts`
     - Move AI reflection logic and related state
     - Export: `export function useAIReflection(content, userId)`

3. **Extract components**:
   - **Create**: `src/app/(protected)/dashboard/log/components/JournalEditor.tsx`
     - Move main editor JSX (lines ~400-600)
     - Accept props: `{ journalState, onUpdate, onSave }`
   
   - **Create**: `src/app/(protected)/dashboard/log/components/SaveIndicator.tsx`
     - Move save status UI logic
     - Accept props: `{ status, lastSaved }`
   
   - **Create**: `src/app/(protected)/dashboard/log/components/ModeSelector.tsx`
     - Move mode switching UI
     - Accept props: `{ mode, onModeChange }`

4. **Extract utilities**:
   - **Create**: `src/app/(protected)/dashboard/log/utils/persistence.ts`
     - Move save/load functions to Firestore
     - Move localStorage backup logic

5. **Update main page.tsx**:
   - Import all extracted modules
   - Keep only main component structure (~200 lines)
   - Compose with extracted pieces

---

### Batch 3.2: ItemCarousel Decomposition
**Priority**: Medium  
**Risk**: Low  
**Scope**: Split 709-line carousel into focused components

#### Exact Operations:
1. **Create directory structure**:
   ```
   CREATE: src/components/carousel/
   CREATE: src/components/carousel/items/
   CREATE: src/components/carousel/hooks/
   ```

2. **Extract item components**:
   - **Create**: `src/components/carousel/items/PhotoCarouselItem.tsx`
     - Move photo rendering logic
     - Export: `export function PhotoCarouselItem({ item, onUpdate, onDelete })`
   
   - **Create**: `src/components/carousel/items/AudioCarouselItem.tsx`
     - Move audio player logic
     - Export: `export function AudioCarouselItem({ item, onUpdate, onDelete })`
   
   - **Create**: `src/components/carousel/items/VideoCarouselItem.tsx`
     - Move video player logic
     - Export: `export function VideoCarouselItem({ item, onUpdate, onDelete })`
   
   - **Create**: `src/components/carousel/items/EmotionCarouselItem.tsx`
     - Move emotion display logic
     - Export: `export function EmotionCarouselItem({ item, onUpdate, onDelete })`

3. **Extract state management**:
   - **Create**: `src/components/carousel/hooks/useCarouselState.ts`
     - Move state management logic
     - Export: `export function useCarouselState(initialItems, onChange)`

4. **Update main ItemCarousel.tsx**:
   - Move to: `src/components/carousel/ItemCarousel.tsx`
   - Import extracted components
   - Keep only main carousel structure (~150 lines)

5. **Update imports** in files using ItemCarousel:
   ```
   OLD: import { ItemCarousel } from '@/components/ItemCarousel'
   NEW: import { ItemCarousel } from '@/components/carousel/ItemCarousel'
   ```

---

### Batch 3.3: Component Feature Organization
**Priority**: Medium  
**Risk**: None  
**Scope**: Reorganize components by feature domain

#### Exact Operations:
1. **Create feature directories**:
   ```
   CREATE: src/components/features/
   CREATE: src/components/features/journal/
   CREATE: src/components/features/moments/
   CREATE: src/components/features/chat/
   CREATE: src/components/features/auth/
   CREATE: src/components/features/emotion/
   CREATE: src/components/shared/
   ```

2. **Move journal components**:
   ```
   MOVE: src/components/BlockEditor.tsx → src/components/features/journal/BlockEditor.tsx
   MOVE: src/components/VideoRecorder.tsx → src/components/features/journal/VideoRecorder.tsx
   MOVE: src/components/AttachmentPanel.tsx → src/components/features/journal/AttachmentPanel.tsx
   MOVE: src/components/AttachmentTrigger.tsx → src/components/features/journal/AttachmentTrigger.tsx
   MOVE: src/components/actionbar.tsx → src/components/features/journal/ActionBar.tsx
   MOVE: src/components/SimpleTextEditor.tsx → src/components/features/journal/SimpleTextEditor.tsx
   ```

3. **Move moments components**:
   ```
   MOVE: src/components/MomentCard.tsx → src/components/features/moments/MomentCard.tsx
   MOVE: src/components/MomentsList.tsx → src/components/features/moments/MomentsList.tsx
   MOVE: src/components/JournalHeader.tsx → src/components/features/moments/JournalHeader.tsx
   ```

4. **Move chat components**:
   ```
   MOVE: src/components/SoulspaceChat.tsx → src/components/features/chat/SoulspaceChat.tsx
   MOVE: src/components/FloatingChatPane.tsx → src/components/features/chat/FloatingChatPane.tsx
   MOVE: src/components/ChatHistory.tsx → src/components/features/chat/ChatHistory.tsx
   MOVE: src/components/ai-prompt-box.tsx → src/components/features/chat/AIPromptBox.tsx
   ```

5. **Move auth components**:
   ```
   MOVE: src/components/auth/AuthCard.tsx → src/components/features/auth/AuthCard.tsx
   ```

6. **Move emotion components**:
   ```
   MOVE: src/components/emotion_anchor.tsx → src/components/features/emotion/EmotionAnchor.tsx
   MOVE: src/components/EmotionDialogControlled.tsx → src/components/features/emotion/EmotionDialogControlled.tsx
   MOVE: src/components/EmotionSelector.tsx → src/components/features/emotion/EmotionSelector.tsx
   MOVE: src/components/EmotionsVisualizer.tsx → src/components/features/emotion/EmotionsVisualizer.tsx
   ```

7. **Move shared components**:
   ```
   MOVE: src/components/LoadingSpinner.tsx → src/components/shared/LoadingSpinner.tsx
   MOVE: src/components/PageLoader.tsx → src/components/shared/PageLoader.tsx
   ```

8. **Update all imports** - For each moved file, update imports:
   ```
   OLD: import { BlockEditor } from '@/components/BlockEditor'
   NEW: import { BlockEditor } from '@/components/features/journal/BlockEditor'
   ```

---

### Batch 4.1: Data Access Consolidation
**Priority**: High  
**Risk**: Low  
**Scope**: Unify data access patterns while maintaining backward compatibility

#### Exact Operations:
1. **Create new directory structure**:
   ```
   CREATE: src/lib/data/
   CREATE: src/lib/data/client/
   CREATE: src/lib/data/server/
   CREATE: src/lib/data/shared/
   CREATE: src/lib/data/legacy/
   ```

2. **Move and consolidate files**:
   ```
   MOVE: src/lib/types.ts → src/lib/data/shared/types.ts
   MOVE: src/lib/momentClient.ts → src/lib/data/client/moments.ts
   MOVE: src/lib/moments-server.ts → src/lib/data/server/moments.ts
   MOVE: src/lib/dbHelpersServer.ts → src/lib/data/server/helpers.ts
   MOVE: src/lib/dbHelpersAdmin.ts → src/lib/data/server/admin.ts
   MOVE: src/lib/dbHelpers.ts → src/lib/data/legacy/dbHelpers.ts
   COPY: src/lib/moments.ts → src/lib/data/client/momentsBase.ts (keep original for now)
   ```

3. **Create barrel exports**: `src/lib/data/index.ts`
   ```typescript
   // Client exports
   export * from './client/moments';
   export * from './client/momentsBase';
   
   // Server exports (only in server context)
   export * from './server/moments';
   export * from './server/helpers';
   export * from './server/admin';
   
   // Shared types
   export * from './shared/types';
   
   // Legacy exports with deprecation notice
   export * from './legacy/dbHelpers';
   ```

4. **Create backward compatibility layer**: `src/lib/moments.ts`
   ```typescript
   // Maintain backward compatibility
   export * from './data/client/momentsBase';
   ```

5. **Update imports gradually**:
   - Files importing from `@/lib/types` → `@/lib/data/shared/types`
   - Files importing from `@/lib/momentClient` → `@/lib/data/client/moments`
   - Keep `@/lib/moments` imports working via compatibility layer

---

### Batch 4.2: AI Services Organization
**Priority**: Low  
**Risk**: None  
**Scope**: Centralize AI service configuration

#### Exact Operations:
1. **Create AI directory structure**:
   ```
   CREATE: src/lib/ai/
   CREATE: src/lib/ai/services/
   CREATE: src/lib/ai/config/
   CREATE: src/lib/ai/types/
   ```

2. **Create shared configuration**: `src/lib/ai/config/index.ts`
   ```typescript
   export const AI_CONFIG = {
     gemini: {
       model: process.env.GEMINI_MODEL || 'gemini-pro',
       temperature: 0.7,
       maxTokens: 2048,
       apiKey: process.env.GEMINI_API_KEY
     },
     openai: {
       model: process.env.OPENAI_MODEL || 'gpt-4',
       temperature: 0.7,
       apiKey: process.env.OPENAI_API_KEY
     },
     embedding: {
       model: 'text-embedding-ada-002',
       dimensions: 1536
     }
   } as const;
   ```

3. **Move AI services**:
   ```
   MOVE: src/lib/enhancedAi.ts → src/lib/ai/services/enhanced.ts
   MOVE: src/lib/enhancedAi-server.ts → src/lib/ai/services/enhancedServer.ts
   MOVE: src/lib/reflectionService.ts → src/lib/ai/services/reflection.ts
   MOVE: src/lib/vertexai.ts → src/lib/ai/services/vertex.ts
   MOVE: src/lib/embeddingService.ts → src/lib/ai/services/embedding.ts
   MOVE: src/lib/transcriptionService.ts → src/lib/ai/services/transcription.ts
   ```

4. **Keep existing imports working**: Create compatibility exports in original locations
   ```typescript
   // src/lib/enhancedAi.ts
   export * from './ai/services/enhanced';
   ```

5. **Update service files** to use shared config:
   - Import AI_CONFIG in each service
   - Replace hardcoded values with config references

---

### Batch 4.3: Base Carousel Creation
**Priority**: Low  
**Risk**: Low  
**Scope**: Create shared carousel base component

#### Exact Operations:
1. **Create base carousel**: `src/components/carousel/BaseCarousel.tsx`
   ```typescript
   import React from 'react';
   
   export interface BaseCarouselProps<T> {
     items: T[];
     renderItem: (item: T, index: number) => React.ReactNode;
     onItemChange?: (index: number) => void;
     onItemDelete?: (index: number) => void;
     className?: string;
     showControls?: boolean;
     autoPlay?: boolean;
   }
   
   export function BaseCarousel<T>({ 
     items, 
     renderItem, 
     onItemChange, 
     onItemDelete,
     className,
     showControls = true,
     autoPlay = false
   }: BaseCarouselProps<T>) {
     // Extract common carousel logic from existing carousels
     // Navigation, keyboard controls, swipe gestures, etc.
   }
   ```

2. **Refactor ItemCarousel** to use BaseCarousel:
   - Import BaseCarousel
   - Wrap existing logic with BaseCarousel
   - Pass item renderers as props

3. **Refactor PhotoCarouselGallery** to use BaseCarousel:
   - Import BaseCarousel
   - Simplify to use base logic

4. **Refactor GenericCarouselGallery** to use BaseCarousel:
   - Import BaseCarousel
   - Simplify to use base logic

---

## Verification & Test Plan Per Batch

### Universal Verification Commands (Run After Each Batch)
```bash
# 1. TypeScript compilation check
npm run build

# 2. Linting check
npm run lint

# 3. Development server check
npm run dev
# Then verify no console errors on startup
```

### Batch-Specific Test Plans

#### Batch 1.1: Duplicate Hooks Cleanup
**Manual Testing**:
1. Navigate to any page and resize browser window
2. Verify mobile menu appears/disappears at breakpoint
3. Trigger any action that shows a toast (e.g., save in log page)
4. Verify toast appears correctly

**Pass Criteria**: Mobile detection and toast notifications work identically to current behavior.

#### Batch 1.2: Constants Extraction
**Manual Testing**:
1. Navigate to `/dashboard/log`
2. Type some content and stop typing
3. Verify save triggers after 1.5 seconds (watch for save indicator)
4. Verify localStorage backup occurs

**Pass Criteria**: Autosave timing matches current behavior exactly.

#### Batch 1.3: File Naming Standardization
**Manual Testing**:
- No functional testing needed (rename only)
- Verify build succeeds

**Pass Criteria**: Build completes without import errors.

#### Batch 2.1: API Validation Layer
**Manual Testing - Critical Flows**:
1. **Journal Capture** (`/dashboard/log`):
   - Create text entry with title and content
   - Add photo attachment
   - Add emotion tags
   - Switch to video mode and record
   - Verify all saves successfully

2. **AI Interaction**:
   - Open Soulspace (`/dashboard/soulspace`)
   - Send a query
   - Verify response streams correctly
   - Open floating chat in log page
   - Test chat interaction

3. **Auth Flow**:
   - Log out
   - Log in with email/password
   - Test "forgot password" flow
   - Sign up new account (test environment)

4. **Data Operations**:
   - Navigate to `/dashboard/journal`
   - Search for entries
   - Filter by type
   - View entry details

**Pass Criteria**: All API calls succeed with same data as before. No validation errors for existing valid data.

#### Batch 2.2: Type Assertions Removal
**Manual Testing**:
- Run through critical flows above
- Check browser console for any type errors

**Pass Criteria**: No runtime errors, data loads correctly.

#### Batch 2.3: Missing Type Definitions
**Manual Testing**:
- TypeScript compilation only

**Pass Criteria**: Build succeeds without type errors.

#### Batch 3.1: Log Page Decomposition
**Manual Testing - Comprehensive**:
1. Navigate to `/dashboard/log`
2. Test all functionality:
   - Text editing with formatting
   - Video recording
   - Photo attachments
   - Emotion logging
   - Mode switching
   - Autosave indicator
   - AI reflections
   - Draft saving/loading

**Pass Criteria**: All log page features work identically to current implementation.

#### Batch 3.2: ItemCarousel Decomposition
**Manual Testing**:
1. Add multiple photos to a journal entry
2. Navigate through carousel
3. Add captions to photos
4. Delete items from carousel
5. Test with audio attachments
6. Test with video attachments

**Pass Criteria**: Carousel behavior unchanged, all media types display correctly.

#### Batch 3.3: Component Feature Organization
**Manual Testing**:
- Run through all critical flows
- Verify no missing components or broken imports

**Pass Criteria**: All pages load and function correctly.

#### Batch 4.1: Data Access Consolidation
**Manual Testing - Data Operations**:
1. Create new entries (all types)
2. Load existing entries
3. Update entries
4. Delete entries
5. Search functionality
6. Check legacy data still loads

**Pass Criteria**: All data operations work, including legacy data.

#### Batch 4.2: AI Services Organization
**Manual Testing**:
1. Test AI chat in Soulspace
2. Test floating chat
3. Test AI reflections in journal
4. Test vector search

**Pass Criteria**: AI features work identically.

#### Batch 4.3: Base Carousel Creation
**Manual Testing**:
1. Test all carousel instances
2. Test navigation controls
3. Test keyboard navigation
4. Test swipe gestures (if implemented)

**Pass Criteria**: All carousels function identically to before.

---

## Global Execution Order & Safeguards

### Pre-Execution Setup
```bash
# 1. Ensure clean working directory
git status

# 2. Create safety backup tag
git tag backup-pre-refactor-$(date +%Y%m%d)

# 3. Ensure on main branch
git checkout main
git pull origin main
```

### Phase 1: Zero-Risk Foundation (Day 1)
```bash
# Create branch
git checkout -b refactor/phase-1-foundation

# Execute Batch 1.1: Duplicate Hooks Cleanup
# ... perform operations ...
npm run build && npm run lint
# ... manual testing ...
git add -A
git commit -m "refactor: remove duplicate hook implementations"

# Execute Batch 1.2: Constants Extraction  
# ... perform operations ...
npm run build && npm run lint
# ... manual testing ...
git add -A
git commit -m "refactor: extract magic numbers to constants"

# Execute Batch 1.3: File Naming Standardization
# ... perform operations ...
npm run build && npm run lint
git add -A
git commit -m "refactor: standardize file naming conventions"

# Full verification
npm run build
npm run lint
npm run dev
# Complete manual testing of all critical flows

# Push for review
git push origin refactor/phase-1-foundation
```

**Rollback**: `git checkout main && git branch -D refactor/phase-1-foundation`

### Phase 2: Type Safety & Security (Day 2)
```bash
# Create branch from main (after Phase 1 merged)
git checkout main
git pull origin main
git checkout -b refactor/phase-2-type-safety

# Execute Batch 2.1: API Validation Layer
# ... perform operations ...
npm run build && npm run lint
# ... extensive API testing ...
git add -A
git commit -m "security: add Zod validation to API routes"

# Execute Batch 2.2: Type Assertions Removal
# ... perform operations ...
npm run build
git add -A
git commit -m "refactor: replace unsafe type assertions with type guards"

# Execute Batch 2.3: Missing Type Definitions
# ... perform operations ...
npm run build
git add -A
git commit -m "refactor: add missing type definitions"

# Full verification
# Complete testing of all critical flows
git push origin refactor/phase-2-type-safety
```

**Rollback**: `git checkout main && git branch -D refactor/phase-2-type-safety`

### Phase 3: Component Architecture (Day 3-4)
```bash
# Create branch
git checkout main
git pull origin main
git checkout -b refactor/phase-3-components

# Execute Batch 3.1: Log Page Decomposition (High complexity - careful testing)
# ... perform operations ...
npm run build && npm run lint
# ... extensive testing of log page ...
git add -A
git commit -m "refactor: decompose log page into focused modules"

# Execute Batch 3.2: ItemCarousel Decomposition
# ... perform operations ...
npm run build && npm run lint
# ... test carousel functionality ...
git add -A
git commit -m "refactor: decompose ItemCarousel into focused components"

# Execute Batch 3.3: Component Feature Organization
# ... perform operations ...
npm run build && npm run lint
# ... test all imports work ...
git add -A
git commit -m "refactor: organize components by feature domain"

# Extensive verification
# Test ALL features thoroughly
git push origin refactor/phase-3-components
```

**Rollback**: `git checkout main && git branch -D refactor/phase-3-components`

### Phase 4: Service Layer Consolidation (Day 5-6)
```bash
# Create branch
git checkout main
git pull origin main
git checkout -b refactor/phase-4-services

# Execute Batch 4.1: Data Access Consolidation (Critical - test thoroughly)
# ... perform operations ...
npm run build && npm run lint
# ... test all data operations ...
git add -A
git commit -m "refactor: consolidate data access patterns"

# Execute Batch 4.2: AI Services Organization
# ... perform operations ...
npm run build && npm run lint
# ... test AI features ...
git add -A
git commit -m "refactor: organize AI services"

# Execute Batch 4.3: Base Carousel Creation
# ... perform operations ...
npm run build && npm run lint
# ... test carousels ...
git add -A
git commit -m "refactor: create base carousel component"

# Final comprehensive testing
git push origin refactor/phase-4-services
```

**Rollback**: `git checkout main && git branch -D refactor/phase-4-services`

### Post-Execution
```bash
# After all phases merged
git tag refactor-complete-$(date +%Y%m%d)
```

---

## Items Excluded (Manual Review Required)

### 1. Vector Service Consolidation
**Status**: **EXCLUDED - Manual Review Required**

**Current Situation**:
- Multiple vector implementations (Pinecone, ChromaDB)
- Unclear which is canonical
- Both may be used in different contexts

**Decisions Needed From You**:
1. Which vector service is currently active in production?
2. Is there a preference for Pinecone vs ChromaDB going forward?
3. Are both needed for different environments/features?
4. What is the migration path for existing vector data?
5. Performance characteristics of each in your use case?

**Why Excluded**: Changing vector service could alter search results and AI context quality, directly impacting user experience.

---

### 2. Firebase Admin Initialization Patterns
**Status**: **EXCLUDED - Manual Review Required**

**Current Situation**:
- Multiple initialization patterns across server files
- Different approaches in different contexts
- May have security or performance implications

**Decisions Needed From You**:
1. Is there a specific reason for different initialization patterns?
2. Have you experienced issues with any particular pattern?
3. Are there specific Firebase Admin SDK features used differently in different contexts?
4. What is the preferred pattern for new code?

**Why Excluded**: Could affect authentication flow and server-side operations, potentially breaking auth for users.

---

### 3. Deprecated Function Removal
**Status**: **EXCLUDED - Manual Review Required**

**Current Situation**:
- Legacy functions in `dbHelpers.ts` marked deprecated
- Console warnings but still functional
- May be used by existing user data or external integrations

**Decisions Needed From You**:
1. How many users have data created with legacy functions?
2. Is there an active migration process for old data?
3. Are there any external systems/scripts using these functions?
4. What is the timeline for removing deprecated functions?
5. Should we create a migration script first?

**Why Excluded**: Removing these could break backward compatibility for users with older data formats.

---

## Success Metrics

Each batch is considered successful when:
1. ✅ TypeScript compilation succeeds (`npm run build`)
2. ✅ Linting passes (`npm run lint`)
3. ✅ Dev server starts without errors (`npm run dev`)
4. ✅ All critical user flows work identically:
   - Journal capture on `/dashboard/log`
   - AI chat in Soulspace and FloatingChat
   - Auth/login/signup flows
   - Journal viewing and search
5. ✅ No visual regressions in UI
6. ✅ No performance degradations
7. ✅ No new console errors or warnings

## Risk Summary

- **Phase 1**: Zero risk - purely mechanical changes
- **Phase 2**: Zero risk - adds validation without changing accepted data
- **Phase 3**: Low risk - file organization and splitting only
- **Phase 4**: Low risk - maintains all existing APIs and exports

All changes are internal restructuring that preserve external behavior completely.