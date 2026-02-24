import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchNotes } from "../api";

describe("fetchNotes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches notes from /api/notes", async () => {
    const mockNotes = [
      {
        id: "1",
        title: "Test Note",
        content: "Hello",
        tags: ["test"],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      })
    );

    const result = await fetchNotes();

    expect(fetch).toHaveBeenCalledWith("/api/notes");
    expect(result).toEqual(mockNotes);
  });

  it("throws on non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    await expect(fetchNotes()).rejects.toThrow(
      "Failed to fetch notes: 500 Internal Server Error"
    );
  });
});
