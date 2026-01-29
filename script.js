// Đổi sang fetch từ GitHub khi deploy, ví dụ:
// const apiUrl = 'https://raw.githubusercontent.com/your-username/your-repo/main/db.json';
const apiUrl = './db.json';

let products = [];
let filteredProducts = [];
let currentSort = '';

function renderTable(data) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    data.forEach(item => {
        const imgSrc = item.image || (Array.isArray(item.images) && item.images[0]) || 'https://placehold.co/600x400';
        const categoryName = item.category && item.category.name ? item.category.name : '';
        const row = document.createElement('tr');
        // Tạo các ô riêng biệt để dùng textContent cho tên và mô tả
        const imgTd = document.createElement('td');
        imgTd.className = 'text-center';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = item.title;
        img.style.width = '70px';
        img.style.height = '70px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';
        imgTd.appendChild(img);

        const titleTd = document.createElement('td');
        titleTd.textContent = item.title || '';
        const priceTd = document.createElement('td');
        priceTd.textContent = item.price;
        const categoryTd = document.createElement('td');
        categoryTd.textContent = categoryName;
        const descTd = document.createElement('td');
        descTd.textContent = item.description || '';

        row.appendChild(imgTd);
        row.appendChild(titleTd);
        row.appendChild(priceTd);
        row.appendChild(categoryTd);
        row.appendChild(descTd);
        productList.appendChild(row);
    });
}

function handleSearch() {
    const searchValue = document.getElementById('search-input').value.trim().toLowerCase();
    filteredProducts = products.filter(item => item.title && item.title.toLowerCase().includes(searchValue));
    handleSort(currentSort); // giữ sort khi search
}

function handleSort(type) {
    currentSort = type;
    let data = [...filteredProducts];
    switch(type) {
        case 'name-asc':
            data.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            data.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price-asc':
            data.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            data.sort((a, b) => b.price - a.price);
            break;
    }
    renderTable(data);
}

fetch(apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Không tìm thấy file JSON');
        }
        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            console.error('Dữ liệu JSON không phải một mảng:', data);
            return;
        }
        products = data;
        filteredProducts = data;
        renderTable(filteredProducts);
        // Gán sự kiện
        document.getElementById('search-input').oninput = handleSearch;
        document.getElementById('sort-name-asc').onclick = () => handleSort('name-asc');
        document.getElementById('sort-name-desc').onclick = () => handleSort('name-desc');
        document.getElementById('sort-price-asc').onclick = () => handleSort('price-asc');
        document.getElementById('sort-price-desc').onclick = () => handleSort('price-desc');
    })
    .catch(error => {
        console.error('Lỗi khi load dữ liệu:', error);
    });
