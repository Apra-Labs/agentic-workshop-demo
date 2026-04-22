import { Router, Request, Response } from "express";
import crypto from "crypto";
import { noteStore } from "../models/note";
import { shareStore } from "../models/share";
import { validateCreateShareInput } from "../utils/validation";

const router = Router();

router.post("/notes/:id/shares", (req: Request<{ id: string }>, res: Response) => {
  const note = noteStore.getById(req.params.id);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const result = validateCreateShareInput(req.body);
  if (!result.valid) {
    res.status(400).json({ errors: result.errors });
    return;
  }

  const token = crypto.randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  const expiresAt =
    result.data.expiresInMinutes != null
      ? new Date(Date.now() + result.data.expiresInMinutes * 60 * 1000).toISOString()
      : null;

  shareStore.create({
    id: token,
    noteId: req.params.id,
    permission: result.data.permission,
    expiresAt,
    createdAt: now,
  });

  res.status(201).json({ shareToken: token, permission: result.data.permission, expiresAt });
});

router.get("/shares/:token", (req: Request<{ token: string }>, res: Response) => {
  const share = shareStore.getById(req.params.token);
  if (!share) {
    res.status(404).json({ error: "Share not found" });
    return;
  }

  if (share.expiresAt !== null && Date.now() > new Date(share.expiresAt).getTime()) {
    res.status(403).json({ error: "Share has expired" });
    return;
  }

  const note = noteStore.getById(share.noteId);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(note);
});

router.delete("/shares/:token", (req: Request<{ token: string }>, res: Response) => {
  const share = shareStore.getById(req.params.token);
  if (!share) {
    res.status(404).json({ error: "Share not found" });
    return;
  }

  shareStore.delete(req.params.token);
  res.status(204).send();
});

export default router;
