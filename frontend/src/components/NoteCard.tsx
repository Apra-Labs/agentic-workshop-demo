import type { Note } from "../api";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

function NoteCard({ note, onEdit }: NoteCardProps) {
  return (
    <div className="note-card">
      <div className="note-card-header">
        <h2>{note.title}</h2>
        <div className="note-card-actions">
          <button className="btn btn-small" onClick={() => onEdit(note)}>Edit</button>
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
