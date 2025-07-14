const express = require('express');
const router = express.Router();

const ProductDaoClass = require('../dao/ProductDao');
const CartDaoClass = require('../dao/CartDao');

const productDao = new ProductDaoClass();
const cartDao = new CartDaoClass();


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
            user: req.session.user || null,
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
            products: result.payload,
            user: req.session.user || null
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
                totalCartPrice: totalCartPrice,
                user: req.session.user || null
            });
        } else {
            res.status(404).render('error', { message: 'Carrito no encontrado.', title: 'Error', user: req.session.user || null });
        }
    } catch (error) {
        console.error('Error al renderizar el detalle del carrito:', error);
        res.status(500).render('error', { message: 'Error interno del servidor al cargar el carrito.', title: 'Error', user: req.session.user || null });
    }
});

router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    res.render('register', {
        title: 'Registrarse'
    });
});

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    res.render('login', {
        title: 'Iniciar Sesión'
    });
});

router.get('/profile',
    (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('profile', {
        title: 'Mi Perfil',
        user: req.session.user
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('No se pudo cerrar la sesión.');
        }
        res.redirect('/login');
    });
});

module.exports = router;