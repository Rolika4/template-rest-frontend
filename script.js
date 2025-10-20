// API Configuration - loaded from config.js
function getApiConfig() {
    return window.appConfig || {
        apiUrl: 'http://localhost:5000/api/records',
        healthUrl: 'http://localhost:5000/',
        baseUrl: 'http://localhost:5000'
    };
}

// DOM Elements
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const noteInput = document.getElementById('noteInput');
const sendBtn = document.getElementById('sendBtn');
const viewDataBtn = document.getElementById('viewDataBtn');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const dataContainer = document.getElementById('dataContainer');
const tableBody = document.getElementById('tableBody');
const notification = document.getElementById('notification');
const connectionStatus = document.getElementById('connectionStatus');
const connectionResult = document.getElementById('connectionResult');

// State
let isDataVisible = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', handleSendData);
    viewDataBtn.addEventListener('click', handleViewData);
    testConnectionBtn.addEventListener('click', handleTestConnection);
    
    // Allow Enter key to submit form
    nameInput.addEventListener('keypress', handleKeyPress);
    messageInput.addEventListener('keypress', handleKeyPress);
    noteInput.addEventListener('keypress', handleKeyPress);
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendData();
    }
}

// Send data to backend
async function handleSendData() {
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const note = noteInput.value.trim();

    // Validation
    if (!name) {
        showNotification('Please enter your name', 'error');
        nameInput.focus();
        return;
    }

    if (!message) {
        showNotification('Please enter your message', 'error');
        messageInput.focus();
        return;
    }

    // Disable button during request
    setLoadingState(sendBtn, true);

    try {
        const requestData = {
            name: name,
            message: message
        };
        
        // Add note only if it's not empty
        if (note) {
            requestData.note = note;
        }

        const response = await fetch(getApiConfig().apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showNotification('Data sent successfully!', 'success');
        
        // Clear form
        nameInput.value = '';
        messageInput.value = '';
        noteInput.value = '';
        
        // If data is currently visible, refresh it
        if (isDataVisible) {
            await loadData();
        }

    } catch (error) {
        console.error('Error sending data:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        setLoadingState(sendBtn, false);
    }
}

// View/Hide data
async function handleViewData() {
    if (isDataVisible) {
        hideData();
    } else {
        await showData();
    }
}

async function showData() {
    setLoadingState(viewDataBtn, true);
    
    try {
        await loadData();
        dataContainer.style.display = 'block';
        viewDataBtn.textContent = 'Hide Data';
        isDataVisible = true;
        
        // Smooth scroll to data
        dataContainer.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification(`Error loading data: ${error.message}`, 'error');
    } finally {
        setLoadingState(viewDataBtn, false);
    }
}

function hideData() {
    dataContainer.style.display = 'none';
    viewDataBtn.textContent = 'View Data';
    isDataVisible = false;
}

// Test connection to backend
async function handleTestConnection() {
    setLoadingState(testConnectionBtn, true);
    connectionStatus.style.display = 'block';
    connectionStatus.className = 'connection-status';
    
    const config = getApiConfig();
    connectionResult.textContent = 'Testing connection...';
    
    try {
        const startTime = performance.now();
        const response = await fetch(config.healthUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Format successful response
        const result = {
            status: 'SUCCESS',
            url: config.healthUrl,
            responseTime: `${responseTime}ms`,
            httpStatus: response.status,
            response: data,
            timestamp: new Date().toISOString()
        };
        
        connectionResult.textContent = JSON.stringify(result, null, 2);
        connectionStatus.className = 'connection-status success';
        showNotification('Connection test successful!', 'success');
        
    } catch (error) {
        console.error('Connection test failed:', error);
        
        const result = {
            status: 'ERROR',
            url: config.healthUrl,
            error: error.message,
            timestamp: new Date().toISOString(),
            config: config.getConfig ? config.getConfig() : 'Config not available'
        };
        
        connectionResult.textContent = JSON.stringify(result, null, 2);
        connectionStatus.className = 'connection-status error';
        showNotification(`Connection test failed: ${error.message}`, 'error');
    } finally {
        setLoadingState(testConnectionBtn, false);
    }
}

// Load data from backend
async function loadData() {
    try {
        const response = await fetch(getApiConfig().apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Extract records array from response
        const records = data.records || data;
        renderTable(records);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Render data in table
function renderTable(records) {
    // Clear existing rows
    tableBody.innerHTML = '';

    if (!records || !Array.isArray(records) || records.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" class="empty-state">
                No records found. Send some data first!
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Sort records by created_at (newest first)
    records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    records.forEach(record => {
        const row = document.createElement('tr');
        
        // Format timestamp
        const timestamp = new Date(record.created_at).toLocaleString();
        
        row.innerHTML = `
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.message)}</td>
            <td>${record.note ? escapeHtml(record.note) : '<em>No note</em>'}</td>
            <td>${timestamp}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred', 'error');
});

// Handle network errors
window.addEventListener('online', function() {
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showNotification('Connection lost. Please check your internet connection.', 'error');
});