import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectRole, generateOTP } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const role = detectRole(email);
    if (!role) {
      return NextResponse.json(
        { error: "Invalid academic domain. Use @students.duet.edu.pk or @duet.edu.pk" },
        { status: 403 }
      );
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user && user.isVerified) {
       return NextResponse.json({ error: "Account already exists and is verified. Please log in." }, { status: 409 });
    }

    if (user) {
      // resend limit check
      if (user.otpResendReset && user.otpResendReset > new Date() && user.otpResendCount >= 3) {
         return NextResponse.json({ error: "Rate limit exceeded. Try again in an hour." }, { status: 429 });
      }

      await prisma.user.update({
        where: { email },
        data: {
           otp,
           otpExpiry,
           otpResendCount: user.otpResendCount + 1,
           otpResendReset: user.otpResendCount === 2 ? new Date(Date.now() + 60 * 60 * 1000) : user.otpResendReset,
        }
      });
    } else {
      // create unverified shell
      await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(crypto.randomUUID(), 10), // Dummy password hash
          role,
          isVerified: false,
          otp,
          otpExpiry,
          otpResendCount: 1,
        }
      });
    }

    // Send the email
    await sendOtpEmail(email, otp);

    return NextResponse.json({ success: true, message: "OTP sent" });

  } catch (error: any) {
    console.error("[signup]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
