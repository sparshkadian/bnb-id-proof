import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/fileUpload";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const numberOfGuests = parseInt(formData.get("numberOfGuests") as string, 10);
    const checkInDate = formData.get("checkInDate") as string;
    const checkOutDate = formData.get("checkOutDate") as string;
    const notes = formData.get("notes") as string || "";
    const bookingType = (formData.get("bookingType") as string) || "APP";

    const amountPaid = formData.get("amountPaid") as string;
    const amountByGuest = parseFloat(amountPaid || formData.get("amountByGuest") as string || "0");
    const hostPayout = parseFloat(formData.get("hostPayout") as string || "0");

    if (!name || !numberOfGuests || !checkInDate || !checkOutDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const files = formData.getAll("documents") as File[];
    const documentNames = formData.getAll("documentNames") as string[];
    const documentOwners = formData.getAll("documentOwners") as string[];
    const accompanyingGuestNames = formData.getAll("accompanyingGuestNames") as string[];
    const idProofType = formData.get("idProofType") as string;

    const uploadedDocuments = [];
    if (files && files.length > 0) {
      let accompanyingIdx = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const owner = (documentOwners[i] as any) || "MAIN_GUEST";
        let accompanyingName = null;
        if (owner === "ACCOMPANYING_GUEST") {
          accompanyingName = accompanyingGuestNames[accompanyingIdx++] || null;
        }

        if (!(file instanceof File) || file.size === 0) continue;

        const customName = documentNames[i] || file.name.split('.')[0];
        const { filePath, publicId } = await uploadFile(file, customName);
        
        uploadedDocuments.push({
          filePath,
          publicId,
          fileType: file.type,
          documentOwner: owner,
          accompanyingGuestName: accompanyingName,
        });
      }
    }

    const guest = await prisma.guest.create({
      data: {
        name,
        numberOfGuests,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        notes,
        status: uploadedDocuments.length > 0 ? "ID_CONFIRMED" : "BOOKING_CONFIRMED",
        hasIdProof: uploadedDocuments.length > 0,
        idProofType: idProofType || null,
        totalNights,
        amountByGuest,
        hostPayout,
        bookingType: bookingType as any,
        documents: {
          create: uploadedDocuments,
        },
      },
      include: {
        documents: true,
      },
    });

    // Auto Generate Check-in Message notification
    const message = `Dear ${name},

Your booking has been successfully confirmed.
Duration of Stay: ${checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${totalNights} night(s))

Kindly share a valid government-issued ID proof for all guests at your earliest convenience to complete the check-in process.

The check-in details will be shared with you on the day of your check-in.

Please feel free to reach out if you have any questions.

Thank you!`;

    await prisma.notification.create({
      data: {
        guestId: guest.id,
        type: "CHECKIN_MESSAGE_GENERATED",
        message: message,
      },
    });

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const guests = await prisma.guest.findMany({
      include: { documents: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ guests });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }
}
