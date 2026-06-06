// Joke API endpoints
const JOK_API_BASE = 'https://v2.jokeapi.dev/joke';

// DOM Elements
const jokeDisplay = document.getElementById('jokeDisplay');
const jokeType = document.getElementById('jokeType');
const getJokeBtn = document.getElementById('getJokeBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const categorySelect = document.getElementById('categorySelect');
const jokeHistoryList = document.getElementById('jokeHistory');
const notification = document.getElementById('notification');

// State
let currentJoke = null;
let jokeHistory = JSON.parse(localStorage.getItem('jokeHistory')) || [];
let isLoading = false;

// Event Listeners
getJokeBtn.addEventListener('click', fetchJoke);
copyBtn.addEventListener('click', copyJoke);
shareBtn.addEventListener('click', shareJoke);
categorySelect.addEventListener('change', fetchJoke);

// Initialize
displayJokeHistory();

/**
 * Fetch a random joke from the API
 */
async function fetchJoke() {
    if (isLoading) return;

    isLoading = true;
    getJokeBtn.disabled = true;
    jokeDisplay.innerHTML = '<p class="loading"><span class="loading-spinner">⏳</span> Fetching a joke...</p>';

    try {
        const category = categorySelect.value || 'Any';
        const url = category === 'Any' 
            ? `${JOK_API_BASE}/Any?type=single,twopart`
            : `${JOK_API_BASE}/${category}?type=single,twopart`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch joke');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error('Could not fetch joke. Please try again.');
        }

        // Format the joke
        currentJoke = formatJoke(data);
        displayJoke(currentJoke);
        addToHistory(currentJoke);
        showNotification('Joke loaded!', 'success');

    } catch (error) {
        console.error('Error fetching joke:', error);
        jokeDisplay.innerHTML = `<p class="loading">❌ ${error.message}</p>`;
        showNotification('Error loading joke', 'error');
    } finally {
        isLoading = false;
        getJokeBtn.disabled = false;
    }
}

/**
 * Format the joke data from API
 */
function formatJoke(data) {
    let jokeText = '';
    
    if (data.type === 'single') {
        jokeText = data.joke;
    } else if (data.type === 'twopart') {
        jokeText = `${data.setup}\n\n${data.delivery}`;
    }

    return {
        text: jokeText,
        category: data.category,
        type: data.type,
        safe: data.safe,
        timestamp: new Date().toLocaleTimeString()
    };
}

/**
 * Display the joke on the page
 */
function displayJoke(joke) {
    const lines = joke.text.split('\n\n');
    
    if (lines.length > 1) {
        // Two-part joke with animation
        jokeDisplay.innerHTML = `
            <p class="setup">${lines[0]}</p>
            <p class="delivery" style="opacity: 0; animation: fadeIn 0.5s ease-in 0.5s forwards;">${lines[1]}</p>
        `;
        
        // Add fade-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    } else {
        jokeDisplay.innerHTML = `<p>${joke.text}</p>`;
    }

    jokeType.textContent = joke.category.toUpperCase();
}

/**
 * Copy joke to clipboard
 */
function copyJoke() {
    if (!currentJoke) {
        showNotification('No joke to copy!', 'error');
        return;
    }

    const text = currentJoke.text.replace(/\n\n/g, '\n');
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✓ Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

/**
 * Share joke via Web Share API or fallback
 */
function shareJoke() {
    if (!currentJoke) {
        showNotification('No joke to share!', 'error');
        return;
    }

    const shareText = `Check out this joke: ${currentJoke.text.replace(/\n\n/g, ' - ')}`;

    if (navigator.share) {
        navigator.share({
            title: 'Random Joke',
            text: shareText
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText);
        showNotification('Joke copied to share!', 'success');
    }
}

/**
 * Add joke to history
 */
function addToHistory(joke) {
    jokeHistory.unshift({
        ...joke,
        id: Date.now()
    });

    // Keep only last 10 jokes
    if (jokeHistory.length > 10) {
        jokeHistory.pop();
    }

    localStorage.setItem('jokeHistory', JSON.stringify(jokeHistory));
    displayJokeHistory();
}

/**
 * Display joke history
 */
function displayJokeHistory() {
    jokeHistoryList.innerHTML = '';

    if (jokeHistory.length === 0) {
        jokeHistoryList.innerHTML = '<li style="color: #999; font-style: italic;">No jokes yet. Get one!</li>';
        return;
    }

    jokeHistory.forEach((joke, index) => {
        const li = document.createElement('li');
        const text = joke.text.replace(/\n\n/g, ' - ').substring(0, 60) + '...';
        li.textContent = `${text}`;
        li.title = joke.text;
        li.addEventListener('click', () => {
            currentJoke = joke;
            displayJoke(joke);
            jokeDisplay.scrollIntoView({ behavior: 'smooth' });
        });
        jokeHistoryList.appendChild(li);
    });
}

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Auto-fetch a joke on page load
 */
window.addEventListener('load', () => {
    // Optional: uncomment to auto-fetch on load
    // fetchJoke();
    showNotification('👋 Click "Get New Joke" to start!', 'success');
});

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!isLoading) {
            fetchJoke();
        }
    }
    if (e.ctrlKey && e.code === 'KeyC' && currentJoke) {
        e.preventDefault();
        copyJoke();
    }
});
