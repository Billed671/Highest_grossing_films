// script.js
let allFilms = [];
let filteredFilms = [];

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('films_data.json');
        allFilms = await response.json();
        filteredFilms = [...allFilms];
        
        // Update statistics
        updateStatistics();
        
        // Populate year filter
        populateYearFilter();
        
        // Display films
        displayFilms();
        
        // Update footer date
        document.getElementById('updateDate').textContent = new Date().toLocaleDateString();
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('filmsTableBody').innerHTML = 
            '<tr><td colspan="5" class="loading">❌ Error loading data. Please check the JSON file.</td></tr>';
    }
}

// Update statistics cards
function updateStatistics() {
    const totalFilms = allFilms.length;
    const totalBoxOffice = allFilms.reduce((sum, film) => sum + (film.box_office || 0), 0);
    const avgBoxOffice = totalFilms > 0 ? totalBoxOffice / totalFilms : 0;
    const uniqueDirectors = new Set(allFilms.map(film => film.director).filter(d => d && d !== 'Unknown')).size;
    
    document.getElementById('totalFilms').textContent = totalFilms;
    document.getElementById('totalBoxOffice').textContent = formatCurrency(totalBoxOffice);
    document.getElementById('avgBoxOffice').textContent = formatCurrency(avgBoxOffice);
    document.getElementById('uniqueDirectors').textContent = uniqueDirectors;
}

// Format currency
function formatCurrency(value) {
    if (!value) return '$0';
    return '$' + value.toLocaleString();
}

// Populate year filter dropdown
function populateYearFilter() {
    const years = [...new Set(allFilms.map(film => film.release_year).filter(y => y))];
    years.sort((a, b) => b - a);
    
    const yearFilter = document.getElementById('yearFilter');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Display films in table
function displayFilms() {
    const tbody = document.getElementById('filmsTableBody');
    
    if (filteredFilms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No films found matching your criteria.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredFilms.map(film => `
        <tr>
            <td><strong>${escapeHtml(film.title || 'N/A')}</strong></td>
            <td>${film.release_year || 'N/A'}</td>
            <td>${escapeHtml(film.director || 'Unknown')}</td>
            <td>${formatCurrency(film.box_office)}</td>
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

// Filter and sort films
function filterAndSortFilms() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const yearFilter = document.getElementById('yearFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Apply filters
    filteredFilms = allFilms.filter(film => {
        // Search filter
        const matchesSearch = searchTerm === '' || 
            (film.title && film.title.toLowerCase().includes(searchTerm)) ||
            (film.director && film.director.toLowerCase().includes(searchTerm)) ||
            (film.country && film.country.toLowerCase().includes(searchTerm));
        
        // Year filter
        const matchesYear = yearFilter === 'all' || film.release_year == yearFilter;
        
        return matchesSearch && matchesYear;
    });
    
    // Apply sorting
    switch(sortBy) {
        case 'box_office_desc':
            filteredFilms.sort((a, b) => (b.box_office || 0) - (a.box_office || 0));
            break;
        case 'box_office_asc':
            filteredFilms.sort((a, b) => (a.box_office || 0) - (b.box_office || 0));
            break;
        case 'year_desc':
            filteredFilms.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
            break;
        case 'year_asc':
            filteredFilms.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
            break;
        case 'title_asc':
            filteredFilms.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        default:
            filteredFilms.sort((a, b) => (b.box_office || 0) - (a.box_office || 0));
    }
    
    // Display filtered and sorted films
    displayFilms();
}

// Add event listeners
document.getElementById('searchInput').addEventListener('input', filterAndSortFilms);
document.getElementById('yearFilter').addEventListener('change', filterAndSortFilms);
document.getElementById('sortBy').addEventListener('change', filterAndSortFilms);

// Add click sorting to table headers
document.querySelectorAll('th').forEach((th, index) => {
    th.addEventListener('click', () => {
        const sortOptions = ['title_asc', 'year_desc', 'director', 'box_office_desc', 'country'];
        if (sortOptions[index]) {
            document.getElementById('sortBy').value = sortOptions[index];
            filterAndSortFilms();
        }
    });
});

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadData);
