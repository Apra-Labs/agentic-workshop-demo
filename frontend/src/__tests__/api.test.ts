import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchNotes, createNote, updateNote, deleteNote } from "../api";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchNotes", () => {
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

describe("createNote", () => {
  it("sends POST with note data", async () => {
    const input = { title: "New", content: "Body", tags: ["test"] };
    const created = { id: "1", ...input, createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(created),
      })
    );

    const result = await createNote(input);

    expect(fetch).toHaveBeenCalledWith("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(result).toEqual(created);
  });

  it("throws on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, statusText: "Bad Request" })
    );

    await expect(createNote({ title: "", content: "", tags: [] })).rejects.toThrow(
      "Failed to create note: 400 Bad Request"
    );
  });
});

describe("updateNote", () => {
  it("sends PUT with updated data", async () => {
    const input = { title: "Updated" };
    const updated = { id: "1", title: "Updated", content: "Body", tags: [], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updated),
      })
    );

    const result = await updateNote("1", input);

    expect(fetch).toHaveBeenCalledWith("/api/notes/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(result).toEqual(updated);
  });
});

describe("deleteNote", () => {
  it("sends DELETE request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true })
    );

    await deleteNote("1");

    expect(fetch).toHaveBeenCalledWith("/api/notes/1", { method: "DELETE" });
  });

  it("throws on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" })
    );

    await expect(deleteNote("999")).rejects.toThrow(
      "Failed to delete note: 404 Not Found"
    );
  });
});
