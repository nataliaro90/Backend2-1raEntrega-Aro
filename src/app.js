const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');

const productDao = require('./dao/ProductDao');


const app = express();
const PORT = 8080;

const MONGODB_URI = 'mongodb+srv://naty87019:1905Cabj@cluster0.7kfiwqs.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('🚀 Conectado a MongoDB'))
    .catch(err => console.error('❌ Error al conectar a MongoDB:', err));


const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'tuSecretKeySuperSecreta',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


app.use(express.static(path.join(__dirname, 'public')));


app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    helpers: {
        multiply: (a, b) => a * b
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

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