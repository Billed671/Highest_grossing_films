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
                <td colspan="8" class="loading">
                    ❌ Error loading data. Please check the JSON file.
                 </td>
             </tr>
        `;
    }
}

// Calculate standard deviation
function calculateStdDev(values) {
    const n = values.length;
    if (n === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    
    return Math.sqrt(variance);
}

// Extract unique values from comma-separated strings
function extractUniqueValues(films, fieldName) {
    const allValues = new Set();
    
    films.forEach(film => {
        let value = film[fieldName];
        if (value && value !== 'Unknown') {
            // Split by comma and trim whitespace
            const parts = value.split(',').map(part => part.trim());
            parts.forEach(part => {
                if (part && part !== 'Unknown') {
                    allValues.add(part);
                }
            });
        }
    });
    
    return allValues;
}

// Update statistics displays
function updateStatistics() {
    const totalFilms = allFilms.length;
    
    // Box office statistics
    const boxOfficeValues = allFilms.map(f => f.box_office || 0).filter(v => v > 0);
    const totalRevenue = boxOfficeValues.reduce((sum, val) => sum + val, 0);
    const avgRevenue = totalFilms > 0 ? totalRevenue / totalFilms : 0;
    const stdRevenue = calculateStdDev(boxOfficeValues);
    
    // Runtime statistics
    const runtimeValues = allFilms.map(f => f.running_time || 0).filter(v => v > 0);
    const totalRuntime = runtimeValues.reduce((sum, val) => sum + val, 0);
    const avgRuntime = runtimeValues.length > 0 ? totalRuntime / runtimeValues.length : 0;
    const stdRuntime = calculateStdDev(runtimeValues);
    
    // Unique values for about section - USING IMPROVED FUNCTION
    const uniqueDirectors = extractUniqueValues(allFilms, 'director').size;
    const uniqueCountries = extractUniqueValues(allFilms, 'country').size;
    const uniqueLanguages = extractUniqueValues(allFilms, 'language').size;
    
    // Hero section stats - Box Office
    document.getElementById('heroTotalFilms').textContent = totalFilms;
    document.getElementById('heroTotalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('heroAvgRevenue').textContent = formatCurrency(avgRevenue);
    document.getElementById('heroStdRevenue').textContent = formatCurrency(stdRevenue);
    
    // Hero section stats - Runtime
    document.getElementById('heroTotalRuntime').textContent = formatNumber(totalRuntime);
    document.getElementById('heroAvgRuntime').textContent = formatNumber(avgRuntime);
    document.getElementById('heroStdRuntime').textContent = formatNumber(stdRuntime);
    
    // About section stats
    document.getElementById('aboutTotalFilms').textContent = totalFilms;
    document.getElementById('aboutDirectors').textContent = uniqueDirectors;
    document.getElementById('aboutCountries').textContent = uniqueCountries;
    document.getElementById('aboutLanguages').textContent = uniqueLanguages;
    
    // Debug output to console (optional - remove in production)
    console.log('Statistics updated:', {
        totalFilms,
        uniqueDirectors,
        uniqueCountries,
        uniqueLanguages,
        sampleDirectors: Array.from(uniqueDirectors).slice(0, 5)
    });
}

// Format currency
function formatCurrency(value) {
    if (!value || value === 0) return '$0';
    return '$' + Math.round(value).toLocaleString();
}

// Format number
function formatNumber(value) {
    if (!value || value === 0) return '0';
    return Math.round(value).toLocaleString();
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
            (film.country && film.country.toLowerCase().includes(searchTerm)) ||
            (film.language && film.language.toLowerCase().includes(searchTerm));
        
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
        case 'runtime_desc':
            filtered.sort((a, b) => (b.running_time || 0) - (a.running_time || 0));
            break;
        case 'runtime_asc':
            filtered.sort((a, b) => (a.running_time || 0) - (b.running_time || 0));
            break;
        default:
            filtered.sort((a, b) => (b.box_office || 0) - (a.box_office || 0));
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
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No films found matching your criteria.</td></tr>';
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
            <td>${escapeHtml(film.language || 'Unknown')}</td>
            <td>${film.running_time ? film.running_time.toLocaleString() : 'N/A'}</td>
        </tr>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
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
    
    if (totalPages === 0) return;
    
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
        const totalItems = parseInt(document.getElementById('resultsCount').textContent);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            filterAndDisplay();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Table header sorting
    const headers = document.querySelectorAll('.films-table th');
    const sortOptions = {
        1: 'title_asc',
        2: 'year_desc',
        4: 'box_office_desc',
        7: 'runtime_desc'
    };
    
    headers.forEach((header, index) => {
        if (sortOptions[index]) {
            header.addEventListener('click', () => {
                document.getElementById('sortBy').value = sortOptions[index];
                filterAndDisplay();
            });
        }
    });
}
