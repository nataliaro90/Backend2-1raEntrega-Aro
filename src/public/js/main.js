const socket = io();

const productListContainer = document.getElementById('product-list-container');
const initialProductsDisplay = document.getElementById('initial-products-display');
const dynamicProductsDisplay = document.getElementById('dynamic-products-display');
const newProductForm = document.getElementById('new-product-form');

function renderProduct(product) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product-item');
    productDiv.style.border = '1px solid #ccc';
    productDiv.style.padding = '15px';
    productDiv.style.borderRadius = '8px';
    productDiv.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.1)';
    productDiv.dataset.id = product._id;

    let thumbnailsHtml = '';
    if (product.thumbnails && product.thumbnails.length > 0) {
        thumbnailsHtml = `
            <div>
                <strong>Imágenes:</strong>
                <ul style="list-style: none; padding: 0;">
                    ${product.thumbnails.map(thumb => `<li><img src="${thumb}" alt="Producto" style="width: 100px; height: auto; margin-right: 5px;"></li>`).join('')}
                </ul>
            </div>
        `;
    }

    productDiv.innerHTML = `
        <h2>${product.title}</h2>
        <p><strong>Descripción:</strong> ${product.description}</p>
        <p><strong>Precio:</strong> $${product.price}</p>
        <p><strong>Código:</strong> ${product.code}</p>
        <p><strong>Stock:</strong> ${product.stock}</p>
        <p><strong>Categoría:</strong> ${product.category}</p>
        <p><strong>Estado:</strong> ${product.status ? 'Disponible' : 'No disponible'}</p>
        ${thumbnailsHtml}
        <button class="delete-button" data-id="${product._id}">Eliminar</button>
    `;

    const deleteButton = productDiv.querySelector('.delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            const productId = deleteButton.dataset.id;
            console.log('Emitiendo eliminarProducto para ID:', productId);
            socket.emit('eliminarProducto', productId);
        });
    }

    return productDiv;
}

socket.on('actualizarProductos', (products) => {
    console.log('Productos actualizados recibidos del servidor:', products);
    if (dynamicProductsDisplay) {
        dynamicProductsDisplay.innerHTML = '';
        products.forEach(product => {
            dynamicProductsDisplay.appendChild(renderProduct(product));
        });
    }

    if (initialProductsDisplay) {
        initialProductsDisplay.innerHTML = '';
    }
});

socket.on('errorAddingProduct', (message) => {
    alert(`Error al agregar producto: ${message}`);
});

socket.on('errorDeletingProduct', (message) => {
    alert(`Error al eliminar producto: ${message}`);
});


if (newProductForm) {
    newProductForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(newProductForm);
        const product = {};
        formData.forEach((value, key) => {
            if (key === 'price' || key === 'stock') {
                product[key] = parseFloat(value);
            } else if (key === 'status') {
                product[key] = value === 'on';
            } else if (key === 'thumbnails') {
                product[key] = value.split(',').map(url => url.trim()).filter(url => url !== '');
            } else {
                product[key] = value;
            }
        });

        console.log('Emitiendo nuevoProducto:', product);
        socket.emit('nuevoProducto', product);
        newProductForm.reset();
    });
}
