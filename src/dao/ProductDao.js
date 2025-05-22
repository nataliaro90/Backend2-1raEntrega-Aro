const Product = require('./models/Product');

class ProductDao {
    constructor() {
        console.log('📦 Inicializando ProductDao con MongoDB');
    }

    async getProducts(options) {
        try {
            const { limit = 10, page = 1, sort, query } = options;

            const queryOptions = {};
            if (query) {
                const [field, value] = query.split(':');
                if (field && value) {
                    if (field === 'status') {
                        queryOptions[field] = (value.toLowerCase() === 'true');
                    } else {
                        queryOptions[field] = value;
                    }
                }
            }

            const sortOptions = {};
            if (sort) {
                if (sort === 'asc') {
                    sortOptions.price = 1;
                } else if (sort === 'desc') {
                    sortOptions.price = -1;
                }
            }

            const paginateOptions = {
                limit: parseInt(limit),
                page: parseInt(page),
                sort: sortOptions,
                lean: true
            };

            const result = await Product.paginate(queryOptions, paginateOptions);

            const response = {
                status: 'success',
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null,
                nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null
            };

            return response;

        } catch (error) {
            console.error('Error al obtener productos:', error);
            return {
                status: 'error',
                payload: [],
                totalPages: 0,
                prevPage: null,
                nextPage: null,
                page: 1,
                hasPrevPage: false,
                hasNextPage: false,
                prevLink: null,
                nextLink: null,
                message: 'Error al obtener productos del DAO.'
            };
        }
    }

    async addProduct(productData) {
        try {
            const newProduct = new Product(productData);
            return await newProduct.save();
        } catch (error) {
            console.error('Error al agregar producto:', error);
            throw new Error('Error al agregar producto.');
        }
    }

    async getProductById(id) {
        try {
            return await Product.findById(id).lean();
        } catch (error) {
            console.error(`Error al obtener producto por ID ${id}:`, error);
            return null;
        }
    }

    async updateProduct(id, newData) {
        try {
            const updatedProduct = await Product.findByIdAndUpdate(id, newData, { new: true });
            if (!updatedProduct) {
                throw new Error('Producto no encontrado para actualizar.');
            }
            return updatedProduct;
        } catch (error) {
            console.error(`Error al actualizar producto ${id}:`, error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const result = await Product.findByIdAndDelete(id);
            if (!result) {
                return false;
            }
            return true;
        } catch (error) {
            console.error(`Error al eliminar producto ${id}:`, error);
            throw error;
        }
    }
}

module.exports = new ProductDao();