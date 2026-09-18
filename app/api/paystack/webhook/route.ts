import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is missing.");
      return NextResponse.json(
        { error: "Paystack secret key is missing." },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase server credentials are missing.");
      return NextResponse.json(
        { error: "Supabase server configuration is missing." },
        { status: 500 }
      );
    }

    // Get the raw request body.
    // IMPORTANT: Paystack's signature must be calculated
    // using the raw body exactly as received.
    const rawBody = await request.text();

    const signature = request.headers.get(
      "x-paystack-signature"
    );

    if (!signature) {
      console.error("Missing Paystack signature.");

      return NextResponse.json(
        { error: "Missing signature." },
        { status: 401 }
      );
    }

    // Generate our own HMAC SHA512 signature
    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    // Compare signatures safely
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      console.error("Invalid Paystack signature.");

      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 401 }
      );
    }

    // Parse the verified webhook body
    const event = JSON.parse(rawBody);

    console.log("Paystack webhook received:", event.event);

    // We currently care about successful payments
    if (event.event !== "charge.success") {
      return NextResponse.json({
        received: true,
        message: "Event received but no action was required.",
      });
    }

    const transaction = event.data;

    const reference = transaction?.reference;
    const amount = Number(transaction?.amount);
    const transactionStatus = transaction?.status;

    if (!reference) {
      console.error("Webhook has no transaction reference.");

      return NextResponse.json(
        { error: "Transaction reference is missing." },
        { status: 400 }
      );
    }

    if (transactionStatus !== "success") {
      console.log(
        "Transaction was not successful:",
        transactionStatus
      );

      return NextResponse.json({
        received: true,
        message: "Transaction was not successful.",
      });
    }

    // Our ASCOHOMES references use:
    // ASC-{order_id}
    if (!reference.startsWith("ASC-")) {
      console.error("Invalid ASCOHOMES reference:", reference);

      return NextResponse.json(
        { error: "Invalid payment reference." },
        { status: 400 }
      );
    }

    const orderId = reference.replace("ASC-", "");

    // Server-side Supabase client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Find the order
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(
          "id, total_amount, payment_status, status"
        )
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);

      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Paystack amount is in kobo.
    // Our database total_amount is in naira.
    const expectedAmount =
      Math.round(Number(order.total_amount) * 100);

    // Make sure Paystack actually received
    // the amount belonging to this order.
    if (amount !== expectedAmount) {
      console.error("Payment amount mismatch:", {
        orderId,
        expectedAmount,
        paidAmount: amount,
      });

      return NextResponse.json(
        {
          error: "Payment amount does not match order.",
        },
        { status: 400 }
      );
    }

    // Prevent unnecessary duplicate updates
    if (order.payment_status === "paid") {
      console.log(
        `Order ${order.id} is already marked as paid.`
      );

      return NextResponse.json({
        received: true,
        message: "Order was already processed.",
      });
    }

    // Update order
    const { error: updateError } =
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
        })
        .eq("id", order.id);

    if (updateError) {
      console.error(
        "Failed to update order:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Payment received but order update failed.",
        },
        { status: 500 }
      );
    }

    console.log(
      `Order ${order.id} successfully marked as paid.`
    );

    // Tell Paystack that the webhook was successfully received.
    return NextResponse.json({
      received: true,
      success: true,
      order_id: order.id,
      message: "Payment webhook processed successfully.",
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return NextResponse.json(
      {
        error: "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
