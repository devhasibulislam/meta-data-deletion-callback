const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const app = express();
app.use(express.json()); // Parse JSON payloads

const APP_SECRET = "fa55a4b9bcdac30e5c639ef9c35acd50"; // Replace with your Facebook App Secret
const MONGO_URI = "mongodb://localhost:27017/ddr"; // Replace with your MongoDB connection string

// In-memory storage for deletion statuses (use a database in production)
const deletionRequests = {};

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define a sample User Schema (adjust according to your app's schema)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  facebookUserId: String,
  signedRequest: String,
});

const User = mongoose.model("User", userSchema);

// Define a simple Deletion Schema (adjust according to your app's schema)
const deletionSchema = new mongoose.Schema({
  facebookUserId: String,
  status: String,
});

const Deletion = mongoose.model("Deletion", deletionSchema);

// Utility function to create a signed request
function createSignedRequest(payload) {
  const payloadString = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto
    .createHmac("sha256", APP_SECRET)
    .update(payloadString)
    .digest("base64");
  return `${signature}.${payloadString}`;
}

// Utility function to parse the signed request
function parseSignedRequest(signedRequest) {
  const [encodedSig, payload] = signedRequest.split(".");

  const sig = Buffer.from(encodedSig, "base64");
  const data = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));

  // Validate the signature
  const expectedSig = crypto
    .createHmac("sha256", APP_SECRET)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error("Invalid signed request signature");
  }

  return data;
}

// Create data endpoint
app.post("/create-data", (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const signedRequest = createSignedRequest(payload);

    const result = new User({
      name: payload.name,
      email: payload.email,
      facebookUserId: payload.facebookUserId,
      signedRequest,
    });

    if (result) {
      result
        .save()
        .then(() => {
          console.log("User data saved successfully");
          res.json({ signed_request: signedRequest });
        })
        .catch((error) => {
          console.error("Error saving user data:", error.message);
          res.status(500).json({ error: "Internal Server Error" });
        });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error creating signed request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Data deletion endpoint
app.post("/data-deletion", async (req, res) => {
  try {
    const signedRequest = req.body.signed_request;

    // Parse and validate the signed request
    const data = parseSignedRequest(signedRequest);
    const facebookUserId = data.facebookUserId;

    // Delete user data from MongoDB
    const result = await User.deleteOne({ facebookUserId });

    if (result.deletedCount === 0) {
      console.error("No user found with the given Facebook User ID");
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Generate confirmation response
    const confirmationCode = `delete_${facebookUserId}_${Date.now()}`;
    const statusUrl = `http://localhost:3000/deletion-status?code=${confirmationCode}`;

    // Save the confirmation code and status
    deletionRequests[confirmationCode] = {
      facebookUserId,
      status: "Deleted",
    };

    // Save deletion status to MongoDB
    const deletionResult = new Deletion({
      facebookUserId,
      status: "Deleted",
    });
    await deletionResult.save();

    if (deletionResult) {
      res.json({
        url: statusUrl,
        confirmation_code: confirmationCode,
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error processing data deletion request:", error.message);
    res.status(400).json({ error: "Invalid request" });
  }
});

// Deletion status endpoint
app.get("/deletion-status", async (req, res) => {
    try {
      const confirmationCode = req.query.code;
  
      if (!confirmationCode) {
        return res.status(400).json({
          error: "Confirmation code is required",
        });
      }
  
      // Retrieve deletion status from MongoDB using the confirmation code
      const deletionStatus = await Deletion.findOne({
        facebookUserId: confirmationCode.split("_")[1], // Extract facebookUserId from the confirmation code
      });
  
      if (!deletionStatus) {
        return res.status(404).json({
          error: "Invalid or expired confirmation code",
        });
      }
  
      res.json({
        facebookUserId: deletionStatus.facebookUserId,
        status: deletionStatus.status,
      });
    } catch (error) {
      console.error("Error processing deletion status request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

app.get("/", (req, res) => {
  res.send("Hello, World!!!");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
