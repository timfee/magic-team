import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IdeaCard } from "../idea-card";
import type { IdeaWithDetails } from "@/lib/types/session";

// Mock dnd-kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

describe("IdeaCard", () => {
  const mockIdea: IdeaWithDetails = {
    id: "idea-123",
    sessionId: "session-456",
    categoryId: "category-789",
    content: "Test idea content",
    isAnonymous: false,
    order: 0,
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: "user-123", name: "Test User", image: null },
    group: null,
    comments: [],
    votes: [],
    _count: { comments: 0, votes: 0 },
  };

  it("should render idea content", () => {
    render(
      <IdeaCard idea={mockIdea} categoryColor="#ff0000" draggable={false} />,
    );

    expect(screen.getByText("Test idea content")).toBeInTheDocument();
  });

  it("should show author name when not anonymous", () => {
    render(
      <IdeaCard idea={mockIdea} categoryColor="#ff0000" draggable={false} />,
    );

    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("should show 'Anonymous' when idea is anonymous", () => {
    const anonymousIdea = { ...mockIdea, isAnonymous: true, author: null };

    render(
      <IdeaCard
        idea={anonymousIdea}
        categoryColor="#ff0000"
        draggable={false}
      />,
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("should show vote count when votes > 0", () => {
    const ideaWithVotes = { ...mockIdea, _count: { comments: 0, votes: 5 } };

    render(
      <IdeaCard
        idea={ideaWithVotes}
        categoryColor="#ff0000"
        draggable={false}
        showVotes={true}
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should not show vote count when showVotes is false", () => {
    const ideaWithVotes = { ...mockIdea, _count: { comments: 0, votes: 5 } };

    render(
      <IdeaCard
        idea={ideaWithVotes}
        categoryColor="#ff0000"
        draggable={false}
        showVotes={false}
      />,
    );

    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("should show drop indicator when provided", () => {
    render(
      <IdeaCard
        idea={mockIdea}
        categoryColor="#ff0000"
        draggable={false}
        dropIndicator="create-group"
      />,
    );

    expect(screen.getByText("Will create group")).toBeInTheDocument();
  });

  it("should apply category color as left border", () => {
    const { container } = render(
      <IdeaCard idea={mockIdea} categoryColor="#ff0000" draggable={true} />,
    );

    const coloredBorder = container.querySelector('[style*="rgb(255, 0, 0)"]');
    expect(coloredBorder).toBeInTheDocument();
  });
});
