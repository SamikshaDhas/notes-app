// API endpoint base URL (same origin since frontend and backend are served together)
const API_URL = '/notes';

// DOM elements
const noteInput = document.getElementById('noteInput');
const addNoteBtn = document.getElementById('addNoteBtn');
const notesContainer = document.getElementById('notesContainer');
const charCount = document.getElementById('charCount');

// Character counter for textarea
noteInput.addEventListener('input', () => {
    const length = noteInput.value.length;
    charCount.textContent = `${length}/500`;
    
    // Add visual warning when approaching limit
    if (length > 450) {
        charCount.style.color = '#dc3545';
    } else {
        charCount.style.color = '#666';
    }
});

// Add note button click handler
addNoteBtn.addEventListener('click', async () => {
    const text = noteInput.value.trim();
    
    if (!text) {
        showError('Please enter some text for your note');
        return;
    }
    
    if (text.length > 500) {
        showError('Note cannot exceed 500 characters');
        return;
    }
    
    try {
        // Disable button while adding
        addNoteBtn.disabled = true;
        addNoteBtn.textContent = 'Adding...';
        
        // Send POST request to add note
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add note');
        }
        
        // Clear input and refresh notes list
        noteInput.value = '';
        charCount.textContent = '0/500';
        charCount.style.color = '#666';
        
        await loadNotes();
        
    } catch (error) {
        console.error('Error adding note:', error);
        showError(error.message || 'Failed to add note. Please try again.');
    } finally {
        addNoteBtn.disabled = false;
        addNoteBtn.textContent = '➕ Add Note';
    }
});

// Delete a note by ID
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete note');
        }
        
        // Refresh the notes list after deletion
        await loadNotes();
        
    } catch (error) {
        console.error('Error deleting note:', error);
        showError(error.message || 'Failed to delete note. Please try again.');
    }
}

// Load all notes from the server
async function loadNotes() {
    try {
        // Show loading state
        notesContainer.innerHTML = '<div class="loading">Loading notes...</div>';
        
        // Fetch notes from API
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }
        
        const notes = await response.json();
        
        // Render notes
        renderNotes(notes);
        
    } catch (error) {
        console.error('Error loading notes:', error);
        notesContainer.innerHTML = '<div class="error-message">Failed to load notes. Please refresh the page.</div>';
    }
}

// Render notes in the container
function renderNotes(notes) {
    if (!notes || notes.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <p>📭 No notes yet</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Write your first note above!</p>
            </div>
        `;
        return;
    }
    
    // Generate HTML for each note
    const notesHTML = notes.map(note => `
        <div class="note-card" data-id="${note.id}">
            <div class="note-content">
                <div class="note-text">${escapeHtml(note.text)}</div>
                <div class="note-date">📅 ${formatDate(note.created_at)}</div>
            </div>
            <div class="note-actions">
                <button class="btn btn-delete" onclick="deleteNote(${note.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
    
    notesContainer.innerHTML = notesHTML;
}

// Helper function to format date nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Show relative time for recent notes
    if (diffDays === 0) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString([], { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Helper function to escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to show error messages
function showError(message) {
    // Remove any existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and insert error message at the top of main content
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const main = document.querySelector('main');
    main.insertBefore(errorDiv, main.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}

// Allow pressing Enter (Ctrl+Enter or Cmd+Enter) to add note
noteInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        addNoteBtn.click();
    }
});

// Load notes when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    
    // Optional: Auto-refresh notes every 30 seconds (can be removed if not needed)
    // setInterval(loadNotes, 30000);
});