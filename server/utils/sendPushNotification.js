const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webPush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToUsers(userIds, payload) {
  const subscriptions = await PushSubscription.find({
    user: { $in: userIds },
  });

  const results = await Promise.allSettled(
    subscriptions.map((doc) =>
      webPush.sendNotification(doc.subscription, JSON.stringify(payload)).catch(async (err) => {
        // 410 Gone = subscription expired/unsubscribed — clean it up
        if (err.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(doc._id);
        }
        throw err;
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.log(`Push: ${results.length - failed} sent, ${failed} failed`);
  }
}

module.exports = sendPushToUsers;
