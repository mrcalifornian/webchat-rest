const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config()

const authMiddleware = require('./middleware/is-auth');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const PORT = 8080;
const DBLINK = process.env.MONGODB;

const app = express();

// Handling files
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, `${new Date().toISOString().replace(/:/g, "")}${file.originalname}`);
    }

});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}



// body parser
app.use(bodyParser.json());

app.use(multer({ storage: fileStorage, fileFilter: fileFilter, dest: 'images/' }).single('image'));

app.use('/images', express.static(path.join(__dirname, '/images/')));

app.use(cors());

app.use((req, res, next) => {
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Route definitions
app.use('/feed', authMiddleware, feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
})

mongoose.set('strictQuery', true);

mongoose.connect(DBLINK)
    .then(res => {
        console.log('DB Connected');
        app.listen(PORT, () => {
            console.log(`Server listening on ${PORT}`);
        });
    })
    .catch(err => {
        console.log(err);
    });
