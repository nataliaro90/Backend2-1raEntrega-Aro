const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register', passport.authenticate('register', {
    failureRedirect: '/register',
    failureFlash: true
}), async (req, res) => {
    res.status(201).json({ status: 'success', message: 'Usuario registrado exitosamente.', user: req.user });
});

router.post('/login', passport.authenticate('login', {
    failureRedirect: '/login',
    failureFlash: true
}), async (req, res) => {
    if (!req.user) {
        return res.status(400).json({ status: 'error', message: 'Credenciales inválidas.' });
    }

    const user = req.user;

    const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, process.env.SECRET_JWT, { expiresIn: '1h' });

    res.status(200).json({
        status: 'success',
        message: 'Inicio de sesión exitoso.',
        user: {
            _id: user._id,
            first_name: user.first_name,
            email: user.email,
            role: user.role,
            cart: user.cart
        },
        token: token
    });
});

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    const user = req.user;
    res.json({
        status: 'success',
        user: {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            age: user.age,
            role: user.role,
            cart: user.cart
        }
    });
});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al destruir la sesión:', err);
                return res.status(500).json({ status: 'error', message: 'Error al cerrar sesión.' });
            }
            res.redirect('/login');
        });
    });
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');

router.get('/protected-route', isAuthenticated, (req, res) => {
    res.send(`Bienvenido a la ruta protegida, ${req.user.first_name}!`);
});
}

module.exports = router;