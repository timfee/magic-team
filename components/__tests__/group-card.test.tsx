import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GroupCard } from "../group-card";
import type { IdeaGroupWithDetails } from "@/lib/types/session";

const createMockGroup = (
  id: string,
  title: string,
  ideaCount: number,
  voteCount: number,
): IdeaGroupWithDetails => ({
  id,
  sessionId: "session-1",
  categoryId: "cat-1",
  title,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ideas: Array.from({ length: ideaCount }, (_, i) => ({
    id: `idea-${i}`,
    sessionId: "session-1",
    categoryId: "cat-1",
    content: `Idea ${i}`,
    isAnonymous: false,
    order: i,
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: null,
    group: null,
    comments: [],
    votes: [],
    _count: {
      votes: 0,
      comments: 0,
    },
  })),
  comments: [],
  votes: [],
  _count: {
    ideas: ideaCount,
    votes: voteCount,
    comments: 0,
  },
});

describe("GroupCard", () => {
  it("should render group title", () => {
    const group = createMockGroup("1", "Great Ideas", 3, 5);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.getByText("Great Ideas")).toBeInTheDocument();
  });

  it("should show 'Untitled Group' when title is missing", () => {
    const group = createMockGroup("1", "", 3, 5);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.getByText("Untitled Group")).toBeInTheDocument();
  });

  it("should display idea count", () => {
    const group = createMockGroup("1", "Test Group", 5, 0);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.getByText("5 ideas")).toBeInTheDocument();
  });

  it("should use singular 'idea' for count of 1", () => {
    const group = createMockGroup("1", "Test Group", 1, 0);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.getByText("1 idea")).toBeInTheDocument();
  });

  it("should show vote count when showVotes is true and votes exist", () => {
    const group = createMockGroup("1", "Test Group", 3, 7);
    
    const { container } = render(
      <GroupCard group={group} categoryColor="#3b82f6" showVotes={true} />,
    );
    
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(container.querySelector(".text-red-600")).toBeInTheDocument();
  });

  it("should not show vote count when showVotes is false", () => {
    const group = createMockGroup("1", "Test Group", 3, 7);
    
    render(
      <GroupCard group={group} categoryColor="#3b82f6" showVotes={false} />,
    );
    
    expect(screen.queryByText("7")).not.toBeInTheDocument();
  });

  it("should not show vote count when votes are 0", () => {
    const group = createMockGroup("1", "Test Group", 3, 0);
    
    render(
      <GroupCard group={group} categoryColor="#3b82f6" showVotes={true} />,
    );
    
    const voteElements = screen.queryByText("0");
    expect(voteElements).not.toBeInTheDocument();
  });

  it("should apply category color as left border", () => {
    const group = createMockGroup("1", "Test Group", 3, 0);
    
    const { container } = render(
      <GroupCard group={group} categoryColor="#ff0000" />,
    );
    
    const card = container.querySelector('[data-testid="group-card"]');
    expect(card).toHaveStyle({
      borderLeftWidth: "3px",
      borderLeftColor: "#ff0000",
    });
  });

  it("should show idea preview for first 2 ideas", () => {
    const group = createMockGroup("1", "Test Group", 5, 0);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.getByText(/Idea 0/)).toBeInTheDocument();
    expect(screen.getByText(/Idea 1/)).toBeInTheDocument();
  });

  it("should show '+X more...' when more than 2 ideas", () => {
    const group = createMockGroup("1", "Test Group", 5, 0);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.getByText("+3 more...")).toBeInTheDocument();
  });

  it("should not show '+X more...' when exactly 2 ideas", () => {
    const group = createMockGroup("1", "Test Group", 2, 0);
    
    render(<GroupCard group={group} categoryColor="#3b82f6" />);
    
    expect(screen.queryByText(/more\.\.\./)).not.toBeInTheDocument();
  });
});
