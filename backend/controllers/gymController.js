// backend/controllers/gymController.js
import * as gymService from "../functions/gymService.js"; // Import the service module

/**
 * Create a new gym profile.
 */
export const createGym = async (req, res) => {
  try {
    const gymData = {
      name: req.body.name,
      location: req.body.location,
      description: req.body.description,
      image: req.body.image || "",
      ownerId: req.body.ownerId,

      // Ensure these match frontend payload and service expectations
      features: req.body.features || "", // Storing as string, might need array if multi-select
      memberCount: req.body.memberCount || 0,
      // FIX: Aligning with frontend's single 'pricing' field.
      // If you need dayPassPrice and monthlyPrice separately, adjust frontend and backend.
      pricing: req.body.pricing || "", // Assuming frontend sends 'pricing'
      offers: req.body.offers || "",
      website: req.body.website || "", // Currently not in frontend submission
    };

    const result = await gymService.createGym(gymData); // Call the service
    res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Fetch all gyms.
 */
export const getGyms = async (req, res) => {
  try {
    const result = await gymService.getAllGyms(); // Call the service
    res.status(200).json({ success: true, gyms: result.gyms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Fetch the current user's gym (for editing).
 */
export const getMyGym = async (req, res) => {
  try {
    const { uid } = req.user;
    const result = await gymService.getGymsByOwner(uid); // Call the service, use the user's UID
    // Assuming getGymsByOwner returns an array, and getMyGym should return a single gym if found.
    if (result.gyms && result.gyms.length > 0) {
      return res.status(200).json({ success: true, gym: result.gyms[0] });
    } else {
      return res.status(200).json({ success: true, gym: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Fetch gyms owned by a specific user ID.
 * This controller is added to expose the gymService.getGymsByOwner functionality.
 */
export const getGymsByOwner = async (req, res) => {
  try {
    // If this route is protected by verifyUser, req.user.uid is available.
    // If it's meant for public viewing of an owner's gyms, then ownerId would be in req.params.
    // Assuming it's for the *current* user's gyms, similar to getMyGym but potentially returning all.
    const ownerId = req.user.uid; // Use uid from verified token
    const result = await gymService.getGymsByOwner(ownerId);
    res.status(200).json({ success: true, gyms: result.gyms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update gym info.
 */
export const updateGym = async (req, res) => {
  try {
    const gymId = req.params.gymId;
    const updates = {
      name: req.body.name,
      location: req.body.location,
      description: req.body.description,
      image: req.body.image,
      features: req.body.features,
      memberCount: req.body.memberCount,
      // FIX: Aligning with frontend's single 'pricing' field
      pricing: req.body.pricing,
      offers: req.body.offers,
      website: req.body.website,
    };

    // Filter out undefined/null values to only update provided fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined && v !== null),
    );

    await gymService.updateGym(gymId, filteredUpdates); // Call the service
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete a gym.
 */
export const deleteGym = async (req, res) => {
  try {
    const gymId = req.params.gymId;
    await gymService.deleteGym(gymId); // Call the service
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
