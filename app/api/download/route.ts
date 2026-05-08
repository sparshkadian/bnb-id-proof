import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import https from "https";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const publicId = searchParams.get("publicId");
    const filename = searchParams.get("filename") || "download";

    let targetUrl = url;

    // If we have a publicId, generate a signed URL with attachment flag
    if (publicId && publicId !== "null") {
      targetUrl = cloudinary.url(publicId, {
        resource_type: 'image',
        flags: 'attachment',
        attachment: filename,
        sign_url: true,
        secure: true
      });
    }

    if (!targetUrl) {
      return new NextResponse("Missing URL or Public ID", { status: 400 });
    }

    // Redirect to the signed URL if generated, otherwise proxy the original URL
    if (publicId && publicId !== "null") {
      return NextResponse.redirect(targetUrl);
    }

    return new Promise((resolve) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      };

      https.get(targetUrl!, options, (res) => {
        if (res.statusCode !== 200) {
          console.error(`Proxy Error: Received ${res.statusCode} from ${targetUrl}`);
          resolve(new NextResponse(`Download failed (Status: ${res.statusCode})`, { status: res.statusCode || 500 }));
          return;
        }

        const chunks: any[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const headers = new Headers();
          headers.set("Content-Disposition", `attachment; filename="${filename}"`);
          headers.set("Content-Type", res.headers["content-type"] || "application/octet-stream");
          resolve(new NextResponse(buffer, { status: 200, headers }));
        });
      }).on("error", (err) => {
        resolve(new NextResponse(`Connection error: ${err.message}`, { status: 500 }));
      });
    });
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
