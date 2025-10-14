import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GreenRoom } from "../green-room";

// Mock the session context
vi.mock("@/lib/contexts/firebase-session-context", () => ({
  useSession: vi.fn(() => ({
    userCount: 5,
    activeUsers: [
      { id: "1", name: "Alice", image: null, lastSeenAt: new Date() },
      { id: "2", name: "Bob", image: null, lastSeenAt: new Date() },
      { id: "3", name: "Charlie", image: null, lastSeenAt: new Date() },
      { id: "4", name: "Diana", image: null, lastSeenAt: new Date() },
      { id: "5", name: "Eve", image: null, lastSeenAt: new Date() },
    ],
  })),
}));

// Mock AnimatedFacepile
vi.mock("@/components/ui/animated-facepile", () => ({
  AnimatedFacepile: ({ users }: { users: unknown[] }) => (
    <div data-testid="animated-facepile">
      {users.length} users
    </div>
  ),
}));

describe("GreenRoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should render green room title", () => {
    render(
      <GreenRoom sessionId="test-session" initialUserCount={5} />
    );

    expect(screen.getByText("Green Room")).toBeInTheDocument();
  });

  it("should display participant count correctly", () => {
    render(
      <GreenRoom sessionId="test-session" initialUserCount={5} />
    );

    expect(screen.getByText(/5 participants ready/i)).toBeInTheDocument();
  });

  it("should show singular text for one participant", async () => {
    // Temporarily override the mock
    const { useSession } = await import("@/lib/contexts/firebase-session-context");
    vi.mocked(useSession).mockReturnValueOnce({
      userCount: 1,
      activeUsers: [
        { id: "1", name: "Alice", image: null, lastSeenAt: new Date() },
      ],
    } as never);

    render(
      <GreenRoom sessionId="test-session" initialUserCount={1} />
    );

    expect(
      screen.getByText("You're the first one here!")
    ).toBeInTheDocument();
  });

  it("should render animated facepile", () => {
    render(
      <GreenRoom sessionId="test-session" initialUserCount={5} />
    );

    expect(screen.getByTestId("animated-facepile")).toBeInTheDocument();
    expect(screen.getByText("5 users")).toBeInTheDocument();
  });

  it("should display waiting message", () => {
    render(
      <GreenRoom sessionId="test-session" initialUserCount={5} />
    );

    expect(
      screen.getByText(/Waiting for the facilitator to start the session/i)
    ).toBeInTheDocument();
  });

  it("should show timer when startTime is provided", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const futureTime = new Date("2024-01-01T12:02:00Z"); // 2 minutes from now

    render(
      <GreenRoom
        sessionId="test-session"
        initialUserCount={5}
        startTime={futureTime}
      />
    );

    expect(screen.getByText(/Time until start:/i)).toBeInTheDocument();
    // Should show minutes and seconds
    expect(screen.getByText(/2m 0s/)).toBeInTheDocument();
  });

  it("should update timer countdown", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const futureTime = new Date("2024-01-01T12:00:05Z"); // 5 seconds from now

    render(
      <GreenRoom
        sessionId="test-session"
        initialUserCount={5}
        startTime={futureTime}
      />
    );

    expect(screen.getByText(/Time until start:/i)).toBeInTheDocument();
    // Initially shows 5 seconds
    expect(screen.getByText(/5s/)).toBeInTheDocument();
  });

  it("should show 'Starting now...' when timer expires", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const pastTime = new Date("2024-01-01T11:59:59Z"); // 1 second ago

    render(
      <GreenRoom
        sessionId="test-session"
        initialUserCount={5}
        startTime={pastTime}
      />
    );

    expect(screen.getByText(/Starting now/i)).toBeInTheDocument();
  });

  it("should not show timer when startTime is null", () => {
    render(
      <GreenRoom
        sessionId="test-session"
        initialUserCount={5}
        startTime={null}
      />
    );

    expect(screen.queryByText(/Time until start:/i)).not.toBeInTheDocument();
  });

  it("should render animated waiting dots", () => {
    const { container } = render(
      <GreenRoom sessionId="test-session" initialUserCount={5} />
    );

    // Check for the presence of animated dots
    const dots = container.querySelectorAll(".animate-pulse");
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });
});
