// Simplistic implementation using FlexSearch
// Ensure you load FlexSearch library before this script or via CDN in head
// <script src="https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.31/dist/flexsearch.bundle.js"></script>

let searchIndex = null;
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('search-results');

async function initSearch() {
    const response = await fetch('/index.json');
    const data = await response.json();
    
    // Create Index
    const index = new FlexSearch.Document({
        document: {
            id: "id",
            index: ["title", "content"],
            store: ["title", "permalink"]
        }
    });

    data.forEach(doc => index.add(doc));
    searchIndex = index;
}

searchInput.addEventListener('input', (e) => {
    if(!searchIndex) return;
    
    const query = e.target.value;
    if(query.length < 2) {
        resultsContainer.classList.add('hidden');
        return;
    }

    const results = searchIndex.search(query, { limit: 5 });
    
    // Flatten results (FlexSearch returns separate arrays for title matches and content matches)
    const uniqueDocs = new Map();
    results.forEach(field => {
        field.result.forEach(doc => {
            uniqueDocs.set(doc.id, doc.doc); // Store by ID to deduplicate
        });
    });

    renderResults(Array.from(uniqueDocs.values()));
});

function renderResults(docs) {
    if(docs.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:0.5rem">No results found</div>';
    } else {
        resultsContainer.innerHTML = docs.map(d => `
            <a href="${d.permalink}" style="display:block; padding: 0.5rem; border-bottom: 1px solid var(--border-color)">
                <div style="font-weight:600">${d.title}</div>
            </a>
        `).join('');
    }
    resultsContainer.classList.remove('hidden');
}

// Initialize on hover or focus to save bandwidth on initial load
searchInput.addEventListener('focus', initSearch, { once: true });
