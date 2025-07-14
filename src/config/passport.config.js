const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const UserDao = require('../dao/UserDao');
const CartDao = require('../dao/CartDao');

const userDao = new UserDao();
const cartDao = new CartDao();

const initializePassport = () => {
    passport.use('register', new LocalStrategy({
        passReqToCallback: true,
        usernameField: 'email'
    }, async (req, email, password, done) => {
        try {
            const user = await userDao.findByEmail(email);
            if (user) {
                console.log('El usuario ya existe');
                return done(null, false, { message: 'El usuario ya existe' });
            }

            const newCart = await cartDao.createCart();
            if (!newCart) {
                console.error('Error al crear el carrito para el usuario');
                return done(null, false, { message: 'Error al crear el carrito' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                age: req.body.age,
                email: email,
                password: hashedPassword,
                role: 'user',
                cart: newCart._id
            };

            const result = await userDao.registerUser(newUser);
            return done(null, result);

        } catch (error) {
            console.error('Error en estrategia de registro:', error);
            return done(error);
        }
    }));

    passport.use('login', new LocalStrategy({
        usernameField: 'email'
    }, async (email, password, done) => {
        try {
            const user = await userDao.findByEmail(email);
            if (!user) {
                console.log('Usuario no encontrado');
                return done(null, false, { message: 'Usuario no encontrado' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Credenciales inválidas');
                return done(null, false, { message: 'Credenciales inválidas' });
            }

            return done(null, user);
        } catch (error) {
            console.error('Error en estrategia de login:', error);
            return done(error);
        }
    }));

    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRET_JWT
    }, async (jwt_payload, done) => {
        try {
            const user = await userDao.findById(jwt_payload.sub);
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (error) {
            return done(error, false);
        }
    }));


    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userDao.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};

module.exports = initializePassport;