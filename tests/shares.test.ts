import request from "supertest";
import app from "../src/app";
import { noteStore } from "../src/models/note";
import { shareStore } from "../src/models/share";

beforeEach(() => {
  noteStore.clear();
  shareStore.clear();
});

describe("POST /api/notes/:id/shares", () => {
  it("creates a share and returns 201 with shareToken, permission, expiresAt", async () => {
    const note = await request(app)
      .post("/api/notes")
      .send({ title: "Shareable", content: "Body", tags: [] });

    const res = await request(app)
      .post(`/api/notes/${note.body.id}/shares`)
      .send({ permission: "read" });

    expect(res.status).toBe(201);
    expect(res.body.shareToken).toBeDefined();
    expect(res.body.permission).toBe("read");
    expect(Object.prototype.hasOwnProperty.call(res.body, "expiresAt")).toBe(true);
  });

  it("returns 404 for unknown note ID", async () => {
    const res = await request(app)
      .post("/api/notes/does-not-exist/shares")
      .send({ permission: "read" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/shares/:token", () => {
  it("returns 200 with full note object for valid token", async () => {
    const note = await request(app)
      .post("/api/notes")
      .send({ title: "Shared note", content: "Content", tags: ["tag1"] });

    const share = await request(app)
      .post(`/api/notes/${note.body.id}/shares`)
      .send({ permission: "read" });

    const res = await request(app).get(`/api/shares/${share.body.shareToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(note.body.id);
    expect(res.body.title).toBe("Shared note");
    expect(res.body.content).toBe("Content");
  });

  it("returns 403 for expired token", async () => {
    const note = await request(app)
      .post("/api/notes")
      .send({ title: "Note", content: "Body", tags: [] });

    const expiredToken = "expired-token-abc123";
    shareStore.create({
      id: expiredToken,
      noteId: note.body.id,
      permission: "read",
      expiresAt: new Date(Date.now() - 60000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    const res = await request(app).get(`/api/shares/${expiredToken}`);
    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown token", async () => {
    const res = await request(app).get("/api/shares/nonexistent-token");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/shares/:token", () => {
  it("deletes a share and returns 204, share no longer accessible", async () => {
    const note = await request(app)
      .post("/api/notes")
      .send({ title: "To share", content: "Body", tags: [] });

    const share = await request(app)
      .post(`/api/notes/${note.body.id}/shares`)
      .send({ permission: "edit" });

    const token = share.body.shareToken;

    const del = await request(app).delete(`/api/shares/${token}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/shares/${token}`);
    expect(get.status).toBe(404);
  });
});

describe("Cascade delete", () => {
  it("deleting a note removes its shares — GET share returns 404", async () => {
    const note = await request(app)
      .post("/api/notes")
      .send({ title: "Cascade note", content: "Body", tags: [] });

    const share = await request(app)
      .post(`/api/notes/${note.body.id}/shares`)
      .send({ permission: "admin" });

    const token = share.body.shareToken;

    await request(app).delete(`/api/notes/${note.body.id}`);

    const res = await request(app).get(`/api/shares/${token}`);
    expect(res.status).toBe(404);
  });
});
