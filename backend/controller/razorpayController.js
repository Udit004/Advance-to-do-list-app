const Razorpay = require('razorpay');
const crypto = require('crypto');
const UserProfile = require('../models/userProfileModel');
const Notification = require('../models/notificationModel');
const PushSubscription = require('../models/pushSubscriptionModel');
const transporter = require('../config/email');
const { sendNotificationToUser } = require('../socket');
const webpush = require('web-push');
const { EMAIL_USER, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;

// Set web-push credentials
webpush.setVapidDetails(`mailto:${EMAIL_USER}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Utility function: Send push notification
const sendPushNotifications = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    
    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return;
    }

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
        console.log('Push notification sent successfully to:', sub.subscription.endpoint);
      } catch (error) {
        console.error('Push notification failed for:', sub.subscription.endpoint, error.message);
        
        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
          console.log('Removed invalid subscription:', sub._id);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error in sendPushNotifications:', error);
  }
};

// Utility function: Send email notification
const sendEmailNotification = async (userEmail, subject, htmlContent) => {
  try {
    if (!userEmail || !transporter) {
      console.log('Email notification skipped - missing email or transporter');
      return;
    }

    await transporter.sendMail({
      from: EMAIL_USER,
      to: userEmail,
      subject,
      html: htmlContent
    });
    console.log('Email notification sent successfully to:', userEmail);
  } catch (error) {
    console.error('Email notification failed:', error);
  }
};

// Utility function: Send complete notification (Socket.IO + Push + Email)
const sendCompleteNotification = async (userId, notificationData, emailData = null) => {
  try {
    // Check if notification already exists to prevent duplicates
    const existingNotification = await Notification.findOne({
      user: userId,
      type: notificationData.type,
      message: notificationData.message
    });

    let notification;
    if (existingNotification) {
      // Update existing notification
      notification = await Notification.findByIdAndUpdate(
        existingNotification._id,
        {
          message: notificationData.message,
          read: false,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      // Create new notification
      notification = await Notification.create({
        user: userId,
        message: notificationData.message,
        type: notificationData.type,
        read: false
      });
    }

    // Send real-time notification via Socket.IO
    sendNotificationToUser(userId, {
      _id: notification._id,
      user: userId,
      message: notificationData.message,
      type: notificationData.type,
      read: false,
      createdAt: notification.createdAt
    });

    // Send push notification
    if (notificationData.pushPayload) {
      await sendPushNotifications(userId, notificationData.pushPayload);
    }

    // Send email notification
    if (emailData) {
      await sendEmailNotification(emailData.email, emailData.subject, emailData.htmlContent);
    }

    return notification;
  } catch (error) {
    console.error('Error in sendCompleteNotification:', error);
    // Don't throw error for notification failures - continue with main operation
    return null;
  }
};

const initiatePayment = async (req, res) => {
  try {
    const { amount, userId, plan } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ message: 'Amount and userId are required.' });
    }

    const options = {
      amount: parseInt(amount), // Ensure amount is a number in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId,
        plan: plan || 'basic',
      },
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send('Order creation failed.');

    // Send payment initiation notifications (without blocking the main flow)
    setImmediate(async () => {
      try {
        const userProfile = await UserProfile.findOne({ uid: userId });
        if (userProfile) {
          const paymentInitiationEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; text-align: center;">Payment Initiated 💳</h2>
              <p>Hi ${userProfile.name || 'there'},</p>
              <p>Your payment has been initiated successfully!</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Payment Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;"><strong>Order ID:</strong> ${order.id}</li>
                  <li style="margin: 10px 0;"><strong>Amount:</strong> ₹${(amount / 100).toFixed(2)}</li>
                  <li style="margin: 10px 0;"><strong>Plan:</strong> ${plan || 'Basic'}</li>
                  <li style="margin: 10px 0;"><strong>Status:</strong> Payment Initiated</li>
                </ul>
              </div>
              <p>Please complete the payment to activate your premium features.</p>
              <p>If you encounter any issues during the payment process, please contact our support team.</p>
              <p>Best regards,<br>The TodoApp Team</p>
            </div>
          `;
          
          const message = `Payment initiated for ${plan || 'Basic'} plan - ₹${(amount / 100).toFixed(2)}`;
          
          // Send complete notification (Socket.IO + Push + Email)
          await sendCompleteNotification(userId, {
            message,
            type: 'payment_initiated',
            pushPayload: {
              title: "Payment Initiated 💳",
              body: message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              data: { orderId: order.id, type: 'payment_initiated' }
            }
          }, {
            email: userProfile.email,
            subject: 'TodoApp - Payment Initiated Successfully',
            htmlContent: paymentInitiationEmailContent
          });
        }
      } catch (notificationError) {
        console.error('Background payment initiation notification error:', notificationError);
      }
    });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Payment initiation error:', error.message);
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

const handleWebhook = async (req, res) => {
  let webhookSignatureValid = false;
  
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    console.log('🔔 Webhook received');
    console.log('🔐 Signature header:', signature);
    console.log('📦 Raw body type:', typeof req.body);
    console.log('📦 Raw body length:', req.body?.length);

    // Verify webhook secret exists
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET is not set');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // Verify signature exists
    if (!signature) {
      console.error('❌ No signature header found');
      return res.status(400).json({ message: 'No signature header' });
    }

    // Create expected signature using raw body
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body, 'utf8')
      .digest('hex');

    console.log('🔍 Expected signature:', expectedSignature);
    console.log('🔍 Received signature:', signature);

    // Compare signatures securely
    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValidSignature) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    webhookSignatureValid = true;
    console.log('✅ Webhook signature validated successfully');

    // Parse the webhook data
    let data;
    try {
      data = JSON.parse(req.body.toString());
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError.message);
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }

    console.log('✅ Valid webhook received:', data.event);
    console.log('📋 Webhook payload:', JSON.stringify(data, null, 2));

    // Handle different webhook events
    if (data.event === 'payment.captured') {
      const payment = data.payload.payment.entity;
      const userId = payment.notes?.userId;
      const plan = payment.notes?.plan || 'basic';
      
      console.log('💰 Payment captured event');
      console.log('👤 User ID from notes:', userId);
      console.log('💵 Payment amount:', payment.amount);
      console.log('📝 Payment notes:', payment.notes);
    
      if (!userId) {
        console.warn('⚠️ No userId found in payment notes.');
        console.warn('📝 Available notes:', payment.notes);
        return res.status(200).json({ status: 'ok', message: 'No userId in payment notes' });
      }

      try {
        console.log(`🔄 Attempting to update user with UID: ${userId}`);
        
        // First, let's check if the user exists
        const existingUser = await UserProfile.findOne({ uid: userId });
        console.log('🔍 User lookup result:', existingUser ? 'Found' : 'Not Found');
        
        if (!existingUser) {
          console.error(`❌ No user found in DB with UID: ${userId}`);
          
          // Debug: Check what users exist
          const userCount = await UserProfile.countDocuments();
          console.log('📊 Total users in database:', userCount);
          
          if (userCount > 0) {
            const sampleUsers = await UserProfile.find({}, { uid: 1, email: 1, name: 1 }).limit(5);
            console.log('👥 Sample users (first 5):', sampleUsers);
          }
          
          return res.status(200).json({ 
            status: 'error', 
            message: `User not found with UID: ${userId}` 
          });
        }

        // Update the user to mark as paid - CRITICAL SECTION
        const updatedUser = await UserProfile.findOneAndUpdate(
          { uid: userId },
          { 
            isPaid: true,
            paymentId: payment.id,
            paymentDate: new Date(),
            plan: plan,
            $unset: { // Remove any temporary fields if they exist
              paymentPending: 1
            }
          },
          { 
            new: true,
            runValidators: true // Ensure schema validations run
          }
        );

        if (!updatedUser) {
          console.error(`❌ Failed to update user with UID: ${userId}`);
          return res.status(200).json({ 
            status: 'error', 
            message: `Failed to update user payment status` 
          });
        }

        console.log(`✅ User with UID ${userId} is now marked as paid.`);
        console.log('👤 Updated user details:', {
          id: updatedUser._id,
          uid: updatedUser.uid,
          email: updatedUser.email,
          isPaid: updatedUser.isPaid,
          plan: updatedUser.plan,
          paymentId: updatedUser.paymentId,
          paymentDate: updatedUser.paymentDate
        });

        // Verify the update was successful by fetching the user again
        const verificationUser = await UserProfile.findOne({ uid: userId });
        console.log('🔍 Verification - User isPaid status:', verificationUser?.isPaid);

        if (!verificationUser?.isPaid) {
          console.error('❌ CRITICAL: User update verification failed - isPaid is still false!');
          
          // Try a more direct update approach
          const directUpdateResult = await UserProfile.updateOne(
            { uid: userId },
            { $set: { isPaid: true } }
          );
          console.log('🔄 Direct update result:', directUpdateResult);
        }

        // Send payment success notifications in background (non-blocking)
        setImmediate(async () => {
          try {
            if (updatedUser.email) {
              const paymentSuccessEmailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #28a745; text-align: center;">Payment Successful! 🎉</h2>
                  <p>Hi ${updatedUser.name || 'there'},</p>
                  <p>Congratulations! Your payment has been processed successfully and your premium features are now active.</p>
                  <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="color: #155724; margin-top: 0;">Payment Confirmation:</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li style="margin: 10px 0;"><strong>Payment ID:</strong> ${payment.id}</li>
                      <li style="margin: 10px 0;"><strong>Amount Paid:</strong> ₹${(payment.amount / 100).toFixed(2)}</li>
                      <li style="margin: 10px 0;"><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</li>
                      <li style="margin: 10px 0;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</li>
                      <li style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Completed</span></li>
                    </ul>
                  </div>
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="color: #495057; margin-top: 0;">What's Next?</h4>
                    <ul>
                      <li>Your premium features are now active</li>
                      <li>You can access all premium functionalities</li>
                      <li>Enjoy enhanced productivity with TodoApp!</li>
                    </ul>
                  </div>
                  <p>Thank you for choosing TodoApp Premium. We're excited to help you boost your productivity!</p>
                  <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
                  <p>Best regards,<br>The TodoApp Team</p>
                </div>
              `;
              
              const message = `Payment successful! ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated - ₹${(payment.amount / 100).toFixed(2)}`;
              
              // Send complete notification (Socket.IO + Push + Email)
              await sendCompleteNotification(userId, {
                message,
                type: 'payment_success',
                pushPayload: {
                  title: "Payment Successful! 🎉",
                  body: message,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  data: { paymentId: payment.id, type: 'payment_success' }
                }
              }, {
                email: updatedUser.email,
                subject: 'TodoApp - Payment Successful! Premium Activated 🎉',
                htmlContent: paymentSuccessEmailContent
              });
            }
          } catch (notificationError) {
            console.error('Background payment success notification error:', notificationError);
          }
        });
        
      } catch (updateError) {
        console.error('❌ Critical error updating user payment status:', updateError.message);
        console.error('❌ Full error stack:', updateError.stack);
        
        // Still return success to Razorpay to avoid retries, but log the error
        return res.status(200).json({ 
          status: 'error', 
          message: 'Database update failed',
          error: updateError.message 
        });
      }
      
    } else if (data.event === 'payment.failed') {
      console.log('❌ Payment failed event received');
      const payment = data.payload.payment.entity;
      const userId = payment.notes?.userId;
      
      console.log('💳 Failed payment details:', {
        id: payment.id,
        amount: payment.amount,
        error: payment.error_description
      });

      // Send payment failure notifications in background (non-blocking)
      if (userId) {
        setImmediate(async () => {
          try {
            const userProfile = await UserProfile.findOne({ uid: userId });
            if (userProfile && userProfile.email) {
              const paymentFailureEmailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #dc3545; text-align: center;">Payment Failed ❌</h2>
                  <p>Hi ${userProfile.name || 'there'},</p>
                  <p>We're sorry, but your payment could not be processed successfully.</p>
                  <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                    <h3 style="color: #721c24; margin-top: 0;">Payment Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li style="margin: 10px 0;"><strong>Payment ID:</strong> ${payment.id}</li>
                      <li style="margin: 10px 0;"><strong>Amount:</strong> ₹${(payment.amount / 100).toFixed(2)}</li>
                      <li style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">❌ Failed</span></li>
                      ${payment.error_description ? `<li style="margin: 10px 0;"><strong>Error:</strong> ${payment.error_description}</li>` : ''}
                    </ul>
                  </div>
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="color: #495057; margin-top: 0;">What You Can Do:</h4>
                    <ul>
                      <li>Check your payment method details</li>
                      <li>Ensure sufficient balance in your account</li>
                      <li>Try again with a different payment method</li>
                      <li>Contact your bank if the issue persists</li>
                    </ul>
                  </div>
                  <p>You can try making the payment again from your TodoApp dashboard.</p>
                  <p>If you continue to experience issues, please contact our support team for assistance.</p>
                  <p>Best regards,<br>The TodoApp Team</p>
                </div>
              `;
              
              const message = `Payment failed - ₹${(payment.amount / 100).toFixed(2)}. ${payment.error_description || 'Please try again.'}`;
              
              // Send complete notification (Socket.IO + Push + Email)
              await sendCompleteNotification(userId, {
                message,
                type: 'payment_failed',
                pushPayload: {
                  title: "Payment Failed ❌",
                  body: message,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  data: { paymentId: payment.id, type: 'payment_failed' }
                }
              }, {
                email: userProfile.email,
                subject: 'TodoApp - Payment Failed - Action Required',
                htmlContent: paymentFailureEmailContent
              });
            }
          } catch (notificationError) {
            console.error('Background payment failure notification error:', notificationError);
          }
        });
      }
    } else {
      console.log(`ℹ️ Unhandled webhook event: ${data.event}`);
    }

    // Always return success to Razorpay to prevent retries
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('❌ Critical webhook error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Webhook signature valid:', webhookSignatureValid);
    
    // Even on error, return 200 to prevent Razorpay retries if signature was valid
    if (webhookSignatureValid) {
      res.status(200).json({ status: 'error', message: 'Webhook processing failed but signature was valid' });
    } else {
      res.status(500).json({ message: 'Webhook handling failed', error: error.message });
    }
  }
};

module.exports = { initiatePayment, handleWebhook };