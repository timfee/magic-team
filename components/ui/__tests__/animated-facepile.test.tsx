import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AnimatedFacepile } from "../animated-facepile";

describe("AnimatedFacepile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render nothing when users array is empty", () => {
    const { container } = render(<AnimatedFacepile users={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render user avatars", () => {
    const users = [
      { id: "1", name: "Alice", image: null },
      { id: "2", name: "Bob", image: null },
    ];

    render(<AnimatedFacepile users={users} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("should show remaining count when users exceed maxVisible", () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: `User ${i}`,
      image: null,
    }));

    render(<AnimatedFacepile users={users} maxVisible={5} />);

    // Should show +5 for remaining users
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("should render images when user has image URL", () => {
    const users = [
      { id: "1", name: "Alice", image: "https://example.com/alice.jpg" },
    ];

    render(<AnimatedFacepile users={users} />);

    const img = screen.getByAltText("Alice");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
  });

  it("should apply size classes correctly", () => {
    const users = [{ id: "1", name: "Alice", image: null }];

    const { rerender } = render(<AnimatedFacepile users={users} size="sm" />);
    let container = screen.getByText("A").parentElement;
    expect(container?.className).toContain("h-8");

    rerender(<AnimatedFacepile users={users} size="lg" />);
    container = screen.getByText("A").parentElement;
    expect(container?.className).toContain("h-16");
  });

  it("should detect new users and apply animation classes", async () => {
    const users = [{ id: "1", name: "Alice", image: null }];

    const { rerender } = render(<AnimatedFacepile users={users} />);

    // Add a new user
    const newUsers = [...users, { id: "2", name: "Bob", image: null }];

    act(() => {
      rerender(<AnimatedFacepile users={newUsers} />);
    });

    // New user should be rendered
    expect(screen.getByText("B")).toBeInTheDocument();

    // Animation class should be removed after timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });

  it("should handle users with no name gracefully", () => {
    const users = [{ id: "1", name: null, image: null }];

    render(<AnimatedFacepile users={users} />);

    expect(screen.getByText("U")).toBeInTheDocument();
  });
});
