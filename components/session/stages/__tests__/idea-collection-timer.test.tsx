import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { IdeaCollection } from "../idea-collection";

// Mock dependencies
vi.mock("@/lib/contexts/firebase-session-context", () => ({
  useSession: vi.fn(() => ({ ideas: [] })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

vi.mock("@/components/idea-card", () => ({
  IdeaCard: () => <div>Idea Card</div>,
}));

vi.mock("@/lib/firebase/client", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

const mockCategories = [
  {
    id: "cat-1",
    sessionId: "session-1",
    name: "What went well",
    color: "#10b981",
    order: 0,
  },
  {
    id: "cat-2",
    sessionId: "session-1",
    name: "What to improve",
    color: "#f59e0b",
    order: 1,
  },
];

describe("IdeaCollection Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should not show timer when timerEnd is not provided", () => {
    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
      />,
    );

    expect(screen.queryByText(/\d+m \d+s/)).not.toBeInTheDocument();
  });

  it("should show timer countdown when timerEnd is provided", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const futureTime = new Date("2024-01-01T12:02:00Z"); // 2 minutes from now

    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={futureTime}
      />,
    );

    expect(screen.getByText(/2m 0s/)).toBeInTheDocument();
  });

  it("should show seconds only when less than a minute remains", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const futureTime = new Date("2024-01-01T12:00:30Z"); // 30 seconds from now

    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={futureTime}
      />,
    );

    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it("should update timer countdown over time", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const futureTime = new Date("2024-01-01T12:00:10Z"); // 10 seconds from now

    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={futureTime}
      />,
    );

    expect(screen.getByText(/10s/)).toBeInTheDocument();
  });

  it("should show 'Time's up!' when timer expires", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const pastTime = new Date("2024-01-01T11:59:59Z"); // 1 second ago

    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={pastTime}
      />,
    );

    expect(screen.getByText("Time's up!")).toBeInTheDocument();
  });

  it("should disable submit button when timer expires", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const pastTime = new Date("2024-01-01T11:59:59Z"); // 1 second ago

    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={pastTime}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Submit Idea/i });
    expect(submitButton).toBeDisabled();
  });

  it("should show expired message when timer ends", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const pastTime = new Date("2024-01-01T11:59:59Z"); // 1 second ago

    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={pastTime}
      />,
    );

    expect(
      screen.getByText(/Time for idea collection has ended/i),
    ).toBeInTheDocument();
  });

  it("should disable submissions when submissionsEnabled is false", () => {
    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        submissionsEnabled={false}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Submit Idea/i });
    expect(submitButton).toBeDisabled();
  });

  it("should show disabled message when submissions are disabled", () => {
    render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        submissionsEnabled={false}
      />,
    );

    expect(
      screen.getByText(
        /Idea submissions have been disabled by the facilitator/i,
      ),
    ).toBeInTheDocument();
  });

  it("should apply timer color styling correctly", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const futureTime = new Date("2024-01-01T12:01:00Z"); // 1 minute from now

    const { container } = render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={futureTime}
      />,
    );

    const timerElement = container.querySelector(".bg-blue-100");
    expect(timerElement).toBeInTheDocument();
  });

  it("should apply expired timer color styling", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const pastTime = new Date("2024-01-01T11:59:59Z"); // 1 second ago

    const { container } = render(
      <IdeaCollection
        sessionId="test-session"
        categories={mockCategories}
        initialIdeas={[]}
        userId="user-1"
        timerEnd={pastTime}
      />,
    );

    const timerElement = container.querySelector(".bg-red-100");
    expect(timerElement).toBeInTheDocument();
  });
});
