import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get('email');
    const file = formData.get('file') as File;

    if (!email || !file) {
      return NextResponse.json({ error: 'Missing email or file' }, { status: 400 });
    }

    const adminEmails = [
      process.env.NEXT_PUBLIC_ADMIN_EMAIL_1,
      process.env.NEXT_PUBLIC_ADMIN_EMAIL_2
    ].filter(Boolean);

    if (!adminEmails.includes(email.toString())) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'luxe' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ secure_url: (result as any).secure_url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
