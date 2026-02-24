import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import NoteList from "../components/NoteList";
import * as api from "../api";

describe("NoteList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading spinner initially", () => {
    vi.spyOn(api, "fetchNotes").mockReturnValue(new Promise(() => {})); // never resolves
    render(<NoteList />);
    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("renders notes after fetching", async () => {
    vi.spyOn(api, "fetchNotes").mockResolvedValue([
      {
        id: "1",
        title: "First Note",
        content: "Hello world",
        tags: ["greeting"],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "Second Note",
        content: "Goodbye world",
        tags: [],
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    ]);

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("Second Note")).toBeInTheDocument();
    expect(screen.getByText("Goodbye world")).toBeInTheDocument();
    expect(screen.getByText("greeting")).toBeInTheDocument();
  });

  it("shows error message on fetch failure", async () => {
    vi.spyOn(api, "fetchNotes").mockRejectedValue(
      new Error("Failed to fetch notes: 500 Internal Server Error")
    );

    render(<NoteList />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch notes: 500 Internal Server Error")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no notes exist", async () => {
    vi.spyOn(api, "fetchNotes").mockResolvedValue([]);

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText("No notes yet.")).toBeInTheDocument();
    });
  });
});
