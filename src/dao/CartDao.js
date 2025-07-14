const Cart = require('./models/Cart');
const Product = require('./models/Product');

class CartDao {
    constructor() {
        console.log('🛒 Inicializando CartDao con MongoDB');
    }

    async createCart() {
        try {
            const newCart = new Cart({ products: [] });
            return await newCart.save();
        } catch (error) {
            console.error('Error al crear carrito:', error);
            throw new Error('Error al crear un nuevo carrito.');
        }
    }

    async getCartById(cartId) {
        try {
            return await Cart.findById(cartId).populate('products.product').lean();
        } catch (error) {
            console.error(`Error al obtener carrito por ID ${cartId}:`, error);
            return null;
        }
    }

    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado.');
            }

            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Producto no encontrado.');
            }

            const productInCart = cart.products.find(item => item.product.toString() === productId);

            if (productInCart) {
                productInCart.quantity += quantity;
            } else {
                cart.products.push({ product: productId, quantity: quantity });
            }

            return await cart.save();
        } catch (error) {
            console.error(`Error al agregar producto ${productId} al carrito ${cartId}:`, error);
            throw error;
        }
    }

    async removeProductFromCart(cartId, productId) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado.');
            }

            const initialLength = cart.products.length;
            cart.products = cart.products.filter(item => item.product.toString() !== productId);

            if (cart.products.length === initialLength) {
                throw new Error('Producto no encontrado en el carrito.');
            }

            return await cart.save();
        } catch (error) {
            console.error(`Error al eliminar producto ${productId} del carrito ${cartId}:`, error);
            throw error;
        }
    }

    async updateProductQuantity(cartId, productId, quantity) {
        try {
            if (quantity <= 0) {
                return await this.removeProductFromCart(cartId, productId);
            }

            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado.');
            }

            const productInCart = cart.products.find(item => item.product.toString() === productId);

            if (productInCart) {
                productInCart.quantity = quantity;
            } else {
                throw new Error('Producto no encontrado en el carrito para actualizar cantidad.');
            }

            return await cart.save();
        } catch (error) {
            console.error(`Error al actualizar cantidad del producto ${productId} en el carrito ${cartId}:`, error);
            throw error;
        }
    }

    async updateCartProducts(cartId, newProductsArray) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado.');
            }

            const productIds = newProductsArray.map(item => item.product);
            const existingProducts = await Product.find({ _id: { $in: productIds } });

            if (existingProducts.length !== productIds.length) {
                throw new Error('Uno o más productos en el array proporcionado no existen.');
            }

            const validProducts = newProductsArray.map(item => {
                if (item.quantity <= 0) {
                    throw new Error(`La cantidad para el producto ${item.product} debe ser al menos 1.`);
                }
                return { product: item.product, quantity: item.quantity };
            });

            cart.products = validProducts;
            return await cart.save();
        } catch (error) {
            console.error(`Error al actualizar los productos del carrito ${cartId}:`, error);
            throw error;
        }
    }

    async emptyCart(cartId) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado.');
            }

            cart.products = [];
            return await cart.save();
        } catch (error) {
            console.error(`Error al vaciar carrito ${cartId}:`, error);
            throw error;
        }
    }
}

module.exports = CartDao;