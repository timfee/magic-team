import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoteHeatmap } from "../vote-heatmap";
import type { IdeaWithDetails } from "@/lib/types/session";

const createMockIdea = (
  id: string,
  categoryId: string,
  voteCount: number,
): IdeaWithDetails => ({
  id,
  sessionId: "session-1",
  categoryId,
  content: `Idea ${id}`,
  isAnonymous: false,
  order: 0,
  isSelected: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: null,
  group: null,
  comments: [],
  votes: [],
  _count: {
    votes: voteCount,
    comments: 0,
  },
});

describe("VoteHeatmap", () => {
  const categoryColors = {
    "cat-1": "#3b82f6",
    "cat-2": "#ef4444",
  };

  it("should render empty state when no ideas", () => {
    render(<VoteHeatmap ideas={[]} categoryColors={categoryColors} />);
    
    expect(screen.getByText("No votes yet")).toBeInTheDocument();
  });

  it("should render top ideas", () => {
    const ideas = [
      createMockIdea("1", "cat-1", 10),
      createMockIdea("2", "cat-1", 5),
      createMockIdea("3", "cat-2", 3),
    ];

    const { container } = render(
      <VoteHeatmap ideas={ideas} categoryColors={categoryColors} />,
    );
    
    // Should render heatmap squares
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    expect(squares.length).toBe(3);
  });

  it("should limit to top 10 ideas", () => {
    const ideas = Array.from({ length: 15 }, (_, i) =>
      createMockIdea(`${i}`, "cat-1", 15 - i),
    );

    const { container } = render(
      <VoteHeatmap ideas={ideas} categoryColors={categoryColors} />,
    );
    
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    expect(squares.length).toBe(10);
  });

  it("should sort ideas by vote count", () => {
    const ideas = [
      createMockIdea("1", "cat-1", 3),
      createMockIdea("2", "cat-1", 10),
      createMockIdea("3", "cat-2", 7),
    ];

    const { container } = render(
      <VoteHeatmap ideas={ideas} categoryColors={categoryColors} />,
    );
    
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    
    // First square should have highest opacity (most votes)
    const firstSquare = squares[0] as HTMLElement;
    const lastSquare = squares[2] as HTMLElement;
    
    const firstOpacity = parseFloat(firstSquare.style.opacity);
    const lastOpacity = parseFloat(lastSquare.style.opacity);
    
    expect(firstOpacity).toBeGreaterThan(lastOpacity);
  });

  it("should apply category colors", () => {
    const ideas = [
      createMockIdea("1", "cat-1", 5),
      createMockIdea("2", "cat-2", 3),
    ];

    const { container } = render(
      <VoteHeatmap ideas={ideas} categoryColors={categoryColors} />,
    );
    
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    
    const firstSquare = squares[0] as HTMLElement;
    expect(firstSquare.style.backgroundColor).toBe("rgb(59, 130, 246)");
    
    const secondSquare = squares[1] as HTMLElement;
    expect(secondSquare.style.backgroundColor).toBe("rgb(239, 68, 68)");
  });

  it("should show vote count on hover title", () => {
    const ideas = [createMockIdea("1", "cat-1", 5)];

    const { container } = render(
      <VoteHeatmap ideas={ideas} categoryColors={categoryColors} />,
    );
    
    const square = container.querySelector('[class*="aspect-square"]');
    expect(square).toHaveAttribute("title");
    expect(square?.getAttribute("title")).toContain("5 votes");
  });

  it("should display labels", () => {
    const ideas = [createMockIdea("1", "cat-1", 5)];

    render(<VoteHeatmap ideas={ideas} categoryColors={categoryColors} />);
    
    expect(screen.getByText("Top Ideas by Votes")).toBeInTheDocument();
    expect(screen.getByText("Less votes")).toBeInTheDocument();
    expect(screen.getByText("More votes")).toBeInTheDocument();
  });
});
