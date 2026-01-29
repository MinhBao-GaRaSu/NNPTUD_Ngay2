// Đổi sang fetch từ GitHub khi deploy, ví dụ:
// const apiUrl = 'https://raw.githubusercontent.com/your-username/your-repo/main/db.json';
const apiUrl = './db.json';

let db = null;
let filteredProducts = [];
let currentSort = '';
let selectedProductId = null;

// Lấy maxId từ database
function getMaxId() {
    return db.maxId;
}

// Tăng maxId và lưu vào database
function incrementMaxId() {
    db.maxId++;
    return db.maxId;
}

// Lưu database vào localStorage (để mô phỏng lưu trữ)
function saveDatabase() {
    localStorage.setItem('productDB', JSON.stringify(db));
}

// CRUD cho Comments
function addComment(productId, authorName, content) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return null;
    
    const commentId = Date.now().toString();
    const comment = {
        id: commentId,
        author: authorName,
        content: content,
        createdAt: new Date().toISOString(),
        isDeleted: false
    };
    
    product.comments.push(comment);
    saveDatabase();
    return comment;
}

function getComments(productId) {
    const product = db.products.find(p => p.id === productId);
    return product ? product.comments.filter(c => !c.isDeleted) : [];
}

function updateComment(productId, commentId, newContent) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return null;
    
    const comment = product.comments.find(c => c.id === commentId);
    if (!comment) return null;
    
    comment.content = newContent;
    comment.updatedAt = new Date().toISOString();
    saveDatabase();
    return comment;
}

function deleteComment(productId, commentId) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return false;
    
    const comment = product.comments.find(c => c.id === commentId);
    if (!comment) return false;
    
    comment.isDeleted = true;
    saveDatabase();
    return true;
}

// CRUD cho Products
function deleteProduct(productId) {
    const product = db.products.find(p => p.id === productId);
    if (product) {
        product.isDeleted = true;
        saveDatabase();
        return true;
    }
    return false;
}

function restoreProduct(productId) {
    const product = db.products.find(p => p.id === productId);
    if (product) {
        product.isDeleted = false;
        saveDatabase();
        return true;
    }
    return false;
}

function createProduct(productData) {
    const newId = incrementMaxId().toString();
    const newProduct = {
        id: newId,
        ...productData,
        isDeleted: false,
        comments: [],
        creationAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    db.products.push(newProduct);
    saveDatabase();
    return newProduct;
}

function updateProduct(productId, updatedData) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return null;
    
    Object.assign(product, updatedData, { updatedAt: new Date().toISOString() });
    saveDatabase();
    return product;
}

function renderTable(data) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    
    data.forEach(item => {
        const imgSrc = item.image || (Array.isArray(item.images) && item.images[0]) || 'https://placehold.co/600x400';
        const categoryName = item.category && item.category.name ? item.category.name : '';
        const row = document.createElement('tr');
        
        // Áp dụng strikethrough cho sản phẩm bị xóa
        if (item.isDeleted) {
            row.style.textDecoration = 'line-through';
            row.style.opacity = '0.6';
        }
        
        // Ảnh
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

        // Tên sản phẩm
        const titleTd = document.createElement('td');
        titleTd.textContent = item.title || '';
        
        // Giá
        const priceTd = document.createElement('td');
        priceTd.textContent = item.price;
        
        // Danh mục
        const categoryTd = document.createElement('td');
        categoryTd.textContent = categoryName;
        
        // Mô tả
        const descTd = document.createElement('td');
        descTd.textContent = item.description || '';

        // Hành động
        const actionTd = document.createElement('td');
        actionTd.className = 'text-center';
        
        // Nút xem comments
        const viewCommentsBtn = document.createElement('button');
        viewCommentsBtn.className = 'btn btn-sm btn-info me-2';
        viewCommentsBtn.textContent = '💬';
        viewCommentsBtn.onclick = () => showCommentsSection(item.id);
        actionTd.appendChild(viewCommentsBtn);
        
        if (item.isDeleted) {
            // Nút khôi phục
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn btn-sm btn-success me-2';
            restoreBtn.textContent = 'Khôi phục';
            restoreBtn.onclick = () => {
                restoreProduct(item.id);
                handleSearch();
            };
            actionTd.appendChild(restoreBtn);
        } else {
            // Nút xóa
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.textContent = 'Xóa';
            deleteBtn.onclick = () => {
                if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                    deleteProduct(item.id);
                    handleSearch();
                }
            };
            actionTd.appendChild(deleteBtn);
        }

        row.appendChild(imgTd);
        row.appendChild(titleTd);
        row.appendChild(priceTd);
        row.appendChild(categoryTd);
        row.appendChild(descTd);
        row.appendChild(actionTd);
        productList.appendChild(row);
    });
}

function showCommentsSection(productId) {
    selectedProductId = productId;
    const product = db.products.find(p => p.id === productId);
    
    const commentsSection = document.getElementById('comments-section');
    commentsSection.innerHTML = '';
    
    const title = document.createElement('h4');
    title.textContent = `Bình luận cho: ${product.title}`;
    commentsSection.appendChild(title);
    
    // Form thêm comment
    const formDiv = document.createElement('div');
    formDiv.className = 'card p-3 mb-3';
    formDiv.innerHTML = `
        <h5>Thêm bình luận mới</h5>
        <div class="mb-2">
            <label>Tên người bình luận:</label>
            <input type="text" id="comment-author" class="form-control" placeholder="Nhập tên của bạn">
        </div>
        <div class="mb-2">
            <label>Nội dung:</label>
            <textarea id="comment-content" class="form-control" rows="3" placeholder="Viết bình luận..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="submitComment('${productId}')">Gửi bình luận</button>
    `;
    commentsSection.appendChild(formDiv);
    
    // Danh sách comments
    const comments = getComments(productId);
    
    if (comments.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'alert alert-secondary';
        emptyMsg.textContent = 'Chưa có bình luận nào';
        commentsSection.appendChild(emptyMsg);
    } else {
        const commentsList = document.createElement('div');
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'card mb-2 p-2';
            commentDiv.innerHTML = `
                <div>
                    <strong>${comment.author}</strong>
                    <small class="text-muted">${new Date(comment.createdAt).toLocaleString('vi-VN')}</small>
                </div>
                <p class="mb-2">${comment.content}</p>
                <button class="btn btn-sm btn-warning me-2" onclick="editCommentUI('${productId}', '${comment.id}')">Sửa</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCommentUI('${productId}', '${comment.id}')">Xóa</button>
            `;
            commentsList.appendChild(commentDiv);
        });
        commentsSection.appendChild(commentsList);
    }
}

function submitComment(productId) {
    const author = document.getElementById('comment-author').value.trim();
    const content = document.getElementById('comment-content').value.trim();
    
    if (!author || !content) {
        alert('Vui lòng điền đầy đủ tên và nội dung');
        return;
    }
    
    addComment(productId, author, content);
    document.getElementById('comment-author').value = '';
    document.getElementById('comment-content').value = '';
    showCommentsSection(productId);
}

function editCommentUI(productId, commentId) {
    const product = db.products.find(p => p.id === productId);
    const comment = product.comments.find(c => c.id === commentId);
    
    const newContent = prompt('Sửa bình luận:', comment.content);
    if (newContent !== null) {
        updateComment(productId, commentId, newContent);
        showCommentsSection(productId);
    }
}

function deleteCommentUI(productId, commentId) {
    if (confirm('Xóa bình luận này?')) {
        deleteComment(productId, commentId);
        showCommentsSection(productId);
    }
}

function handleSearch() {
    const searchValue = document.getElementById('search-input').value.trim().toLowerCase();
    // Hiển thị cả sản phẩm chưa xóa và đã xóa
    filteredProducts = db.products.filter(item => item.title && item.title.toLowerCase().includes(searchValue));
    handleSort(currentSort);
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
        // Kiểm tra cấu trúc dữ liệu
        if (data.products && Array.isArray(data.products)) {
            db = data;
        } else if (Array.isArray(data)) {
            // Tương thích với cấu trúc cũ
            db = { maxId: 233, products: data };
        } else {
            console.error('Dữ liệu JSON không đúng định dạng:', data);
            return;
        }
        
        // Khôi phục database từ localStorage nếu có
        const savedDB = localStorage.getItem('productDB');
        if (savedDB) {
            db = JSON.parse(savedDB);
        }
        
        filteredProducts = db.products;
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
