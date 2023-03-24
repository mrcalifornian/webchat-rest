const User = require("../models/user");
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const error = new Error();
            error.statuscode = 422;
            error.data = errors.array();
            throw error;
        }


        const email = req.body.email;
        const name = req.body.name;
        const password = req.body.password;

        let hashedP = await bcrypt.hash(password, 12);

        const user = new User({
            email: email,
            password: hashedP,
            name: name
        });

        let result = await user.save();

        res.status(201).json({ message: 'User created', userID: result._id });

    } catch (error) {
        if (!err.statuscode) {
            err.statuscode = 500;
        }

        next(err);
    }
}

exports.login = async (req, res, next) => {

    try {
        const email = req.body.email;
        const password = req.body.password;
        let loadedUser;

        let user = await User.findOne({ email: email });

        if (!user) {
            const error = new Error('User with this email not found!');
            error.statuscode = 401;
            throw error;
        }

        loadedUser = user;
        let isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {
            const error = new Error('Wrong password');
            error.statuscode = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                email: loadedUser.email,
                userID: loadedUser._id.toString()
            },
            'mysupersecretisnothere',
            { expiresIn: '1h' }
        );

        res.status(200).json({ token: token, userId: loadedUser._id.toString() });

    } catch (err) {
        if (!err.statuscode) {
            err.statuscode = 500;
        }
        next(err);
    }
}