import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoteBar } from "../vote-bar";

describe("VoteBar", () => {
  it("should render a progress bar", () => {
    const { container } = render(<VoteBar voteCount={3} maxVotes={10} />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("should calculate correct percentage", () => {
    const { container } = render(<VoteBar voteCount={5} maxVotes={10} />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: "50%" });
  });

  it("should cap percentage at 100%", () => {
    const { container } = render(<VoteBar voteCount={15} maxVotes={10} />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: "100%" });
  });

  it("should handle zero max votes", () => {
    const { container } = render(<VoteBar voteCount={5} maxVotes={0} />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: "0%" });
  });

  it("should show label when showLabel is true", () => {
    render(
      <VoteBar
        voteCount={3}
        maxVotes={10}
        showLabel={true}
        label="Test Label"
      />,
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("3 votes")).toBeInTheDocument();
  });

  it("should show singular 'vote' for count of 1", () => {
    render(
      <VoteBar voteCount={1} maxVotes={10} showLabel={true} label="Test" />,
    );

    expect(screen.getByText("1 vote")).toBeInTheDocument();
  });

  it("should not show label when showLabel is false", () => {
    render(
      <VoteBar
        voteCount={3}
        maxVotes={10}
        showLabel={false}
        label="Hidden Label"
      />,
    );

    expect(screen.queryByText("Hidden Label")).not.toBeInTheDocument();
  });

  it("should apply custom color", () => {
    const { container } = render(
      <VoteBar voteCount={3} maxVotes={10} color="#ff0000" />,
    );

    const progressBar = container.querySelector('[style*="background-color"]');
    expect(progressBar).toHaveStyle({ backgroundColor: "#ff0000" });
  });
});
