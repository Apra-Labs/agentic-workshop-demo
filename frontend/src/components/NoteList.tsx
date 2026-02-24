import { useEffect, useState } from "react";
import { fetchNotes, createNote, updateNote, type Note, type CreateNoteInput } from "../api";
import NoteCard from "./NoteCard";
import NoteForm from "./NoteForm";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);

  const loadNotes = () => {
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
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreate = async (input: CreateNoteInput) => {
    await createNote(input);
    setShowForm(false);
    loadNotes();
  };

  const handleUpdate = async (input: CreateNoteInput) => {
    if (!editingNote) return;
    await updateNote(editingNote.id, input);
    setEditingNote(undefined);
    loadNotes();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingNote(undefined);
  };

  if (loading) return <LoadingSpinner />;
  if (error && notes.length === 0) return <ErrorMessage message={error} />;

  return (
    <div>
      {error && <ErrorMessage message={error} />}

      {editingNote ? (
        <NoteForm note={editingNote} onSubmit={handleUpdate} onCancel={handleCancel} />
      ) : showForm ? (
        <NoteForm onSubmit={handleCreate} onCancel={handleCancel} />
      ) : (
        <button className="btn btn-primary btn-new" onClick={() => setShowForm(true)}>
          + New Note
        </button>
      )}

      {notes.length === 0 ? (
        <p className="empty">No notes yet. Create one!</p>
      ) : (
        <div className="note-list">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NoteList;
