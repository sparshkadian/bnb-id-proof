import { prisma } from "./prisma";

export async function checkGuestTransitions() {
  const now = new Date();
  const currentHour = now.getHours();

  console.log(`Running scheduler at ${now.toISOString()}`);

  // 1. Auto Check-In (1 PM = 13:00)
  // Only check-in guests whose ID proof is confirmed
  if (currentHour >= 13) {
    const guestsToCheckIn = await prisma.guest.findMany({
      where: {
        status: "ID_CONFIRMED",
        checkInDate: {
          lte: now,
        },
      },
    });

    for (const guest of guestsToCheckIn) {
      const checkInDate = new Date(guest.checkInDate);
      if (checkInDate.toDateString() === now.toDateString() || checkInDate < now) {
        await prisma.guest.update({
          where: { id: guest.id },
          data: {
            status: "CHECKED_IN",
            checkInTime: now,
          },
        });

        await prisma.notification.create({
          data: {
            guestId: guest.id,
            type: "GUEST_CHECKED_IN",
            message: `Guest ${guest.name} has been automatically checked in.`,
          },
        });
        console.log(`Auto checked-in guest: ${guest.name}`);
      }
    }
  }

  // 2. Auto Check-Out (11:00 AM)
  if (currentHour >= 11) {
    const guestsToCheckOut = await prisma.guest.findMany({
      where: {
        status: "CHECKED_IN",
        checkOutDate: {
          lte: now,
        },
      },
    });

    for (const guest of guestsToCheckOut) {
      const checkOutDate = new Date(guest.checkOutDate);
      if (checkOutDate.toDateString() === now.toDateString() || checkOutDate < now) {
        await prisma.guest.update({
          where: { id: guest.id },
          data: {
            status: "CHECKED_OUT",
            checkOutTime: now,
          },
        });

        await prisma.notification.create({
          data: {
            guestId: guest.id,
            type: "GUEST_CHECKED_OUT",
            message: `Guest ${guest.name} has been automatically checked out.`,
          },
        });
        console.log(`Auto checked-out guest: ${guest.name}`);
      }
    }
  }
}

let intervalStarted = false;

export function startScheduler() {
  if (intervalStarted) return;
  intervalStarted = true;

  console.log("Starting BnB Guest Lifecycle Scheduler...");
  
  // Run every 5 minutes
  setInterval(async () => {
    try {
      await checkGuestTransitions();
    } catch (error) {
      console.error("Scheduler error:", error);
    }
  }, 5 * 60 * 1000);

  // Run once on start
  checkGuestTransitions().catch(console.error);
}
