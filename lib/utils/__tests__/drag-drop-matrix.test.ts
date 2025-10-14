import { describe, it, expect } from "vitest";
import {
  getDropAction,
  isValidDragDropState,
  isNullish,
  getDropActionDescription,
  type DragDropState,
  type DropAction,
} from "../drag-drop-matrix";

describe("DRAG_DROP_MATRIX - Critical State Machine", () => {
  describe("getDropAction - Core State Matrix", () => {
    describe("SELF-DROP: Can't drop on self", () => {
      it("should return null when dropping on the same idea (both ungrouped)", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: null,
          targetId: "idea-1",
          targetGroupId: null,
        };

        expect(getDropAction(state)).toBeNull();
      });

      it("should return null when dropping on the same idea (both grouped)", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group-A",
          targetId: "idea-1",
          targetGroupId: "group-A",
        };

        expect(getDropAction(state)).toBeNull();
      });

      it("should return null even with undefined group IDs", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: undefined,
          targetId: "idea-1",
          targetGroupId: undefined,
        };

        expect(getDropAction(state)).toBeNull();
      });
    });

    describe("CREATE-GROUP: Both ideas ungrouped", () => {
      it("should create group when both ideas have null groupId", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: null,
          targetId: "idea-2",
          targetGroupId: null,
        };

        expect(getDropAction(state)).toBe("create-group");
      });

      it("should create group when both ideas have undefined groupId", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: undefined,
          targetId: "idea-2",
          targetGroupId: undefined,
        };

        expect(getDropAction(state)).toBe("create-group");
      });

      it("should create group when mixing null and undefined groupIds", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: null,
          targetId: "idea-2",
          targetGroupId: undefined,
        };

        expect(getDropAction(state)).toBe("create-group");
      });

      it("should handle empty string as falsy (ungrouped)", () => {
        // Empty string is falsy in boolean context, so treated as ungrouped
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "",
          targetId: "idea-2",
          targetGroupId: null,
        };

        // Empty string is falsy, so this is create-group
        expect(getDropAction(state)).toBe("create-group");
      });
    });

    describe("JOIN-GROUP: Target is grouped, active is not", () => {
      it("should join group when target has groupId and active does not", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: null,
          targetId: "idea-2",
          targetGroupId: "group-A",
        };

        expect(getDropAction(state)).toBe("join-group");
      });

      it("should join group with undefined active groupId", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: undefined,
          targetId: "idea-2",
          targetGroupId: "group-B",
        };

        expect(getDropAction(state)).toBe("join-group");
      });

      it("should join group regardless of group ID format", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: null,
          targetId: "idea-2",
          targetGroupId: "group-with-uuid-12345-67890",
        };

        expect(getDropAction(state)).toBe("join-group");
      });
    });

    describe("JOIN-GROUP: Active is grouped, target is not", () => {
      it("should join group when active has groupId and target does not", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group-A",
          targetId: "idea-2",
          targetGroupId: null,
        };

        expect(getDropAction(state)).toBe("join-group");
      });

      it("should join group with undefined target groupId", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group-C",
          targetId: "idea-2",
          targetGroupId: undefined,
        };

        expect(getDropAction(state)).toBe("join-group");
      });
    });

    describe("MOVE-TO-GROUP: Both grouped, different groups", () => {
      it("should move to group when both have different groupIds", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group-A",
          targetId: "idea-2",
          targetGroupId: "group-B",
        };

        expect(getDropAction(state)).toBe("move-to-group");
      });

      it("should move even with very similar group IDs", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group-1",
          targetId: "idea-2",
          targetGroupId: "group-2",
        };

        expect(getDropAction(state)).toBe("move-to-group");
      });

      it("should handle UUID-based group IDs", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "550e8400-e29b-41d4-a716-446655440000",
          targetId: "idea-2",
          targetGroupId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        };

        expect(getDropAction(state)).toBe("move-to-group");
      });

      it("should be case-sensitive for group IDs", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "GROUP-A",
          targetId: "idea-2",
          targetGroupId: "group-a",
        };

        expect(getDropAction(state)).toBe("move-to-group");
      });
    });

    describe("NO-ACTION: Both grouped, same group", () => {
      it("should return null when both ideas are in the same group", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group-A",
          targetId: "idea-2",
          targetGroupId: "group-A",
        };

        expect(getDropAction(state)).toBeNull();
      });

      it("should return null for identical complex group IDs", () => {
        const groupId = "group-550e8400-e29b-41d4-a716-446655440000";
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: groupId,
          targetId: "idea-2",
          targetGroupId: groupId,
        };

        expect(getDropAction(state)).toBeNull();
      });

      it("should handle whitespace in group IDs", () => {
        const state: DragDropState = {
          activeId: "idea-1",
          activeGroupId: "group A",
          targetId: "idea-2",
          targetGroupId: "group A",
        };

        expect(getDropAction(state)).toBeNull();
      });
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle empty string IDs (treated as ungrouped)", () => {
      const state: DragDropState = {
        activeId: "idea-1",
        activeGroupId: "",
        targetId: "idea-2",
        targetGroupId: "",
      };

      // Empty strings are falsy, so both are ungrouped → create group
      expect(getDropAction(state)).toBe("create-group");
    });

    it("should handle very long group IDs", () => {
      const longId = "a".repeat(1000);
      const state: DragDropState = {
        activeId: "idea-1",
        activeGroupId: longId,
        targetId: "idea-2",
        targetGroupId: longId,
      };

      expect(getDropAction(state)).toBeNull();
    });

    it("should handle special characters in group IDs", () => {
      const state: DragDropState = {
        activeId: "idea-1",
        activeGroupId: "group-!@#$%^&*()",
        targetId: "idea-2",
        targetGroupId: "group-!@#$%^&*()",
      };

      expect(getDropAction(state)).toBeNull();
    });

    it("should handle numeric string IDs", () => {
      const state: DragDropState = {
        activeId: "1",
        activeGroupId: "123",
        targetId: "2",
        targetGroupId: "456",
      };

      expect(getDropAction(state)).toBe("move-to-group");
    });

    it("should handle unicode characters in IDs", () => {
      const state: DragDropState = {
        activeId: "idea-\u{1F680}",
        activeGroupId: "group-\u{1F4A1}",
        targetId: "idea-\u{1F389}",
        targetGroupId: "group-\u{1F4A1}",
      };

      expect(getDropAction(state)).toBeNull();
    });
  });

  describe("State Transition Matrix - Complete Coverage", () => {
    it("should have deterministic behavior for all state combinations", () => {
      const testCases: Array<{
        name: string;
        state: DragDropState;
        expected: DropAction;
      }> = [
        // Self drops
        {
          name: "Self drop ungrouped",
          state: {
            activeId: "A",
            activeGroupId: null,
            targetId: "A",
            targetGroupId: null,
          },
          expected: null,
        },
        {
          name: "Self drop grouped",
          state: {
            activeId: "A",
            activeGroupId: "G1",
            targetId: "A",
            targetGroupId: "G1",
          },
          expected: null,
        },
        // Create group scenarios
        {
          name: "Both ungrouped (null)",
          state: {
            activeId: "A",
            activeGroupId: null,
            targetId: "B",
            targetGroupId: null,
          },
          expected: "create-group",
        },
        {
          name: "Both ungrouped (undefined)",
          state: {
            activeId: "A",
            activeGroupId: undefined,
            targetId: "B",
            targetGroupId: undefined,
          },
          expected: "create-group",
        },
        // Join group scenarios
        {
          name: "Active null, target grouped",
          state: {
            activeId: "A",
            activeGroupId: null,
            targetId: "B",
            targetGroupId: "G1",
          },
          expected: "join-group",
        },
        {
          name: "Active grouped, target null",
          state: {
            activeId: "A",
            activeGroupId: "G1",
            targetId: "B",
            targetGroupId: null,
          },
          expected: "join-group",
        },
        // Move between groups
        {
          name: "Different groups",
          state: {
            activeId: "A",
            activeGroupId: "G1",
            targetId: "B",
            targetGroupId: "G2",
          },
          expected: "move-to-group",
        },
        // Same group (no action)
        {
          name: "Same group",
          state: {
            activeId: "A",
            activeGroupId: "G1",
            targetId: "B",
            targetGroupId: "G1",
          },
          expected: null,
        },
      ];

      testCases.forEach(({ name, state, expected }) => {
        expect(getDropAction(state), `Failed: ${name}`).toBe(expected);
      });
    });
  });

  describe("isValidDragDropState", () => {
    it("should validate complete valid state", () => {
      const state: DragDropState = {
        activeId: "idea-1",
        activeGroupId: "group-A",
        targetId: "idea-2",
        targetGroupId: "group-B",
      };

      expect(isValidDragDropState(state)).toBe(true);
    });

    it("should accept null groupIds", () => {
      const state: DragDropState = {
        activeId: "idea-1",
        activeGroupId: null,
        targetId: "idea-2",
        targetGroupId: null,
      };

      expect(isValidDragDropState(state)).toBe(true);
    });

    it("should accept undefined groupIds", () => {
      const state: DragDropState = {
        activeId: "idea-1",
        activeGroupId: undefined,
        targetId: "idea-2",
        targetGroupId: undefined,
      };

      expect(isValidDragDropState(state)).toBe(true);
    });

    it("should reject missing activeId", () => {
      const state = {
        targetId: "idea-2",
        activeGroupId: null,
        targetGroupId: null,
      };

      expect(isValidDragDropState(state)).toBe(false);
    });

    it("should reject missing targetId", () => {
      const state = {
        activeId: "idea-1",
        activeGroupId: null,
        targetGroupId: null,
      };

      expect(isValidDragDropState(state)).toBe(false);
    });

    it("should reject empty string activeId", () => {
      const state = {
        activeId: "",
        targetId: "idea-2",
        activeGroupId: null,
        targetGroupId: null,
      };

      expect(isValidDragDropState(state)).toBe(false);
    });

    it("should reject empty string targetId", () => {
      const state = {
        activeId: "idea-1",
        targetId: "",
        activeGroupId: null,
        targetGroupId: null,
      };

      expect(isValidDragDropState(state)).toBe(false);
    });

    it("should reject non-string activeId", () => {
      // Testing runtime validation with invalid type
      const state = {
        activeId: 123,
        targetId: "idea-2",
        activeGroupId: null,
        targetGroupId: null,
      } as never;

      expect(isValidDragDropState(state)).toBe(false);
    });

    it("should reject non-string groupIds", () => {
      // Testing runtime validation with invalid type
      const state = {
        activeId: "idea-1",
        targetId: "idea-2",
        activeGroupId: 123,
        targetGroupId: null,
      } as never;

      expect(isValidDragDropState(state)).toBe(false);
    });
  });

  describe("isNullish", () => {
    it("should return true for null", () => {
      expect(isNullish(null)).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(isNullish(undefined)).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(isNullish("")).toBe(false);
    });

    it("should return false for 0", () => {
      expect(isNullish(0)).toBe(false);
    });

    it("should return false for false", () => {
      expect(isNullish(false)).toBe(false);
    });

    it("should return false for objects", () => {
      expect(isNullish({})).toBe(false);
    });

    it("should return false for arrays", () => {
      expect(isNullish([])).toBe(false);
    });
  });

  describe("getDropActionDescription", () => {
    it("should return description for create-group", () => {
      expect(getDropActionDescription("create-group")).toBe(
        "Will create group",
      );
    });

    it("should return description for join-group", () => {
      expect(getDropActionDescription("join-group")).toBe(
        "Will join this group",
      );
    });

    it("should return description for move-to-group", () => {
      expect(getDropActionDescription("move-to-group")).toBe(
        "Will move to this group",
      );
    });

    it("should return description for null", () => {
      expect(getDropActionDescription(null)).toBe("No action");
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should handle initial grouping workflow", () => {
      // User drags first idea onto second idea
      const step1: DragDropState = {
        activeId: "idea-1",
        activeGroupId: null,
        targetId: "idea-2",
        targetGroupId: null,
      };
      expect(getDropAction(step1)).toBe("create-group");

      // After group is created, both ideas now have groupId "group-1"
      // User tries to drag one onto the other (no-op)
      const step2: DragDropState = {
        activeId: "idea-1",
        activeGroupId: "group-1",
        targetId: "idea-2",
        targetGroupId: "group-1",
      };
      expect(getDropAction(step2)).toBeNull();

      // User drags third idea onto the group
      const step3: DragDropState = {
        activeId: "idea-3",
        activeGroupId: null,
        targetId: "idea-2",
        targetGroupId: "group-1",
      };
      expect(getDropAction(step3)).toBe("join-group");
    });

    it("should handle reorganizing groups", () => {
      // Two separate groups exist
      // User wants to merge: drag idea from group-1 to group-2
      const merge: DragDropState = {
        activeId: "idea-1",
        activeGroupId: "group-1",
        targetId: "idea-5",
        targetGroupId: "group-2",
      };
      expect(getDropAction(merge)).toBe("move-to-group");
    });

    it("should handle ungrouping workflow", () => {
      // User wants to remove idea from group by dragging to ungrouped area
      // This would be handled by dropping on ungrouped-zone, not another idea
      // But if they drop on an ungrouped idea, it joins that idea to their group
      const ungroup: DragDropState = {
        activeId: "idea-grouped",
        activeGroupId: "group-1",
        targetId: "idea-solo",
        targetGroupId: null,
      };
      expect(getDropAction(ungroup)).toBe("join-group");
    });
  });
});
