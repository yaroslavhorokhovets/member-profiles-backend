const { PrismaClient } = require('@prisma/client');
const stripe = require('../config/stripe');
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

const createPaymentIntent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, currency = 'usd', subscriptionType } = req.body;

    if (!amount || !subscriptionType) {
      return res.status(400).json({ error: 'Amount and subscription type are required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency,
      metadata: {
        userId: userId,
        subscriptionType: subscriptionType
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    res.status(201).json({
      customerId: customer.id,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

const createSubscription = async (req, res) => {
  try {
    const { userId } = req.user;
    const { priceId, paymentMethodId } = req.body;

    if (!priceId || !paymentMethodId) {
      return res.status(400).json({ error: 'Price ID and payment method ID are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Customer not found. Please create a customer first.' });
    }

    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });

    res.status(201).json({
      subscriptionId: subscription.id,
      status: subscription.status,
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    res.status(200).json({
      message: 'Subscription will be cancelled at the end of the current period',
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

const getPaymentMethods = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card'
    });

    res.status(200).json({
      paymentMethods: paymentMethods.data
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
};

const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('Subscription created:', subscription.id);
      break;
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log('Subscription updated:', updatedSubscription.id);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Subscription deleted:', deletedSubscription.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSubscriptionStatus,
  createPaymentIntent,
  createCustomer,
  createSubscription,
  cancelSubscription,
  getPaymentMethods,
  webhookHandler
};