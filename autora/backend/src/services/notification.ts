import prisma from "../utils/prisma";

// TODO: Initialize Firebase Admin SDK when credentials are available
// import admin from "firebase-admin";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  // Store notification in database
  await prisma.notification.create({
    data: { userId, title, body },
  });

  // TODO: Send push notification via Firebase Cloud Messaging
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // if (user?.fcmToken) {
  //   await admin.messaging().send({
  //     token: user.fcmToken,
  //     notification: { title, body },
  //   });
  // }

  console.log(`Notification sent to ${userId}: ${title}`);
}

export async function sendBookingConfirmation(
  userId: string,
  providerName: string,
  scheduledAt: Date
): Promise<void> {
  await sendPushNotification(
    userId,
    "Booking Confirmed",
    `Your booking with ${providerName} is confirmed for ${scheduledAt.toLocaleDateString()}.`
  );
}

export async function sendTowingUpdate(
  userId: string,
  status: string
): Promise<void> {
  const messages: Record<string, string> = {
    ACCEPTED: "A towing truck has been assigned to you!",
    EN_ROUTE: "Your towing truck is on the way!",
    ARRIVED: "Your towing truck has arrived!",
    COMPLETED: "Your towing service is complete. Thank you!",
  };

  await sendPushNotification(
    userId,
    "Towing Update",
    messages[status] || `Towing status updated: ${status}`
  );
}
