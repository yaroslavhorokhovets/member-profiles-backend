const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error });
  }
};

exports.createProfile = async (req, res) => {
  const { name, headline, bio, photoUrl, interests } = req.body;

  try {
    const profile = await prisma.profile.create({
      data: {
        userId: req.user.userId,
        name,
        headline,
        bio,
        photoUrl,
        interests
      }
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create profile', error });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, headline, bio, photoUrl, interests } = req.body;

  try {
    const updated = await prisma.profile.update({
      where: { userId: req.user.userId },
      data: { name, headline, bio, photoUrl, interests }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    await prisma.profile.delete({ where: { userId: req.user.userId } });
    res.json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete profile', error });
  }
};
