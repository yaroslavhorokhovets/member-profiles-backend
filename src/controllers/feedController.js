// controllers/feedController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getProfiles = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6; // or make this configurable
  const skip = (page - 1) * limit;
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: {
          not: req.user.userId, // exclude current user
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
      skip,
      take: limit,
    });

    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching feed", error });
  }
};

exports.followUser = async (req, res) => {
  const { userIdToFollow } = req.body;

  try {
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.userId,
          followingId: userIdToFollow,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "Already following" });
    }

    await prisma.follow.create({
      data: {
        followerId: req.user.userId,
        followingId: userIdToFollow,
      },
    });

    res.json({ message: "Now following user" });
  } catch (err) {
    res.status(500).json({ message: "Failed to follow", error: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  const userIdToUnfollow = req.params.userId;

  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.user.userId,
          followingId: userIdToUnfollow,
        },
      },
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to unfollow", error: err.message });
  }
};
