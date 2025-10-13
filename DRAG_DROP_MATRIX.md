# Complete MECE Drag & Drop Matrix

## Draggable Sources (3 types)
1. **Ungrouped Idea** - An idea card not in any group
2. **Grouped Idea** - An idea card inside a group
3. **Group Container** - The entire group box itself

## Droppable Targets (5 types)
1. **Ungrouped Idea** - Another idea card not in a group
2. **Grouped Idea** - An idea card inside a group
3. **Group Container** - The group box border/header (empty or with ideas)
4. **Empty Ungrouped Zone** - The empty space in a column
5. **Group Itself** (if groups are draggable) - Another group container

---

## Complete Matrix (18 combinations)

### Ideas (Dragging individual cards)

| # | DRAG SOURCE | DROP TARGET | EXPECTED BEHAVIOR | CURRENT STATUS | UI FEEDBACK |
|---|-------------|-------------|-------------------|----------------|-------------|
| 1 | Ungrouped Idea | Ungrouped Idea (different, same category) | Create new group with both ideas in this category | ✅ WORKS | Gradient glow + "Will create group" |
| 2 | Ungrouped Idea | Ungrouped Idea (different, diff category) | Create new group with both ideas in source's category | ✅ WORKS | Gradient glow + "Will create group" |
| 3 | Ungrouped Idea | Ungrouped Idea (same) | No-op (can't drag onto self) | ✅ WORKS | No indicator shown |
| 4 | Ungrouped Idea | Grouped Idea | Add ungrouped to that group (preserves its categoryId) | ✅ WORKS | Blue ring + "Will join this group" |
| 5 | Ungrouped Idea | Group Container | Add ungrouped to that group (preserves its categoryId) | ✅ WORKS | Blue ring on group + ghost "Will add here" |
| 6 | Ungrouped Idea | Empty Ungrouped Zone (same category) | No-op (already ungrouped in this category) | ✅ WORKS | Shows "Drop ideas here" + no highlight |
| 7 | Ungrouped Idea | Empty Ungrouped Zone (diff category) | Change idea's category to target category | ❌ NEEDS IMPL | Should show "Will move to [Category]" |
| 8 | Grouped Idea | Ungrouped Idea | Add ungrouped to source's group (preserves both categoryIds) | ✅ WORKS | Blue ring + "Will join this group" |
| 9 | Grouped Idea | Grouped Idea (same group, different card) | Reorder within group (swap positions) | ❌ NEEDS IMPL | Should show "↕ Reorder" |
| 10 | Grouped Idea | Grouped Idea (same group, same card) | No-op (can't drag onto self) | ✅ WORKS | No indicator |
| 11 | Grouped Idea | Grouped Idea (different group) | Move from source to target group (auto-delete source if empty) | ✅ WORKS | Blue ring + "Will move to this group" |
| 12 | Grouped Idea | Group Container (same) | Move to end of same group (reorder) | ❌ NEEDS IMPL | Should show "↕ Move to end" |
| 13 | Grouped Idea | Group Container (different) | Move to that group (auto-delete source if empty) | ✅ WORKS | Blue ring + ghost "Will add here" |
| 14 | Grouped Idea | Empty Ungrouped Zone (any category) | Ungroup (remove from group, preserves categoryId) | ✅ WORKS | Shows "Drop here to ungroup" |

### Groups (Dragging entire group containers)

| # | DRAG SOURCE | DROP TARGET | EXPECTED BEHAVIOR | CURRENT STATUS | UI FEEDBACK |
|---|-------------|-------------|-------------------|----------------|-------------|
| 15 | Group Container | Empty Space (same category) | Reorder groups within category | ❌ NEEDS IMPL | Visual: swap animation |
| 16 | Group Container | Empty Ungrouped Zone (diff category) | Move entire group to new category (changes group.categoryId) | ❌ NEEDS IMPL | "→ Move to [Category]" |
| 17 | Group Container | Another Group | Merge all ideas into target group, delete source | ❌ NEEDS IMPL | "⚡ Merge groups" |
| 18 | Group Container | Ungrouped Idea | Add that idea to this group | ❌ NEEDS IMPL | "Will add [idea] to group" |

---

## Implementation Plan (Deterministic Coverage)

### ✅ COMPLETED (10/18)
- #1, #2: Create groups from ungrouped ideas ✅
- #3, #10: No-op for dragging onto self ✅
- #4, #5: Join existing groups ✅
- #6: No-op for same category ungrouped zone ✅
- #8: Add ungrouped to grouped idea's group ✅
- #11, #13: Move between different groups ✅
- #14: Ungroup ideas ✅

### 🔴 PRIORITY 1: Make Groups Draggable (4 cases)
- #15: Reorder groups within same category
- #16: Move group to different category
- #17: Merge groups together
- #18: Add ungrouped idea to group by dragging group onto it

**Implementation Strategy:**
- Add drag handle icon to group header (⋮⋮ or ⠿)
- Only the drag handle makes group draggable (not entire header - prevents conflicts)
- Group drag uses different sortable ID namespace: `group-${id}` vs idea IDs
- Clear visual: dragging group shows all cards in overlay

### 🟡 PRIORITY 2: Reordering Within Groups (2 cases)
- #9: Reorder by dropping on different card in same group
- #12: Reorder by dropping on same group container

**Implementation Strategy:**
- Detect `activeIdea.groupId === overIdea.groupId`
- Use `order` field to swap positions
- Visual: Show "↕ Reorder" indicator
- Animate swap using Framer Motion

### 🟢 PRIORITY 3: Invalid Drop Feedback
- Show red X or strike-through for invalid drops
- Toast notification for "Group is full"
- Gray out drop zones that can't accept the dragged item

### 🔵 PRIORITY 4: Cross-Category Moves (#7)
- #7: Allow ungrouped ideas to change categories
- Visual: "→ Move to [Category Name]"
- Update `idea.categoryId` in database

---

## Visual Feedback Status

| Scenario | Visual Indicator | Status |
|----------|------------------|--------|
| Both ungrouped → Create | Gradient glow + "Will create group" | ✅ |
| Ungrouped → Grouped | Blue ring + "Will join this group" | ✅ |
| Grouped → Ungrouped | Blue ring + "Will join this group" | ✅ |
| Grouped → Grouped (diff) | Blue ring + "Will move to this group" | ✅ |
| Grouped → Grouped (same) | No indicator | ⚠️ Should show "Can't drop here"? |
| Any → Group container | Blue ring + ghost placeholder | ✅ |
| Grouped → Ungrouped zone | "Drop here to ungroup" | ✅ |
| Ungrouped → Ungrouped zone | "Drop ideas here" | ✅ |
| Groups as drag source | N/A | ❌ Not implemented |

---

## Recommendations

### Priority 1: Fix Reordering Within Groups (#7, #9)
```typescript
// In handleDragEnd, detect same group:
if (activeIdea.groupId && overIdea.groupId && activeIdea.groupId === overIdea.groupId) {
  // Reorder within the group
  // Update order field for both ideas
}
```

### Priority 2: Make Groups Draggable (#12-15)
```typescript
// In DroppableGroup, add useSortable:
const { attributes, listeners, setNodeRef, transform } = useSortable({
  id: group.id,
  data: { type: "group", group }
});

// In handleDragEnd, detect group drag:
if (activeData?.type === "group") {
  // Handle group reordering or merging
}
```

### Priority 3: Decide on Cross-Category Moves (#5)
Do we want ungrouped ideas to be able to change categories by dropping in another column's ungrouped zone?
- Pros: More flexible, intuitive
- Cons: Could be accidental, changes semantic meaning

---

## Test Cases Needed

1. ✅ Drag ungrouped from Col A to ungrouped in Col C → Create group
2. ✅ Drag ungrouped from Col A to grouped in Col C → Join that group
3. ✅ Drag grouped from Col A to ungrouped in Col C → Pull ungrouped into group
4. ✅ Drag grouped from Col A to grouped in Col B (diff group) → Move between groups
5. ❌ Drag grouped idea onto another card in SAME group → Should reorder
6. ❌ Drag group header/container to new position → Should reorder groups
7. ✅ Drag grouped to empty ungrouped zone → Ungroup
8. ✅ Drop on group container vs group idea → Both should work (they do)

---

## Silent Failures to Fix

Current "silent fails" that should have feedback:
1. ✅ Fixed: Dropping ungrouped on grouped in different column (now works!)
2. ✅ Fixed: All cross-category operations (now work!)
3. ⚠️ Needs feedback: Dropping grouped card on same group (should show "already in group" or allow reorder)
4. ⚠️ Needs feedback: Group is full (shows console.warn but no user-visible feedback)
