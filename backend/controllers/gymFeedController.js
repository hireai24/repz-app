// backend/controllers/gymFeedController.js
import * as gymFeedService from "../functions/gymFeedService.js"; // FIX: Changed to ES Module import

export const getFeedForGym = async (req, res) => {
  try {
    const gymId = req.params.gymId;
    const posts = await gymFeedService.getPostsByGym(gymId);
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createFeedPost = async (req, res) => {
  try {
    const ownerId = req.user.uid;
    const payload = req.body;
    const post = await gymFeedService.createPost(ownerId, payload);
    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteFeedPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const ownerId = req.user.uid;
    await gymFeedService.deletePost(postId, ownerId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(403).json({ success: false, error: error.message });
  }
};