export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const API_BASE = "/api/notes";

export async function fetchNotes(): Promise<Note[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
