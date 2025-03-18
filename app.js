// Array to store notes
let notes = [];

// Function to render notes in the #notesList
function renderNotes(filterText = '') {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = ''; // Clear the list before rendering

    const notesToRender = filterText
        ? notes.filter(note =>
            note.title.toLowerCase().includes(filterText.toLowerCase()) ||
            note.content.toLowerCase().includes(filterText.toLowerCase()) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(filterText.toLowerCase())))
        )
        : notes;

    notesToRender.forEach((note, index) => {
        const noteItem = document.createElement('li');
        noteItem.classList.add('note-item');

        if (document.getElementById('notepad').dataset.noteId == note.id) {
            noteItem.classList.add('selected');
        }

        const timestamp = note.timestamp || note.createdAt
            ? new Date(note.timestamp || note.createdAt).toLocaleString()
            : 'No Date';

        const preview = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content;

        const filesHTML = note.files
            ? note.files
                .map((file) => {
                    if (file.type.startsWith('image/')) {
                        return `<img src="${file.data}" alt="${file.name}" class="note-image" data-type="${file.type}" />`;
                    } else {
                        return `<a href="${file.data}" download="${file.name}" class="note-file" data-type="${file.type}">
                                    <i class="fas fa-file"></i> ${file.name}
                                </a>`;
                    }
                })
                .join('')
            : '';

        noteItem.innerHTML = `
            <div class="note-content">
                <span class="note-title">${note.title}</span>
                <p class="note-preview">${preview}</p>
                <span class="note-timestamp">${timestamp}</span>
                <div class="note-files">${filesHTML}</div>
            </div>
            <button class="delete-note" data-note-id="${note.id}" title="Delete Note">
                <i class="fas fa-trash"></i>
            </button>
        `;

        noteItem.querySelector('.delete-note').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(index);
        });

        noteItem.addEventListener('click', () => {
            openNote(note);
        });

        notesList.appendChild(noteItem);
    });

    setupFileClickHandlers();
}

// Function to open a note for editing
function openNote(note) {
    const notepad = document.getElementById('notepad');
    const noteTitle = document.getElementById('noteTitle');
    const noteCategory = document.getElementById('noteCategory');
    const noteTags = document.getElementById('noteTags');

    notepad.value = note.content;
    noteTitle.value = note.title;
    noteCategory.value = note.category || 'general';
    noteTags.value = note.tags ? note.tags.join(', ') : '';

    notepad.dataset.noteId = note.id;

    highlightSelectedNote();
    handleResponsiveLayout();
}

// Function to delete a note
function deleteNote(index) {
    notes.splice(index, 1);
    saveNotesToLocalStorage();

    const notepad = document.getElementById('notepad');
    if (index === notes.findIndex(note => note.id == notepad.dataset.noteId)) {
        clearNoteForm();
    }

    renderNotes();
}

// Function to clear the note form
function clearNoteForm() {
    const notepad = document.getElementById('notepad');
    const noteTitle = document.getElementById('noteTitle');
    const noteCategory = document.getElementById('noteCategory');
    const noteTags = document.getElementById('noteTags');

    notepad.value = '';
    noteTitle.value = '';
    noteCategory.value = 'general';
    noteTags.value = '';
    notepad.removeAttribute('data-note-id');

    highlightSelectedNote();
}

// Function to save or update a note
function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('notepad').value;
    const fileInput = document.getElementById('uploadFiles');
    const filePreview = document.getElementById('filePreview');

    if (title && content) {
        const timestamp = Date.now();

        const uploadedFiles = [];
        if (fileInput.files.length > 0) {
            const files = Array.from(fileInput.files);
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    uploadedFiles.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result,
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        setTimeout(() => {
            notes.push({ title, content, timestamp, files: uploadedFiles });
            saveNotesToLocalStorage();
            renderNotes();

            fileInput.value = '';
            filePreview.innerHTML = '<p>No files uploaded yet.</p>';
        }, 100);
    }
}

// Function to save notes to localStorage
function saveNotesToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Function to load notes from localStorage
function loadNotesFromLocalStorage() {
    const storedNotes = localStorage.getItem('notes');
    if (storedNotes) {
        notes = JSON.parse(storedNotes).map(note => {
            if (!note.id) {
                note.id = note.timestamp || Date.now();
            }
            return note;
        });
    }
}

// Function to export notes to a JSON file
function exportNotes() {
    if (notes.length === 0) {
        alert('No notes to export.');
        return;
    }
    
    // Create a JSON string of the notes array
    const notesData = JSON.stringify(notes, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([notesData], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    const filename = prompt('Enter a filename for your export:', `notes_export_${new Date().toISOString().split('T')[0]}.json`);
    if (!filename) return; // Cancel export if no filename is provided
    link.download = filename;
    
    // Append link to body, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object
    URL.revokeObjectURL(url);

    alert('Notes exported successfully!');
}

// Function to import notes from a JSON file
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedNotes = JSON.parse(e.target.result);
            
            // Validate the imported data
            if (!Array.isArray(importedNotes)) {
                throw new Error('Invalid format: Expected an array of notes');
            }
            
            // Confirm import with the user
            if (confirm(`Import ${importedNotes.length} notes? This will merge with your existing notes.`)) {
                // Ensure all imported notes have an ID
                const processedNotes = importedNotes.map(note => {
                    if (!note.id) {
                        note.id = Date.now() + Math.random().toString(36).substr(2, 9);
                    }
                    return note;
                });
                
                // Merge with existing notes
                notes = [...notes, ...processedNotes];
                saveNotesToLocalStorage();
                renderNotes();
                
                alert(`Successfully imported ${processedNotes.length} notes.`);
            }
        } catch (error) {
            alert(`Error importing notes: ${error.message}`);
        }
        
        // Reset the file input
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Function to handle responsive layout
function handleResponsiveLayout() {
    const sidebar = document.querySelector('.sidebar');
    const editor = document.querySelector('.editor');
    
    if (!sidebar || !editor) return;
    
    if (window.innerWidth < 768) {
        // Mobile layout logic
        const activeNoteId = document.getElementById('notepad').dataset.noteId;
        
        // If a note is selected, show editor, otherwise show sidebar
        if (activeNoteId) {
            sidebar.style.display = 'none';
            editor.style.display = 'flex';
        } else {
            sidebar.style.display = 'flex';
            editor.style.display = 'none';
        }
    } else {
        // Desktop layout
        sidebar.style.display = 'flex';
        editor.style.display = 'flex';
    }
}

// Update highlightSelectedNote function
function highlightSelectedNote() {
    const noteId = document.getElementById('notepad').dataset.noteId;
    
    document.querySelectorAll('#notesList li').forEach(li => {
        li.classList.remove('selected');
    });
    
    if (noteId) {
        const selectedNote = document.querySelector(`#notesList li .delete-note[data-note-id="${noteId}"]`);
        if (selectedNote) {
            selectedNote.closest('li').classList.add('selected');
        }
    }
}

// Function to handle image clicks and open the modal
function setupImageClickHandlers() {
    const images = document.querySelectorAll('.note-images img');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.modal .close');

    images.forEach((image) => {
        image.addEventListener('click', () => {
            modal.style.display = 'block';
            modalImage.src = image.src; // Set the modal image source to the clicked image
        });
    });

    // Close the modal when the close button is clicked
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close the modal when clicking outside the image
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Function to handle file clicks and open the modal
function setupFileClickHandlers() {
    const files = document.querySelectorAll('.note-files img, .note-files a');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.modal .close');

    files.forEach((file) => {
        file.addEventListener('click', (event) => {
            event.preventDefault();

            const fileType = file.dataset.type || file.type;

            if (fileType.startsWith('image/')) {
                modal.style.display = 'block';
                modalImage.src = file.src || file.href;
                modalImage.style.display = 'block';
            } else if (fileType.startsWith('audio/')) {
                modal.style.display = 'block';
                modalImage.style.display = 'none';
                modal.innerHTML = `
                    <span class="close">&times;</span>
                    <audio controls class="modal-content">
                        <source src="${file.href}" type="${fileType}">
                        Your browser does not support the audio element.
                    </audio>
                `;
            } else if (fileType === 'application/pdf') {
                modal.style.display = 'block';
                modalImage.style.display = 'none';
                modal.innerHTML = `
                    <span class="close">&times;</span>
                    <iframe src="${file.href}" class="modal-content" style="width: 100%; height: 90%;"></iframe>
                `;
            } else if (fileType.startsWith('text/')) {
                fetch(file.href)
                    .then((response) => response.text())
                    .then((text) => {
                        modal.style.display = 'block';
                        modalImage.style.display = 'none';
                        modal.innerHTML = `
                            <span class="close">&times;</span>
                            <div class="modal-content" style="padding: 1rem; background: white; color: black; overflow-y: auto; max-height: 90%;">
                                <pre>${text}</pre>
                            </div>
                        `;
                    });
            } else {
                modal.style.display = 'block';
                modalImage.style.display = 'none';
                modal.innerHTML = `
                    <span class="close">&times;</span>
                    <div class="modal-content" style="padding: 1rem; background: white; color: black; text-align: center;">
                        <p>Unsupported file type. <a href="${file.href}" download>Click here to download the file.</a></p>
                    </div>
                `;
            }
        });
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.innerHTML = `
            <span class="close">&times;</span>
            <img class="modal-content" id="modalImage" alt="Full-size image">
        `;
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            modal.innerHTML = `
                <span class="close">&times;</span>
                <img class="modal-content" id="modalImage" alt="Full-size image">
            `;
        }
    });
}

// Function to handle modal close functionality
function setupModalCloseHandler() {
    const modal = document.getElementById('imageModal');
    const closeModal = document.querySelector('.modal .close');

    // Close the modal when the close button is clicked
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.innerHTML = `
            <span class="close">&times;</span>
            <img class="modal-content" id="modalImage" alt="Full-size image">
        `;
    });

    // Close the modal when clicking outside the modal content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            modal.innerHTML = `
                <span class="close">&times;</span>
                <img class="modal-content" id="modalImage" alt="Full-size image">
            `;
        }
    });
}

// Function to open the modal with an image
function openModalWithImage(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    modal.style.display = 'block';
    modalImage.src = imageSrc;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Get necessary elements
    const saveNoteButton = document.getElementById('saveNote');
    const createNoteButton = document.getElementById('createNote');
    const clearNoteButton = document.getElementById('clearNote');
    const searchInput = document.getElementById('searchNotes');
    const clearSearchButton = document.getElementById('clearSearch');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const exportNotesButton = document.getElementById('exportNotes');
    const importNotesInput = document.getElementById('importNotes');
    
    // Setup event listeners
    if (saveNoteButton) {
        saveNoteButton.addEventListener('click', saveNote);
    }
    
    if (createNoteButton) {
        createNoteButton.addEventListener('click', clearNoteForm);
    }
    
    if (clearNoteButton) {
        clearNoteButton.addEventListener('click', clearNoteForm);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderNotes(searchInput.value.trim());
        });
    }
    
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                renderNotes();
            }
        });
    }
    
    // Export functionality
    if (exportNotesButton) {
        exportNotesButton.addEventListener('click', exportNotes);
    }
    
    // Import functionality
    if (importNotesInput) {
        importNotesInput.addEventListener('change', importNotes);
    }
    
    // Dark mode handling
    if (darkModeToggle) {
        // Load dark mode preference from localStorage
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        // Toggle dark mode on checkbox change
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }
    
    // Add responsive handling
    window.addEventListener('resize', handleResponsiveLayout);
    
    // Initialize app
    loadNotesFromLocalStorage();
    renderNotes();
    handleResponsiveLayout();
    
    // Handle file uploads and display them in the preview section
    document.getElementById('uploadFiles').addEventListener('change', (event) => {
        const files = event.target.files;
        const filePreview = document.getElementById('filePreview');

        if (files.length > 0) {
            const uploadedFiles = Array.from(files).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }));

            // Update the file preview section
            filePreview.innerHTML = `
                <ul>
                    ${uploadedFiles
                        .map(
                            (file) =>
                                `<li>${file.name} (${(file.size / 1024).toFixed(2)} KB) - ${file.type}</li>`
                        )
                        .join('')}
                </ul>
            `;
        } else {
            filePreview.innerHTML = '<p>No files uploaded yet.</p>';
        }
    });

    // Handle file uploads
    document.getElementById('uploadFiles').addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const uploadedFiles = Array.from(files).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }));

            // Log the uploaded files (for now)
            console.log('Uploaded files:', uploadedFiles);

            // Example: Display file names in an alert
            const fileNames = uploadedFiles.map((file) => file.name).join('\n');
            alert(`Uploaded files:\n${fileNames}`);

            // TODO: Attach files to a note or display them in the UI
        }
    });

    setupModalCloseHandler();
    document.querySelectorAll('.note-image').forEach((image) => {
        image.addEventListener('click', () => {
            openModalWithImage(image.src);
        });
    });
});