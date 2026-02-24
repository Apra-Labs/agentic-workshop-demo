export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  tags: string[];
}

export type UpdateNoteInput = Partial<CreateNoteInput>;

const API_BASE = "/api/notes";

export async function fetchNotes(): Promise<Note[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to create note: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to update note: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
