import type { Note } from "../api";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const handleDelete = () => {
    if (window.confirm(`Delete "${note.title}"?`)) {
      onDelete(note.id);
    }
  };

  return (
    <div className="note-card">
      <div className="note-card-header">
        <h2>{note.title}</h2>
        <div className="note-card-actions">
          <button className="btn btn-small" onClick={() => onEdit(note)}>Edit</button>
          <button className="btn btn-small btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <p>{note.content}</p>
      {note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default NoteCard;
