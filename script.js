// Global variables
let allFilms = [];
let currentPage = 1;
let itemsPerPage = 25;

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

// Load JSON data
async function loadData() {
    try {
        const response = await fetch('films_data.json');
        allFilms = await response.json();
        
        // Update statistics
        updateStatistics();
        
        // Populate filters
        populateYearFilter();
        
        // Display data
        filterAndDisplay();
        
        // Update update date
        document.getElementById('updateDate').textContent = new Date().toLocaleDateString();
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('filmsTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    ❌ Error loading data. Please check the JSON file.
                </td>
            </tr>
        `;
    }
}

// Update statistics displays
function updateStatistics() {
    const totalFilms = allFilms.length;
    const totalRevenue = allFilms.reduce((sum, film) => sum + (film.box_office || 0), 0);
    const avgRevenue = totalFilms > 0 ? totalRevenue / totalFilms : 0;
    const uniqueDirectors = new Set(allFilms.map(f => f.director).filter(d => d && d !== 'Unknown')).size;
    const uniqueCountries = new Set(allFilms.map(f => f.country).filter(c => c && c !== 'Unknown')).size;
    
    // Hero section stats
    document.getElementById('heroTotalFilms').textContent = totalFilms;
    document.getElementById('heroTotalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('heroAvgRevenue').textContent = formatCurrency(avgRevenue);
    
    // About section stats
    document.getElementById('aboutTotalFilms').textContent = totalFilms;
    document.getElementById('aboutDirectors').textContent = uniqueDirectors;
    document.getElementById('aboutCountries').textContent = uniqueCountries;
}

// Format currency
function formatCurrency(value) {
    if (!value || value === 0) return '$0';
    return '$' + value.toLocaleString();
}

// Populate year filter
function populateYearFilter() {
    const years = [...new Set(allFilms.map(f => f.release_year).filter(y => y))];
    years.sort((a, b) => b - a);
    
    const yearFilter = document.getElementById('yearFilter');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Filter and sort films
function filterAndDisplay() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const yearFilter = document.getElementById('yearFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Apply filters
    let filtered = allFilms.filter(film => {
        const matchesSearch = searchTerm === '' ||
            (film.title && film.title.toLowerCase().includes(searchTerm)) ||
            (film.director && film.director.toLowerCase().includes(searchTerm)) ||
            (film.country && film.country.toLowerCase().includes(searchTerm));
        
        const matchesYear = yearFilter === 'all' || film.release_year == yearFilter;
        
        return matchesSearch && matchesYear;
    });
    
    // Apply sorting
    switch(sortBy) {
        case 'box_office_desc':
            filtered.sort((a, b) => (b.box_office || 0) - (a.box_office || 0));
            break;
        case 'box_office_asc':
            filtered.sort((a, b) => (a.box_office || 0) - (b.box_office || 0));
            break;
        case 'year_desc':
            filtered.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
            break;
        case 'year_asc':
            filtered.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
            break;
        case 'title_asc':
            filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
    }
    
    // Update results count
    document.getElementById('resultsCount').textContent = filtered.length;
    
    // Paginate and display
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    
    displayFilms(paginated, start);
    updatePagination(filtered.length);
}

// Display films in table
function displayFilms(films, startIndex) {
    const tbody = document.getElementById('filmsTableBody');
    
    if (films.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No films found matching your criteria.</td></tr>';
        return;
    }
    
    tbody.innerHTML = films.map((film, index) => `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td><strong>${escapeHtml(film.title || 'N/A')}</strong></td>
            <td>${film.release_year || 'N/A'}</td>
            <td>${escapeHtml(film.director || 'Unknown')}</td>
            <td class="text-success">${formatCurrency(film.box_office)}</td>
            <td>${escapeHtml(film.country || 'Unknown')}</td>
        </tr>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update pagination controls
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationDiv = document.getElementById('pageNumbers');
    
    // Clear existing
    paginationDiv.innerHTML = '';
    
    // Show limited page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            filterAndDisplay();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        paginationDiv.appendChild(pageBtn);
    }
    
    // Update prev/next buttons
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', () => {
        currentPage = 1;
        filterAndDisplay();
    });
    
    document.getElementById('yearFilter').addEventListener('change', () => {
        currentPage = 1;
        filterAndDisplay();
    });
    
    document.getElementById('sortBy').addEventListener('change', () => {
        currentPage = 1;
        filterAndDisplay();
    });
    
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        filterAndDisplay();
    });
    
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterAndDisplay();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        const totalItems = document.getElementById('resultsCount').textContent;
        const totalPages = Math.ceil(parseInt(totalItems) / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            filterAndDisplay();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Table header sorting
    const headers = document.querySelectorAll('.films-table th');
    const sortOptions = ['title_asc', 'year_desc', 'box_office_desc', 'country'];
    headers.forEach((header, index) => {
        if (index > 0 && sortOptions[index - 1]) {
            header.addEventListener('click', () => {
                document.getElementById('sortBy').value = sortOptions[index - 1];
                filterAndDisplay();
            });
        }
    });
}
