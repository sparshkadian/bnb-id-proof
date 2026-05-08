import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { uploadFile, deleteFile } from "@/lib/fileUpload";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { 
        documents: true,
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Error fetching guest:", error);
    return NextResponse.json({ error: "Failed to fetch guest" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Delete files
    for (const doc of guest.documents) {
      if (doc.filePath.startsWith("/uploads/")) {
        const fullPath = path.join(process.cwd(), "public", doc.filePath);
        try {
          await unlink(fullPath);
        } catch (e) {
          console.error("Error deleting local file:", fullPath, e);
        }
      } else if (doc.publicId) {
        await deleteFile(doc.publicId);
      }
    }

    // Delete from database (cascade will handle documents)
    await prisma.guest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    const status = formData.get("status") as any;
    const checkInTime = formData.get("checkInTime");
    const checkOutTime = formData.get("checkOutTime");
    const amountByGuest = formData.get("amountByGuest");
    const files = formData.getAll("documents") as File[];
    const idProofType = formData.get("idProofType") as string;
    
    // Check 24-hour edit lock past check-out date
    const currentGuest = await prisma.guest.findUnique({ where: { id } });
    if (!currentGuest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    /* Temporarily disabled for historical data upload
    if (currentGuest.checkOutDate) {
      const checkOutDate = new Date(currentGuest.checkOutDate);
      const lockDeadline = new Date(checkOutDate.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      if (now > lockDeadline) {
        return NextResponse.json(
          { error: "This record is locked as it is more than 24 hours past the check-out date." },
          { status: 403 }
        );
      }
    }
    */

    const updateData: any = {};
    
    if (idProofType) updateData.idProofType = idProofType;
    
    if (status) {
      if (status === "CHECKED_OUT") {
        if (currentGuest.status === "ID_PENDING" || !currentGuest.hasIdProof) {
          return NextResponse.json(
            { error: "Cannot check out guest while ID proof is pending." },
            { status: 400 }
          );
        }
      }
      updateData.status = status;
      // Clear times when moving backwards
      if (status === "ID_CONFIRMED" || status === "BOOKING_CONFIRMED" || status === "ID_PENDING") {
        updateData.checkInTime = null;
        updateData.checkOutTime = null;
      } else if (status === "CHECKED_IN") {
        updateData.checkOutTime = null;
      }
    }
    if (checkInTime) updateData.checkInTime = new Date(checkInTime as string);
    if (checkOutTime) updateData.checkOutTime = new Date(checkOutTime as string);
    if (amountByGuest !== null) {
      const parsedAmount = parseFloat(amountByGuest as string);
      updateData.amountByGuest = isNaN(parsedAmount) ? 0 : parsedAmount;
    }
    
    const documentNames = formData.getAll("documentNames") as string[];
    const documentOwners = formData.getAll("documentOwners") as string[];
    const accompanyingGuestNames = formData.getAll("accompanyingGuestNames") as string[];
    
    // Handle document uploads
    if (files && files.length > 0) {
      const uploadedDocuments = [];
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

      if (uploadedDocuments.length > 0) {
        updateData.documents = {
          create: uploadedDocuments,
        };
        updateData.hasIdProof = true;
        
        // When admin uploads ID proof, move to ID_CONFIRMED status if currently pending
        if (currentGuest.status === "BOOKING_CONFIRMED" || currentGuest.status === "ID_PENDING") {
          updateData.status = "ID_CONFIRMED";
        }
      }
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData,
      include: { documents: true },
    });

    if (status === "CHECKED_IN") {
      await prisma.notification.create({
        data: {
          guestId: id,
          type: "GUEST_CHECKED_IN",
          message: `Guest ${guest.name} was manually checked in.`,
        },
      });
    } else if (status === "CHECKED_OUT") {
      await prisma.notification.create({
        data: {
          guestId: id,
          type: "GUEST_CHECKED_OUT",
          message: `Guest ${guest.name} was manually checked out.`,
        },
      });
    }

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}
