const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/login', chatController.loginUser);
router.get('/users', chatController.getUsers);
router.get('/messages/:user1/:user2', chatController.getMessages);

module.exports = router;