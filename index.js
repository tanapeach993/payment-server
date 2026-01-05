const express = require("express");
const bodyParser = require("body-parser");
const Omise = require("omise");

const app = express();
app.use(bodyParser.json());

// ใช้ Secret Key จาก Environment Variable
const omise = Omise({
  secretKey: process.env.OMISE_SECRET_KEY
});

// หน้าเช็กว่าเซิร์ฟเวอร์รันอยู่
app.get("/", (req, res) => {
  res.send("Payment server is running");
});

// สร้างรายการจ่าย (PromptPay)
app.post("/create-charge", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // สร้าง PromptPay source (โหมดทดสอบ)
    const source = await omise.sources.create({
      type: "promptpay",
      amount: amount,
      currency: "THB"
    });

    // สร้าง charge
    const charge = await omise.charges.create({
      amount: amount,
      currency: "THB",
      source: source.id
    });

    res.json({
      authorize_uri: charge.authorize_uri
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// รับ webhook แจ้งผลการจ่าย
app.post("/webhook", (req, res) => {
  const event = req.body;

  if (event.key === "charge.complete") {
    console.log("✅ ชำระเงินสำเร็จ:", event.data.id);
    // ตรงนี้ในอนาคต:
    // - อัปเดตสถานะออเดอร์
    // - แจ้ง frontend แบบ real-time
  }

  res.sendStatus(200);
});

// Railway จะกำหนด PORT ให้เอง
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
