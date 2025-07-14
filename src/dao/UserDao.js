const User = require('./models/User');
class UserDao {
    constructor() {
        console.log('👤 Inicializando UserDao con MongoDB');
    }

    async registerUser(userData) {
        try {
            const newUser = new User(userData);
            return await newUser.save();
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            throw new Error('Error al registrar el usuario.');
        }
    }

    async findByEmail(email) {
        try {
            return await User.findOne({ email }).lean();
        } catch (error) {
            console.error(`Error al buscar usuario por email ${email}:`, error);
            return null;
        }
    }

    async findById(id) {
        try {
            return await User.findById(id).lean();
        } catch (error) {
            console.error(`Error al buscar usuario por ID ${id}:`, error);
            return null;
        }
    }

    async updatePassword(id, newPassword) {
        try {
            const user = await User.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado.');
            }
            user.password = newPassword;
            return await user.save();
        } catch (error) {
            console.error(`Error al actualizar contraseña del usuario ${id}:`, error);
            throw error;
        }
    }
}

module.exports = UserDao;