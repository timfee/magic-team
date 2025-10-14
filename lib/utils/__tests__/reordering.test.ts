import { describe, it, expect } from "vitest";
import type { IdeaWithDetails } from "@/lib/types/session";

// Helper to calculate new order for reordering within same context
const calculateNewOrder = (
  activeIdea: IdeaWithDetails,
  overIdea: IdeaWithDetails,
  ideas: IdeaWithDetails[],
): number => {
  // Get all ideas in the same context (same groupId or both ungrouped)
  const contextIdeas = ideas
    .filter((i) => i.groupId === overIdea.groupId && i.categoryId === overIdea.categoryId)
    .sort((a, b) => a.order - b.order);

  const overIndex = contextIdeas.findIndex((i) => i.id === overIdea.id);
  const activeIndex = contextIdeas.findIndex((i) => i.id === activeIdea.id);

  if (overIndex === -1) return overIdea.order;

  // Moving down (active before over)
  if (activeIndex < overIndex) {
    // Place after overIdea
    if (overIndex === contextIdeas.length - 1) {
      return contextIdeas[overIndex].order + 1;
    }
    return (contextIdeas[overIndex].order + contextIdeas[overIndex + 1].order) / 2;
  }

  // Moving up (active after over)
  if (overIndex === 0) {
    return contextIdeas[0].order - 1;
  }
  return (contextIdeas[overIndex - 1].order + contextIdeas[overIndex].order) / 2;
};

// Mock idea factory
const createMockIdea = (partial: Partial<IdeaWithDetails>): IdeaWithDetails => ({
  id: partial.id ?? "idea-1",
  sessionId: partial.sessionId ?? "session-1",
  categoryId: partial.categoryId ?? "category-1",
  content: partial.content ?? "Test idea",
  isAnonymous: partial.isAnonymous ?? false,
  groupId: partial.groupId ?? null,
  order: partial.order ?? 0,
  isSelected: partial.isSelected ?? false,
  createdAt: partial.createdAt ?? new Date(),
  updatedAt: partial.updatedAt ?? new Date(),
  author: partial.author ?? null,
  group: partial.group ?? null,
  comments: partial.comments ?? [],
  votes: partial.votes ?? [],
  _count: partial._count ?? { votes: 0, comments: 0 },
});

describe("Reordering Logic", () => {
  describe("calculateNewOrder - Ungrouped Ideas (Same Category)", () => {
    it("should place idea after target when moving down", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 2, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[2], ideas);

      // Should place between idea-2 (order 1) and idea-3 (order 2)
      // But since we're moving to idea-3 and it's last, should be after it
      expect(newOrder).toBe(3); // order 2 + 1
    });

    it("should place idea between targets when moving down to middle", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 2, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 4, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      // Should place between idea-2 (order 2) and idea-3 (order 4)
      expect(newOrder).toBe(3); // (2 + 4) / 2
    });

    it("should place idea before first when moving up to top", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 2, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[2], ideas[0], ideas);

      // Should place before idea-1 (order 0)
      expect(newOrder).toBe(-1); // 0 - 1
    });

    it("should place idea between targets when moving up to middle", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 2, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 4, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[2], ideas[1], ideas);

      // Should place between idea-1 (order 0) and idea-2 (order 2)
      expect(newOrder).toBe(1); // (0 + 2) / 2
    });

    it("should only consider ideas in same category", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: null, categoryId: "cat-2" }), // Different category
        createMockIdea({ id: "3", order: 2, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[2], ideas);

      // Should ignore idea-2 (different category)
      expect(newOrder).toBe(3); // After idea-3
    });

    it("should handle single idea in context", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: "group-1", categoryId: "cat-1" }), // In group
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[0], ideas);

      // Only one idea in ungrouped zone - should return same order
      expect(newOrder).toBe(0);
    });
  });

  describe("calculateNewOrder - Grouped Ideas (Same Group)", () => {
    it("should reorder within same group - move down", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 2, groupId: "group-1", categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[2], ideas);

      expect(newOrder).toBe(3); // After last idea
    });

    it("should reorder within same group - move up", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 2, groupId: "group-1", categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[2], ideas[0], ideas);

      expect(newOrder).toBe(-1); // Before first idea
    });

    it("should only consider ideas in same group", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: "group-2", categoryId: "cat-1" }), // Different group
        createMockIdea({ id: "3", order: 2, groupId: "group-1", categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[2], ideas);

      // Should ignore idea-2 (different group)
      expect(newOrder).toBe(3);
    });

    it("should handle fractional orders correctly", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 0.5, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 1, groupId: "group-1", categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      // Should place between 0.5 and 1
      expect(newOrder).toBe(0.75); // (0.5 + 1) / 2
    });
  });

  describe("calculateNewOrder - Edge Cases", () => {
    it("should handle two-item reordering", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      expect(newOrder).toBe(2); // After second idea
    });

    it("should handle negative orders", () => {
      const ideas = [
        createMockIdea({ id: "1", order: -2, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: -1, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 0, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[2], ideas[0], ideas);

      expect(newOrder).toBe(-3); // Before first idea (-2 - 1)
    });

    it("should return target order if target not found in context", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: "group-1", categoryId: "cat-1" }),
      ];

      // Try to get order for target in different context
      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      expect(newOrder).toBe(1); // Returns target order
    });

    it("should handle large order numbers", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 1000, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 2000, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 3000, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      expect(newOrder).toBe(2500); // (2000 + 3000) / 2
    });

    it("should handle very close fractional orders", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 0.000001, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 0.000002, groupId: null, categoryId: "cat-1" }),
      ];

      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      expect(newOrder).toBeGreaterThan(0.000001);
      expect(newOrder).toBeLessThan(0.000002);
    });
  });

  describe("Reordering Scenarios - Integration", () => {
    it("should handle reordering in mixed context (some grouped, some not)", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 2, groupId: "group-1", categoryId: "cat-1" }),
        createMockIdea({ id: "4", order: 3, groupId: "group-1", categoryId: "cat-1" }),
      ];

      // Reorder ungrouped ideas (should ignore grouped ones)
      const newOrder = calculateNewOrder(ideas[0], ideas[1], ideas);

      // Should place after idea-2, ignoring grouped ideas
      expect(newOrder).toBe(2);
    });

    it("should maintain sort order after multiple reorderings", () => {
      const ideas = [
        createMockIdea({ id: "1", order: 0, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "2", order: 1, groupId: null, categoryId: "cat-1" }),
        createMockIdea({ id: "3", order: 2, groupId: null, categoryId: "cat-1" }),
      ];

      // Move idea-1 after idea-3
      const order1 = calculateNewOrder(ideas[0], ideas[2], ideas);
      ideas[0] = { ...ideas[0], order: order1 };

      // Move idea-2 to top
      const order2 = calculateNewOrder(ideas[1], ideas[0], ideas);
      ideas[1] = { ...ideas[1], order: order2 };

      // Sort and verify
      const sorted = ideas.slice().sort((a, b) => a.order - b.order);

      // After these operations: idea-2 should be first, then idea-3, then idea-1
      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("3");
      expect(sorted[2].id).toBe("1");
    });
  });
});
