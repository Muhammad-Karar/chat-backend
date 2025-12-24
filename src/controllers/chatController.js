const User = require('../models/User');
const Message = require('../models/Message');

// 1. Join/Login (Find or Create User)
exports.loginUser = async (req, res) => {
  const { username } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({ username });
    }
    // Note: isOnline is handled by Socket, not here, to prevent false positives
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get Chat History (Requirement: Load previous chat messages)
exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 }
      ]
    }).sort({ createdAt: 1 }); // Oldest first
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get All Users (for Contact List)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('username isOnline');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};