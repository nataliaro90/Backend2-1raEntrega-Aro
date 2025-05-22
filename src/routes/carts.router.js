const express = require('express');
const router = express.Router();
const cartDao = require('../dao/CartDao');

const productDao = require('../dao/ProductDao');

router.post('/', async (req, res) => {
    try {
        const newCart = await cartDao.createCart();
        res.status(201).json({ status: 'success', payload: newCart, message: 'Carrito creado exitosamente.' });
    } catch (error) {
        console.error('Error en POST /api/carts:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor al crear carrito.' });
    }
});

router.get('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await cartDao.getCartById(cartId);

        if (cart) {
            res.json({ status: 'success', payload: cart });
        } else {
            res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        }
    } catch (error) {
        console.error('Error en GET /api/carts/:cid:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

router.post('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const { quantity = 1 } = req.body;
        const updatedCart = await cartDao.addProductToCart(cartId, productId, quantity);
        res.status(200).json({ status: 'success', payload: updatedCart, message: 'Producto agregado al carrito exitosamente.' });

    } catch (error) {
        console.error('Error en POST /api/carts/:cid/products/:pid:', error);
        if (error.message.includes('Carrito no encontrado')) {
            res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        } else if (error.message.includes('Producto no encontrado') || error.message.includes('Cast to ObjectId failed for value')) {
            res.status(404).json({ status: 'error', message: 'Producto o Carrito no encontrado (ID inválido).' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al agregar producto al carrito.' });
        }
    }
});

router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;

        const updatedCart = await cartDao.removeProductFromCart(cartId, productId);
        res.json({ status: 'success', payload: updatedCart, message: 'Producto eliminado del carrito exitosamente.' });
    } catch (error) {
        console.error('Error en DELETE /api/carts/:cid/products/:pid:', error);
        if (error.message.includes('Carrito no encontrado')) {
            res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        } else if (error.message.includes('Producto no encontrado en el carrito')) {
            res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al eliminar producto del carrito.' });
        }
    }
});

router.put('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const newProductsArray = req.body.products;

        if (!Array.isArray(newProductsArray)) {
            return res.status(400).json({ status: 'error', message: 'El cuerpo de la solicitud debe contener un arreglo "products".' });
        }

        const updatedCart = await cartDao.updateCartProducts(cartId, newProductsArray);
        res.json({ status: 'success', payload: updatedCart, message: 'Carrito actualizado exitosamente con nuevos productos.' });
    } catch (error) {
        console.error('Error en PUT /api/carts/:cid:', error);
        if (error.message.includes('Carrito no encontrado')) {
            res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        } else if (error.message.includes('no existen')) {
            res.status(400).json({ status: 'error', message: error.message });
        } else if (error.message.includes('cantidad')) {
            res.status(400).json({ status: 'error', message: error.message });
        } else {
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al actualizar el carrito.' });
        }
    }
});


router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const { quantity } = req.body;

        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({ status: 'error', message: 'La cantidad debe ser un número positivo.' });
        }
        const updatedCart = await cartDao.updateProductQuantity(cartId, productId, quantity);
        res.json({ status: 'success', payload: updatedCart, message: 'Cantidad de producto actualizada exitosamente.' });

    } catch (error) {
        console.error('Error en PUT /api/carts/:cid/products/:pid (cantidad):', error);
        if (error.message.includes('Carrito no encontrado')) {
            res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        } else if (error.message.includes('Producto no encontrado en el carrito')) {
            res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al actualizar la cantidad del producto.' });
        }
    }
});

router.delete('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const updatedCart = await cartDao.emptyCart(cartId);

        res.json({ status: 'success', payload: updatedCart, message: 'Todos los productos han sido eliminados del carrito.' });
    } catch (error) {
        console.error('Error en DELETE /api/carts/:cid:', error);
        if (error.message.includes('Carrito no encontrado')) {
            res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al vaciar el carrito.' });
        }
    }
});

module.exports = router;