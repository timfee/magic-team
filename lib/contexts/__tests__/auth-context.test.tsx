import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth-context";
import type { User } from "firebase/auth";

// Mock Firebase Auth
vi.mock("@/lib/firebase/client", () => ({ auth: {} }));

const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (
    auth: unknown,
    callback: (user: User | null) => void,
  ): (() => void) => {
    const result: unknown = mockOnAuthStateChanged(auth, callback);
    return typeof result === "function" ?
        (result as () => void)
      : () => {
          // Mock unsubscribe function
        };
  },
  signInWithPopup: (auth: unknown, provider: unknown): Promise<unknown> => {
    const result: unknown = mockSignInWithPopup(auth, provider);
    return result instanceof Promise ? result : (
        Promise.resolve(undefined as unknown)
      );
  },
  signOut: (auth: unknown): Promise<void> => {
    const result: unknown = mockSignOut(auth);
    return result instanceof Promise ? result : Promise.resolve();
  },
  GoogleAuthProvider: vi.fn(),
}));

// Test component that uses useAuth
function TestComponent() {
  const { user, userId, userEmail, userName, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-status">
        {user ? "Authenticated" : "Not authenticated"}
      </div>
      <div data-testid="user-id">{userId ?? "No user ID"}</div>
      <div data-testid="user-email">{userEmail ?? "No email"}</div>
      <div data-testid="user-name">{userName ?? "No name"}</div>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide loading state initially", () => {
    mockOnAuthStateChanged.mockImplementation(() => {
      // Don't call callback immediately to simulate loading
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should provide user data when authenticated", async () => {
    const mockUser: Partial<User> = {
      uid: "user-123",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: "https://example.com/photo.jpg",
    };

    mockOnAuthStateChanged.mockImplementation(
      (_auth, callback: (user: User | null) => void) => {
        callback(mockUser as User);
        return vi.fn();
      },
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent(
        "Authenticated",
      );
      expect(screen.getByTestId("user-id")).toHaveTextContent("user-123");
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      );
      expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    });
  });

  it("should provide null user when not authenticated", async () => {
    mockOnAuthStateChanged.mockImplementation(
      (_auth, callback: (user: User | null) => void) => {
        callback(null);
        return vi.fn();
      },
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent(
        "Not authenticated",
      );
      expect(screen.getByTestId("user-id")).toHaveTextContent("No user ID");
      expect(screen.getByTestId("user-email")).toHaveTextContent("No email");
      expect(screen.getByTestId("user-name")).toHaveTextContent("No name");
    });
  });

  it("should throw error when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // Intentionally empty - suppressing console.error for this test
    });

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });
});
