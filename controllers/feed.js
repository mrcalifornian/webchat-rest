const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');
const user = require('../models/user');
// const { query } = require('express');

exports.getPosts = async (req, res, next) => {
    const currPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    try {
        totalItems = await Post.find().countDocuments();
        const posts = await Post.find().populate('creator').skip((currPage - 1) * perPage).limit(perPage);

        res.status(200).json({
            message: 'Posts fetched successfuly!',
            posts: posts,
            totalItems: totalItems
        });

    } catch (error) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);

    }
}

exports.createPost = async (req, res, next) => {

    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const error = new Error("Validation failed!");
            error.statusCode = 422;
            throw error;
        }

        if (!req.file) {
            const error = new Error('No image provided!');
            error.statusCode = 404;
            throw error;
        }

        const title = req.body.title;
        const content = req.body.content;
        const imageUrl = req.file.path.replace("\\", "/");

        let creator;
        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: req.userID
        });

        let result = await post.save();
        let user = await User.findById(req.userID);

        creator = user;
        user.posts.push(post);
        await user.save();

        res.status(201).json({
            message: 'Post created successfully',
            post: post,
            creator: { _id: creator._id, name: creator.name }
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}


exports.getPost = async (req, res, next) => {

    try {
        const postID = req.params.postID;
        let post = await Post.findById(postID);

        if (!post) {
            const error = new Error('Could not find the post!');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message: 'Post found!',
            post: post
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updatePost = async (req, res, next) => {

    try {

        let postID = req.params.postID;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const error = new Error("Validation failed!");
            error.statusCode = 422;
            throw error;
        }

        const title = req.body.title;
        const content = req.body.content;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = req.file.path.replace("\\", "/");
        }

        if (!imageUrl) {
            const error = new Error('No file picked');
            error.statusCode = 422;
            throw error;
        }

        let post = await Post.findById(postID);

        if (!post) {
            const error = new Error('Could not find the post!');
            error.statusCode = 404;
            throw error;
        }

        if (post.creator.toString() !== req.userID) {
            const error = new Error("Not authorized");
            error.statusCode = 403;
            throw error;
        }

        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }

        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        let result = await post.save();

        res.status(200).json({ message: 'Post Update', post: result });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deletePost = async (req, res, next) => {


    try {
        let postID = req.params.postID;
        let post = await Post.findById(postID);

        if (!post) {
            const error = new Error('Could not find the post!');
            error.statusCode = 404;
            throw error;
        }

        if (post.creator.toString() !== req.userID) {
            const error = new Error("Not authorized");
            error.statusCode = 403;
            throw error;
        }

        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postID);

        let user = await User.findById(req.userID);

        user.posts.pull(postID);
        await user.save();

        res.status(200).json({ message: 'Post Deleted' });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);

    fs.unlink(filePath, err => {
        err ? console.log(err) : '';
    })
}