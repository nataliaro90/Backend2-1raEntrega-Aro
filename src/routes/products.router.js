const express = require('express');
const router = express.Router();
const productDao = require('../dao/ProductDao');

router.get('/', async (req, res) => {
    try {
        const options = {
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort,
            query: req.query.query
        };

        const result = await productDao.getProducts(options);
        res.json(result);

    } catch (error) {
        console.error('Error en GET /api/products:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor al obtener productos.' });
    }
});

router.get('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const product = await productDao.getProductById(productId);

        if (product) {
            res.json({ status: 'success', payload: product });
        } else {
            res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error('Error en GET /api/products/:pid:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const newProduct = await productDao.addProduct(req.body);
        res.status(201).json({ status: 'success', payload: newProduct, message: 'Producto agregado exitosamente.' });
    } catch (error) {
        console.error('Error en POST /api/products:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor al agregar producto.' });
    }
});

router.put('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const updatedProduct = await productDao.updateProduct(productId, req.body);
        res.json({ status: 'success', payload: updatedProduct, message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        console.error('Error en PUT /api/products/:pid:', error);
        if (error.message.includes('Producto no encontrado')) {
            res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al actualizar producto.' });
        }
    }
});

router.delete('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const success = await productDao.deleteProduct(productId);
        if (success) {
            res.json({ status: 'success', message: 'Producto eliminado exitosamente.' });
        } else {
            res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error('Error en DELETE /api/products/:pid:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor al eliminar producto.' });
    }
});

module.exports = router;