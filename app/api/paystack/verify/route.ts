import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        {
          error: "Payment reference is required.",
        },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          error: "Paystack secret key is not configured.",
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: "Supabase server configuration is missing.",
        },
        { status: 500 }
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error("Paystack verification error:", paystackData);

      return NextResponse.json(
        {
          error:
            paystackData.message ||
            "Unable to verify payment with Paystack.",
        },
        { status: 400 }
      );
    }

    const transaction = paystackData.data;

    // Only accept successful transactions
    if (transaction.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          payment_status: transaction.status,
          message: "Payment was not successful.",
        },
        { status: 400 }
      );
    }

    // Our reference is ASC-{order_id}
    if (!reference.startsWith("ASC-")) {
      return NextResponse.json(
        {
          error: "Invalid payment reference.",
        },
        { status: 400 }
      );
    }

    const orderId = reference.replace("ASC-", "");

    // Create a server-side Supabase client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Get the order
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("id, total_amount, payment_status, status")
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
      console.error("Order lookup error:", orderError);

      return NextResponse.json(
        {
          error: "Order could not be found.",
        },
        { status: 404 }
      );
    }

    // Paystack amount is in kobo
    const expectedAmount = Math.round(
      Number(order.total_amount) * 100
    );

    const paidAmount = Number(transaction.amount);

    // Make sure the amount actually paid matches the order
    if (paidAmount !== expectedAmount) {
      console.error("Payment amount mismatch:", {
        expectedAmount,
        paidAmount,
      });

      return NextResponse.json(
        {
          error: "Payment amount does not match the order.",
        },
        { status: 400 }
      );
    }

    // Mark the order as paid
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Order update error:", updateError);

      return NextResponse.json(
        {
          error: "Payment was verified but the order could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      order_id: order.id,
      amount: transaction.amount,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while verifying the payment.",
      },
      { status: 500 }
    );
  }
}
