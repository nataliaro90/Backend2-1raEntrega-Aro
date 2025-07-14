const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const initializePassport = require('./config/passport.config');

require('dotenv').config();

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');
const sessionsRouter = require('./routes/sessions.router');

const productDao = require('./dao/ProductDao');


const app = express();
const PORT = process.env.PORT || 8080;

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('🚀 Conectado a MongoDB'))
    .catch(err => console.error('❌ Error al conectar a MongoDB:', err));


const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET, //
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 60 * 60 * 24 //
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.errorMessage = req.flash('error');
    res.locals.successMessage = req.flash('success');
    next();
});

app.use(express.static(path.join(__dirname, './public')));


app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        multiply: (a, b) => a * b,
        isLoggedIn: function(user, options) {
            if (user && user.id) {
                return options.fn(this);
            }
            return options.inverse(this);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));


app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/', viewsRouter);

io.on('connection', (socket) => {
    console.log('🟢 Nuevo cliente conectado');

    socket.on('requestInitialProducts', async () => {
        try {
            const result = await productDao.getProducts({});
            socket.emit('actualizarProductos', result.payload);
        } catch (error) {
            console.error('Error al obtener productos iniciales para WS:', error);
        }
    });

    socket.on('nuevoProducto', async (product) => {
        try {
            await productDao.addProduct(product);
            const result = await productDao.getProducts({});
            io.emit('actualizarProductos', result.payload);
        } catch (error) {
            console.error('Error al agregar producto via WS:', error.message);
            socket.emit('errorAddingProduct', error.message);
        }
    });

    socket.on('eliminarProducto', async (id) => {
        try {
            const success = await productDao.deleteProduct(id);
            if (success) {
                const result = await productDao.getProducts({});
                io.emit('actualizarProductos', result.payload);
            } else {
                console.log(`Producto con ID ${id} no encontrado para eliminar.`);
                socket.emit('errorDeletingProduct', 'Producto no encontrado o no se pudo eliminar.');
            }
        } catch (error) {
            console.error('Error al eliminar producto via WS:', error);
            socket.emit('errorDeletingProduct', error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 Cliente desconectado');
    });
});

httpServer.listen(PORT, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});