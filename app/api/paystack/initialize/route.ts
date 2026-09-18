import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, amount, reference } = await request.json();

    if (!email || !amount || !reference) {
      return NextResponse.json(
        {
          error: "Email, amount and reference are required.",
        },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          error: "Paystack secret key is not configured.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payment/callback`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack initialization error:", data);

      return NextResponse.json(
        {
          error:
            data.message || "Unable to initialize Paystack payment.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while connecting to Paystack.",
      },
      { status: 500 }
    );
  }
}
