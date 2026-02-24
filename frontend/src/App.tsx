import NoteList from "./components/NoteList";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>NoteAPI</h1>
        <p>A simple note-taking app</p>
      </header>
      <main>
        <NoteList />
      </main>
    </div>
  );
}

export default App;
