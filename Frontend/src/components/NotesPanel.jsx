function NotesPanel({ sessionId, notes, onAddNote, noteText, setNoteText }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Notes</h2>

      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Write your note..."
        className="border-2 border-orange-400 rounded-xl p-3 w-full resize-none focus:ring-2 focus:ring-orange-500 outline-none"
        rows={14} // keep same size as your screenshot
      />

      {/* Recent Notes */}
      <div className="w-full mt-6 space-y-3 overflow-y-auto max-h-28 custom-scroll">
        <h3 className="font-medium text-gray-700">Recent Notes</h3>
        {notes?.length > 0 ? (
          notes.map((note, idx) => (
            <div
              key={idx}
              className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm"
            >
              {note.text}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
      </div>
    </div>
  );
}

export default NotesPanel;
