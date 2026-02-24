import type { Note } from "../api";

interface NoteCardProps {
  note: Note;
}

function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="note-card">
      <h2>{note.title}</h2>
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
