/**
 * DRAG_DROP_MATRIX - Critical drag and drop state machine logic
 *
 * This matrix determines the action that should be taken when an idea is dropped onto another idea
 * based on the grouping state of both the active (dragged) idea and the target (drop target) idea.
 *
 * State Matrix:
 * | Active State | Target State | Action         | Description                           |
 * |--------------|--------------|----------------|---------------------------------------|
 * | Ungrouped    | Ungrouped    | create-group   | Create new group with both ideas      |
 * | Ungrouped    | Grouped      | join-group     | Add active idea to target's group     |
 * | Grouped      | Ungrouped    | join-group     | Add target idea to active's group     |
 * | Grouped      | Grouped (≠)  | move-to-group  | Move active to target's group         |
 * | Grouped      | Grouped (=)  | null           | No action (same group)                |
 * | Same idea    | Same idea    | null           | No action (can't drop on self)        |
 */

export type DropAction = "create-group" | "join-group" | "move-to-group" | null;

export interface DragDropState {
  activeId: string;
  activeGroupId: string | null | undefined;
  targetId: string;
  targetGroupId: string | null | undefined;
}

/**
 * Determines the drop action based on the state of active and target ideas
 */
export function getDropAction(state: DragDropState): DropAction {
  // Can't drop on self
  if (state.activeId === state.targetId) {
    return null;
  }

  const activeGrouped = !!state.activeGroupId;
  const targetGrouped = !!state.targetGroupId;

  // Both ungrouped → Create new group
  if (!activeGrouped && !targetGrouped) {
    return "create-group";
  }

  // Target grouped, active ungrouped → Join target's group
  if (targetGrouped && !activeGrouped) {
    return "join-group";
  }

  // Active grouped, target ungrouped → Add target to active's group
  if (activeGrouped && !targetGrouped) {
    return "join-group";
  }

  // Both grouped, different groups → Move active to target's group
  if (
    activeGrouped
    && targetGrouped
    && state.activeGroupId !== state.targetGroupId
  ) {
    return "move-to-group";
  }

  // Both grouped, same group → No action
  return null;
}

/**
 * Type guard to check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Validates that a drag-drop state is valid
 */
export function isValidDragDropState(
  state: Partial<DragDropState>,
): state is DragDropState {
  return (
    typeof state.activeId === "string"
    && state.activeId.length > 0
    && typeof state.targetId === "string"
    && state.targetId.length > 0
    && (isNullish(state.activeGroupId)
      || typeof state.activeGroupId === "string")
    && (isNullish(state.targetGroupId)
      || typeof state.targetGroupId === "string")
  );
}

/**
 * Gets a human-readable description of the drop action
 */
export function getDropActionDescription(action: DropAction): string {
  switch (action) {
    case "create-group":
      return "Will create group";
    case "join-group":
      return "Will join this group";
    case "move-to-group":
      return "Will move to this group";
    case null:
      return "No action";
  }
}
