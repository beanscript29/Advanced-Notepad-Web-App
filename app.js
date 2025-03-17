const notes = [];

document.addEventListener('DOMContentLoaded', () => {
    const notepad = document.getElementById('notepad');
    const noteTitle = document.getElementById('noteTitle');
    const noteCategory = document.getElementById('noteCategory');
    const noteTags = document.getElementById('noteTags');
    const createNoteButton = document.getElementById('createNote');
    const saveNoteButton = document.getElementById('saveNote');
    const clearNoteButton = document.getElementById('clearNote');
    const searchNotesInput = document.getElementById('searchNotes');
    const clearSearchButton = document.getElementById('clearSearch');
    const sortNotesSelect = document.getElementById('sortNotes');
    const filterCategorySelect = document.getElementById('filterCategory');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const exportNotesButton = document.getElementById('exportNotes');
    const importNotesInput = document.getElementById('importNotes');

    // Load saved content from localStorage
    notepad.value = localStorage.getItem('notepadContent') || '';
    noteTitle.value = localStorage.getItem('noteTitleContent') || '';
    noteCategory.value = localStorage.getItem('noteCategoryContent') || 'general';
    noteTags.value = localStorage.getItem('noteTagsContent') || '';

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Save content to localStorage on input
    notepad.addEventListener('input', () => {
        localStorage.setItem('notepadContent', notepad.value);
    });

    noteTitle.addEventListener('input', () => {
        localStorage.setItem('noteTitleContent', noteTitle.value);
    });

    noteCategory.addEventListener('change', () => {
        localStorage.setItem('noteCategoryContent', noteCategory.value);
    });

    noteTags.addEventListener('input', () => {
        localStorage.setItem('noteTagsContent', noteTags.value);
    });

    createNoteButton.addEventListener('click', () => {
        createNote();
        notepad.value = '';
        noteTitle.value = '';
        noteCategory.value = 'general';
        noteTags.value = '';
        notepad.removeAttribute('data-note-id');
        displayNotes();
    });

    saveNoteButton.addEventListener('click', saveNote);

    clearNoteButton.addEventListener('click', () => {
        notepad.value = '';
        noteTitle.value = '';
        noteCategory.value = 'general';
        noteTags.value = '';
        notepad.removeAttribute('data-note-id');
    });

    searchNotesInput.addEventListener('input', () => {
        displayNotes(searchNotesInput.value, sortNotesSelect.value, filterCategorySelect.value);
    });

    clearSearchButton.addEventListener('click', () => {
        searchNotesInput.value = '';
        displayNotes('', sortNotesSelect.value, filterCategorySelect.value);
    });

    sortNotesSelect.addEventListener('change', () => {
        displayNotes(searchNotesInput.value, sortNotesSelect.value, filterCategorySelect.value);
    });

    filterCategorySelect.addEventListener('change', () => {
        displayNotes(searchNotesInput.value, sortNotesSelect.value, filterCategorySelect.value);
    });

    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    exportNotesButton.addEventListener('click', () => {
        const notesData = JSON.stringify(notes);
        const blob = new Blob([notesData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importNotesInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const importedNotes = JSON.parse(e.target.result);
                notes.length = 0;
                notes.push(...importedNotes);
                saveNotes();
                displayNotes();
            };
            reader.readAsText(file);
        }
    });

    displayNotes();
});

function createNote() {
    const notepad = document.getElementById('notepad');
    const noteTitle = document.getElementById('noteTitle');
    const noteCategory = document.getElementById('noteCategory');
    const noteTags = document.getElementById('noteTags');
    const note = {
        id: Date.now(),
        title: noteTitle.value,
        content: notepad.value,
        category: noteCategory.value,
        tags: noteTags.value.split(',').map(tag => tag.trim()),
        createdAt: new Date(),
    };
    notes.push(note);
    saveNotes();
    return note;
}

function editNote(id, newTitle, newContent, newCategory, newTags) {
    const note = notes.find(note => note.id === id);
    if (note) {
        note.title = newTitle;
        note.content = newContent;
        note.category = newCategory;
        note.tags = newTags.split(',').map(tag => tag.trim());
        saveNotes();
    }
}

function saveNote() {
    const notepad = document.getElementById('notepad');
    const noteTitle = document.getElementById('noteTitle');
    const noteCategory = document.getElementById('noteCategory');
    const noteTags = document.getElementById('noteTags');
    const noteId = notepad.dataset.noteId;
    if (noteId) {
        editNote(Number(noteId), noteTitle.value, notepad.value, noteCategory.value, noteTags.value);
    } else {
        createNote();
    }
    notepad.value = '';
    noteTitle.value = '';
    noteCategory.value = 'general';
    noteTags.value = '';
    notepad.removeAttribute('data-note-id');
    displayNotes();
    highlightSelectedNote();
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes.push(...JSON.parse(savedNotes));
    }
}

function displayNotes(searchQuery = '', sortBy = 'title', filterCategory = '') {
    const notesList = document.getElementById('notesList');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Show loading spinner
    loadingSpinner.style.display = 'block';
    notesList.style.display = 'none';

    setTimeout(() => {
        notesList.innerHTML = '';

        const filteredNotes = notes
            .filter(note => (note.title.includes(searchQuery) || note.content.includes(searchQuery) || note.tags.some(tag => tag.includes(searchQuery))) && (filterCategory === '' || note.category === filterCategory))
            .sort((a, b) => {
                if (sortBy === 'title') {
                    return a.title.localeCompare(b.title);
                } else if (sortBy === 'date') {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                }
            });

        if (filteredNotes.length === 0) {
            notesList.innerHTML = '<p style="text-align: center; color: #666;">No notes to display.</p>';
        } else {
            filteredNotes.forEach(note => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${note.title}</strong><br>${note.content}<br><small>${new Date(note.createdAt).toLocaleString()}</small><br><em>${note.category}</em><br><span>${note.tags.join(', ')}</span>`;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deleteNote(note.id);
                });

                li.appendChild(deleteButton);
                li.addEventListener('click', () => {
                    const notepad = document.getElementById('notepad');
                    const noteTitle = document.getElementById('noteTitle');
                    const noteCategory = document.getElementById('noteCategory');
                    const noteTags = document.getElementById('noteTags');
                    notepad.value = note.content;
                    noteTitle.value = note.title;
                    noteCategory.value = note.category;
                    noteTags.value = note.tags.join(', ');
                    notepad.dataset.noteId = note.id;
                    highlightSelectedNote();
                });

                notesList.appendChild(li);
            });
        }

        // Hide loading spinner
        loadingSpinner.style.display = 'none';
        notesList.style.display = 'block';
    }, 500); // Simulate loading delay
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            notes.splice(noteIndex, 1);
            saveNotes();
            displayNotes();
        }
    }
}

function highlightSelectedNote() {
    const notesList = document.getElementById('notesList');
    const notepad = document.getElementById('notepad');
    const noteId = notepad.dataset.noteId;

    Array.from(notesList.children).forEach(li => {
        li.classList.remove('selected');
        if (li.textContent.includes(notepad.value) && li.querySelector('button').dataset.noteId === noteId) {
            li.classList.add('selected');
        }
    });
}

// Load notes when the application starts
loadNotes();