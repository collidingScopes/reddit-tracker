// Default data
const defaultData = {
    subreddits: ['personalfinancecanada', 'money', 'stockmarket',
        'investing', 'canadianinvestor', 'financialindependence', 'stocks', 'wallstreetbets',
        'canadahousing', 'canadahousing2', 'financialplanning', 'wealthsimple', 
        'UKPersonalFinance', 'AusFinance'],
    keywords: ['excel', 'google sheets', 'budgeting', 'budget tracking',
        'spreadsheet', 'spend tracking', 'budgeting app', 'template', 'expense tracker',
        'tracking', 'budgeting tool', 'budget spreadsheet', 'budget template',
        'budget app', 'finance app', 'budget tool', 'money tracker', 'mint', 'YNAB',
        'you need a budget', 'portfolio tracking', 'portfolio returns', 'dividend tracker',
        'dividend tracking', 'tmoap', 'measureofaplan', 'price-to-income', 'price to income ratio',
        'historical returns', 'monthly performance', 'asset class returns', 'benchmark', 'returns by decade',
        'free tool', 'rent or buy', 'buy or rent', 'rent versus buy', 'buy versus rent',
        'rent vs buy', 'buy vs rent', 'IRR', 'inflation', 'cpi', 'CAD', 'canadian dollar', 'ACB',
        'ATM',
        ],
};

let subreddits = [...defaultData.subreddits];
let keywords = [...defaultData.keywords];

const dashboardElement = document.getElementById('dashboard');
const twentyFourHoursAgo = Date.now() / 1000 - (24 * 60 * 60);

// JSONP implementation
function jsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = (data) => {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        const script = document.createElement('script');
        script.src = `${url}${url.includes('?') ? '&' : '?'}jsonp=${callbackName}`;
        document.body.appendChild(script);
    });
}

// Post fetching and display
async function fetchSubredditPosts(subreddit, after = null) {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=100${after ? '&after=' + after : ''}`;
        const response = await jsonp(url);
        const posts = response.data.children;

        const matchingPosts = posts.filter(post => 
            post.data.created_utc >= twentyFourHoursAgo &&
            keywords.some(keyword => 
                post.data.title.toLowerCase().includes(keyword.toLowerCase()) ||
                post.data.selftext.toLowerCase().includes(keyword.toLowerCase())
            )
        );

        matchingPosts.forEach(post => {
            post.data.matchingKeywords = keywords.filter(keyword =>
                post.data.title.toLowerCase().includes(keyword.toLowerCase()) ||
                post.data.selftext.toLowerCase().includes(keyword.toLowerCase())
            );
            displayPost(post, subreddit);
        });

        if (posts.length > 0 && 
            posts[posts.length - 1].data.created_utc > twentyFourHoursAgo && 
            response.data.after) {
            await fetchSubredditPosts(subreddit, response.data.after);
        }
    } catch (error) {
        console.error(`Error fetching posts from r/${subreddit}:`, error);
    }
}

function displayPost(post, subreddit) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    const postDate = new Date(post.data.created_utc * 1000);

    postElement.innerHTML = `
        <h2>${post.data.title}</h2>
        <div class="post-info">
            <p>Subreddit: r/${subreddit}</p>
            <p>Posted on: ${postDate.toLocaleString()}</p>
        </div>
        <p class="keywords">Matching keywords: ${post.data.matchingKeywords.join(', ')}</p>
        <a href="https://www.reddit.com${post.data.permalink}" target="_blank">Read more</a>
    `;
    dashboardElement.appendChild(postElement);
}

// UI event handlers
function toggleEditInterface() {
    const editContainer = document.getElementById('editContainer');
    editContainer.style.display = editContainer.style.display === 'none' ? 'flex' : 'none';
}

function saveChanges() {
    subreddits = document.getElementById('subredditsEdit').value.split('\n').filter(s => s.trim());
    keywords = document.getElementById('keywordsEdit').value.split('\n').filter(k => k.trim());
    toggleEditInterface();
}

function resetToDefaults() {
    document.getElementById('subredditsEdit').value = defaultData.subreddits.join('\n');
    document.getElementById('keywordsEdit').value = defaultData.keywords.join('\n');
}

function closePopup() {
    document.getElementById('completionPopup').style.display = 'none';
}

// Main search function
async function fetchPosts() {
    const startTime = performance.now();
    dashboardElement.innerHTML = '';
    
    const now = new Date();
    document.getElementById('lastRunTime').innerHTML = `Last search performed: ${now.toLocaleString()}`;
    
    const fetchPromises = subreddits.map(subreddit => fetchSubredditPosts(subreddit));
    await Promise.all(fetchPromises);
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    const postsCount = document.querySelectorAll('.post').length;

    // Show completion popup
    const popup = document.getElementById('completionPopup');
    document.getElementById('subredditsSearched').textContent = `Subreddits searched: ${subreddits.length}`;
    document.getElementById('matchingPosts').textContent = `Matching posts found: ${postsCount}`;
    document.getElementById('searchDuration').textContent = `Search duration: ${duration} seconds`;
    popup.style.display = 'flex';
}

// Initialize UI
document.getElementById('subredditsEdit').value = subreddits.join('\n');
document.getElementById('keywordsEdit').value = keywords.join('\n');

// Event listeners
document.getElementById('goButton').addEventListener('click', fetchPosts);
document.getElementById('editButton').addEventListener('click', toggleEditInterface);
document.getElementById('saveButton').addEventListener('click', saveChanges);
document.getElementById('resetButton').addEventListener('click', resetToDefaults);
document.getElementById('cancelButton').addEventListener('click', () => {
    resetToDefaults();
    toggleEditInterface();
});
document.getElementById('completionPopup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('completionPopup')) {
        closePopup();
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
});
