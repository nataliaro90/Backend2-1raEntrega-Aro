const express = require('express');
const router = express.Router();
const productDao = require('../dao/ProductDao');
const cartDao = require('../dao/CartDao');

router.get('/', async (req, res) => {
    try {
        const options = {
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort,
            query: req.query.query
        };

        const result = await productDao.getProducts(options);

        const baseUrl = req.protocol + '://' + req.get('host') + req.baseUrl; // http://localhost:8080/
        const getPaginatingLink = (page) => {
            let link = `${baseUrl}?page=${page}`;
            if (options.limit) link += `&limit=${options.limit}`;
            if (options.sort) link += `&sort=${options.sort}`;
            if (options.query) link += `&query=${options.query}`;
            return link;
        };

        res.render('home', {
            title: 'Lista de Productos',
            products: result.payload,
            user: req.session.user,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? getPaginatingLink(result.prevPage) : null,
            nextLink: result.hasNextPage ? getPaginatingLink(result.nextPage) : null
        });
    } catch (error) {
        console.error('Error al renderizar home:', error);
        res.status(500).send('Error interno del servidor al cargar la vista home.');
    }
});

router.get('/realtimeproducts', async (req, res) => {
    try {
        const result = await productDao.getProducts({});
        res.render('realTimeProducts', {
            title: 'Productos en Tiempo Real',
            products: result.payload
        });
    } catch (error) {
        console.error('Error al renderizar realTimeProducts:', error);
        res.status(500).send('Error interno del servidor al cargar la vista de productos en tiempo real.');
    }
});

router.get('/carts/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await cartDao.getCartById(cartId);

        if (cart) {
            const productsWithSubtotal = cart.products.map(item => {
                const productData = item.product.toObject ? item.product.toObject() : item.product;

                return {
                    ...item.toObject(),
                    product: productData,
                    subtotal: productData.price * item.quantity
                };
            });

            const totalCartPrice = productsWithSubtotal.reduce((acc, item) => acc + item.subtotal, 0);

            res.render('cartDetail', {
                title: `Detalle del Carrito ${cartId}`,
                cart: cart.toObject(),
                products: productsWithSubtotal,
                totalCartPrice: totalCartPrice
            });
        } else {
            res.status(404).render('error', { message: 'Carrito no encontrado.', title: 'Error' });
        }
    } catch (error) {
        console.error('Error al renderizar el detalle del carrito:', error);
        res.status(500).render('error', { message: 'Error interno del servidor al cargar el carrito.', title: 'Error' });
    }
});

module.exports = router;