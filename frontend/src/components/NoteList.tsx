import { useEffect, useState } from "react";
import { fetchNotes, type Note } from "../api";
import NoteCard from "./NoteCard";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes()
      .then((data) => {
        setNotes(data);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (notes.length === 0) return <p className="empty">No notes yet.</p>;

  return (
    <div className="note-list">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}

export default NoteList;
