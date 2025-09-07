const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const followUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ error: 'followingId is required' });
    }

    if (userId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: followingId
      }
    });

    res.status(201).json({
      message: 'Successfully followed user',
      follow: {
        id: follow.id,
        followerId: follow.followerId,
        followingId: follow.followingId
      }
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ error: 'followingId is required' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId
        }
      }
    });

    if (!existingFollow) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId
        }
      }
    });

    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          include: {
            profile: true
          }
        }
      }
    });

    const followerList = followers.map(follow => ({
      id: follow.follower.id,
      email: follow.follower.email,
      profile: follow.follower.profile
    }));

    res.status(200).json({
      followers: followerList,
      count: followerList.length
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          include: {
            profile: true
          }
        }
      }
    });

    const followingList = following.map(follow => ({
      id: follow.following.id,
      email: follow.following.email,
      profile: follow.following.profile
    }));

    res.status(200).json({
      following: followingList,
      count: followingList.length
    });
  } catch (error) {
    console.error('Error getting following list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetUserId } = req.params;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId
        }
      }
    });

    res.status(200).json({
      isFollowing: !!follow,
      followId: follow?.id || null
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSubscriptionStatus
};