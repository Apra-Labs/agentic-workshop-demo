import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteList from "../components/NoteList";
import * as api from "../api";

beforeEach(() => {
  vi.restoreAllMocks();
});

const sampleNotes: api.Note[] = [
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
];

describe("NoteList", () => {
  it("shows loading spinner initially", () => {
    vi.spyOn(api, "fetchNotes").mockReturnValue(new Promise(() => {}));
    render(<NoteList />);
    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("renders notes after fetching", async () => {
    vi.spyOn(api, "fetchNotes").mockResolvedValue(sampleNotes);

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("Second Note")).toBeInTheDocument();
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
      expect(screen.getByText("No notes yet. Create one!")).toBeInTheDocument();
    });
  });

  it("shows the new note form when clicking '+ New Note'", async () => {
    vi.spyOn(api, "fetchNotes").mockResolvedValue([]);

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText("+ New Note")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("+ New Note"));

    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();
  });

  it("creates a note and refreshes the list", async () => {
    const fetchSpy = vi.spyOn(api, "fetchNotes")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(sampleNotes);
    vi.spyOn(api, "createNote").mockResolvedValue(sampleNotes[0]);

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText("+ New Note")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("+ New Note"));
    await userEvent.type(screen.getByPlaceholderText("Note title"), "First Note");
    await userEvent.type(screen.getByPlaceholderText("Note content"), "Hello world");
    await userEvent.click(screen.getByText("Create Note"));

    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });

    expect(api.createNote).toHaveBeenCalledWith({
      title: "First Note",
      content: "Hello world",
      tags: [],
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
