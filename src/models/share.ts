export type SharePermission = 'read' | 'edit' | 'admin';

export interface Share {
  id: string;
  noteId: string;
  token: string;
  permission: SharePermission;
  expiresAt: string | null;
  createdAt: string;
}

const shares = new Map<string, Share>();

export const shareStore = {
  getAll(): Share[] {
    return Array.from(shares.values());
  },

  getById(id: string): Share | undefined {
    return shares.get(id);
  },

  getByToken(token: string): Share | undefined {
    return Array.from(shares.values()).find((s) => s.token === token);
  },

  create(share: Share): Share {
    shares.set(share.id, share);
    return share;
  },

  delete(id: string): boolean {
    return shares.delete(id);
  },

  deleteByNoteId(noteId: string): void {
    for (const [id, share] of shares) {
      if (share.noteId === noteId) {
        shares.delete(id);
      }
    }
  },

  clear(): void {
    shares.clear();
  },
};
