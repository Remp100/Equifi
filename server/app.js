require("dotenv").config();
const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (
  !MONGODB_URI ||
  !SESSION_SECRET ||
  !JWT_SECRET ||
  !CLOUDINARY_CLOUD_NAME ||
  !CLOUDINARY_API_KEY ||
  !CLOUDINARY_API_SECRET ||
  !EMAIL_USER ||
  !EMAIL_PASS
) {
  console.error(
    "❌ Error: Missing required environment variables. Check your .env file."
  );
  process.exit(1);
}

// Middleware setup
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"], // Adjust for production
    methods: ["POST", "GET", "PUT"],
    credentials: true,
  })
);
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// MongoDB connection setup
const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongo() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}
connectToMongo();

// 🔐 Number of salt rounds for bcrypt hashing
const saltRounds = 10;

// Cloudinary configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Configuration for Multer and Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const email = req.body.Email;
    const extension = file.mimetype.split("/")[1];
    return {
      folder: `photos/${email}`,
      format: extension,
      public_id: file.originalname.split(".")[0],
    };
  },
});

const upload = multer({ storage: storage });

// Start the server
app.listen(3002, () => {
  console.log("Server is running on port 3002");
});

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    if (error.codeName === "AtlasError") {
      console.error("Atlas Error Details:", error.details);
    }
  }
}

connectToMongo();

// Endpoint for user registration
app.post("/register", upload.single("CIPhoto"), async (req, res) => {
  const sentEmail = req.body.Email.toLowerCase(); // Convert email to lowercase
  const sentPassword = req.body.Password;
  const sentFirstName = req.body.FirstName;
  const sentLastName = req.body.LastName;
  const sentPronoun = req.body.Pronoun;
  const sentCountry = req.body.Country;
  const sentCity = req.body.City;
  const sentState = req.body.State;
  const sentZipCode = req.body.ZipCode;
  const sentStreet = req.body.Street;
  const sentNumber = req.body.Number;
  const sentPhoneNumber = req.body.PhoneNumber;
  const setCIPhoto = req.file.path;

  try {
    // Check if email already exists (also lowercase)
    const existingUser = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: sentEmail });

    if (existingUser) {
      return res.send({ message: "Email is already registered" });
    }

    // Generate verification token
    const verificationToken = jwt.sign({ email: sentEmail }, JWT_SECRET, {
      expiresIn: "1d",
    });
    sendVerificationEmail(sentEmail, verificationToken);

    // Hash the password
    const hash = await bcrypt.hash(sentPassword, saltRounds);
    const newUser = {
      email: sentEmail, // Store email in lowercase
      password: hash,
      firstName: sentFirstName,
      lastName: sentLastName,
      pronoun: sentPronoun,
      country: sentCountry,
      city: sentCity,
      state: sentState,
      zipCode: sentZipCode,
      street: sentStreet,
      number: sentNumber,
      phoneNumber: sentPhoneNumber,
      CIPhoto: setCIPhoto,
      emailVerified: false,
      adminVerified: "Waiting",
      admin: false,
      createdAt: new Date(),
    };

    // Insert new user into the database
    await client
      .db("portfolio_login_db")
      .collection("users")
      .insertOne(newUser);

    console.log("User inserted successfully");
    res.send({ message: "User added!", userId: newUser.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to send verification email
function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Email Verification",
    html: `<p>Click <a href="http://localhost:3000/verify/${token}">here</a> to verify your email address.</p>`,
  };

  // Function to send the verification email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending verification email:", error);
    } else {
      console.log("Verification email sent:", info.response);
    }
  });
}

// Add this new endpoint to your server code
app.post("/resubmit", upload.single("CIPhoto"), async (req, res) => {
  const email = req.body.Email.toLowerCase();
  const {
    FirstName,
    LastName,
    Pronoun,
    Country,
    City,
    State,
    ZipCode,
    Street,
    Number,
    PhoneNumber,
  } = req.body;
  const CIPhoto = req.file ? req.file.path : null;

  try {
    // Check that the user exists
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data and reset adminVerified to "Waiting"
    const updateData = {
      firstName: FirstName,
      lastName: LastName,
      pronoun: Pronoun,
      country: Country,
      city: City,
      state: State,
      zipCode: ZipCode,
      street: Street,
      number: Number,
      phoneNumber: PhoneNumber,
      adminVerified: "Waiting",
    };

    // Update CIPhoto if a new file was provided
    if (CIPhoto) {
      updateData.CIPhoto = CIPhoto;
    }

    await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email }, { $set: updateData });

    res
      .status(200)
      .json({ message: "Data updated and resubmitted for admin review" });
  } catch (error) {
    console.error("Error in resubmit endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for verifying email
app.get("/verify/:token", (req, res) => {
  const token = req.params.token;

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    // Update user's verification status
    client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email: email }, { $set: { emailVerified: true } }, (err) => {
        if (err) {
          res.status(500).json({ message: "Error verifying email" });
        } else {
          res.redirect("/verified");
        }
      });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

app.post("/admin/reject-application", async (req, res) => {
  const { email, rejectionReason } = req.body; // Ensure we're using the email from the frontend payload

  try {
    // Find the user based on the provided email
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's status to "Rejected"
    const result = await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email }, { $set: { adminVerified: "Rejected" } });

    if (result.modifiedCount !== 1) {
      return res.status(500).json({ message: "Failed to update status" });
    }

    // Send rejection email to the applicant with a link to resubmit their data
    sendRejectionEmail(email, rejectionReason);

    res.status(200).json({ message: "Rejection processed successfully" });
  } catch (error) {
    console.error("Error processing rejection:", error);
    res.status(500).json({ error: error.message });
  }
});

function sendRejectionEmail(email, rejectionReason) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    service: "gmail",
    auth: {
      user: "equifisupp@gmail.com",
      pass: "wsbu fwzm ftpb bqtx",
    },
  });

  // Link to the resubmit page (update URL if needed)
  const resubmitLink = "http://localhost:3000/resubmit";

  const mailOptions = {
    from: "equifisupp@gmail.com",
    to: email,
    subject: "Application Rejected",
    html: `<p>Dear Applicant,</p>
           <p>We regret to inform you that your application has been rejected.</p>
           <p>Reason: <strong>${rejectionReason}</strong></p>
           <p>Please update your information and resubmit your application by clicking the link below:</p>
           <p><a href="${resubmitLink}">Update Your Information</a></p>
           <p>Best regards,<br/>Admin Team</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending rejection email:", error);
    } else {
      console.log("Rejection email sent:", info.response);
    }
  });
}

app.get("/admin/verify-requests", async (req, res) => {
  try {
    const users = await client
      .db("portfolio_login_db")
      .collection("users")
      .find({ adminVerified: "Waiting", emailVerified: true })
      .toArray();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const deleteFolder = async (folderPath) => {
  try {
    // Delete all resources in the folder
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    console.log(`Resources in folder ${folderPath} deleted from Cloudinary`);

    // Delete the folder itself
    await cloudinary.api.delete_folder(folderPath);
    console.log(`Folder ${folderPath} deleted from Cloudinary`);
  } catch (error) {
    console.error("Error deleting folder from Cloudinary:", error);
  }
};

app.post("/admin/update-verify-status", async (req, res) => {
  const { email, status } = req.body;

  try {
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.CIPhoto) {
      const email = user.email;
      const folderPath = `photos/${email}`;
      await deleteFolder(folderPath);
    }

    const result = await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email }, { $set: { adminVerified: status, CIPhoto: null } });

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Status updated successfully" });
    } else {
      res.status(500).json({ message: "Failed to update status" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for user login
app.post("/login", async (req, res) => {
  const sentLoginEmail = req.body.LoginEmail.toLowerCase();
  const setLoginPassword = req.body.LoginPassword;

  try {
    // Find user by email (lowercase)
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: sentLoginEmail });

    if (!user) {
      return res.send({ message: "Credentials error", isLoggedIn: false });
    }

    // Check if the user has verified their email
    if (!user.emailVerified) {
      return res.send({ message: "Email not verified", isLoggedIn: false });
    }

    // Check if the user has been rejected by the admin
    if (user.adminVerified === "Rejected") {
      return res.send({
        message: "Admin approval rejected",
        isLoggedIn: false,
      });
    }

    // Check if the user is approved by the admin
    if (user.adminVerified !== "Accepted") {
      return res.send({ message: "Admin approval pending", isLoggedIn: false });
    }

    // Compare passwords
    const match = await bcrypt.compare(setLoginPassword, user.password);

    if (match) {
      // Set session variable
      req.session.LoginEmail = user.email;
      console.log(req.session.LoginEmail);

      // Send response
      res.send({
        results: user,
        email: user.email,
        isLoggedIn: true,
        isVerified: user.emailVerified,
        isAdminApproved: user.adminVerified === "Accepted",
      });
    } else {
      res.send({ message: "Credentials error", isLoggedIn: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to check if user is logged in
app.get("/", async (req, res) => {
  if (req.session && req.session.LoginEmail) {
    try {
      const user = await client
        .db("portfolio_login_db")
        .collection("users")
        .findOne({ email: req.session.LoginEmail });

      if (user) {
        res.send({
          valid: true,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          admin: user.admin,
          CIPhoto: user.CIPhoto,
        });
      } else {
        res.send({ valid: false });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.send({ valid: false });
  }
});

// Endpoint for user logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Error logging out");
    } else {
      res.clearCookie("connect.sid");
      res.send("Logged out successfully");
    }
  });
});

// Route for saving an asset to a user's account
app.post("/save-asset", async (req, res) => {
  const { email, assetSymbol, interval, startDate, endDate } = req.body;

  try {
    // Format dates as ISO strings
    const asset = {
      assetSymbol,
      interval,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };

    // Find the user in the database
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email });

    // Check if the asset is already saved
    if (
      user &&
      user.savedAssets &&
      user.savedAssets.some((a) => a.assetSymbol === assetSymbol)
    ) {
      return res.status(400).json({ message: "Asset is already saved." });
    }

    // Add the new asset
    await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne(
        { email },
        { $push: { savedAssets: asset } },
        { upsert: true }
      );

    console.log("Asset saved successfully");
    res.sendStatus(200);
  } catch (error) {
    console.error("Error saving asset:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route for fetching saved assets for a user
app.get("/saved-assets/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // Find the user in the database
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: email });

    // Check if the user exists and has saved assets
    if (user && user.savedAssets) {
      const savedAssets = user.savedAssets.map((asset) => ({
        assetSymbol: asset.assetSymbol,
        interval: asset.interval || "N/A",
        startDate: asset.startDate || null,
        endDate: asset.endDate || null,
      }));

      res.status(200).json({ savedAssets });
    } else {
      res.status(404).json({ message: "User not found or no saved assets." });
    }
  } catch (error) {
    console.error("Error fetching saved assets:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route for saving portfolio data to a user's account
app.post("/save-data-portfolio", async (req, res) => {
  const { email, savedData } = req.body;

  try {
    const userData = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: email });
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prepare the portfolio data to be saved
    const data = {
      asset1Name: savedData.asset1Name,
      asset1Percent: savedData.asset1Percent,
      asset2Name: savedData.asset2Name,
      asset2Percent: savedData.asset2Percent,
      expectedReturn: savedData.expectedReturn,
      risk: savedData.risk,
      bestOutcome: savedData.bestOutcome,
      dateCreated: new Date(savedData.dateCreated),
      dateUpdated: new Date(savedData.dateUpdated),
      startDate: savedData.startDate,
      endDate: savedData.endDate,
      interval: savedData.interval,
    };

    // Function to conditionally add asset3 and asset4 if they exist
    if (savedData.asset3Name && savedData.asset3Percent) {
      data.asset3Name = savedData.asset3Name;
      data.asset3Percent = savedData.asset3Percent;
    }

    if (savedData.asset4Name && savedData.asset4Percent) {
      data.asset4Name = savedData.asset4Name;
      data.asset4Percent = savedData.asset4Percent;
    }

    console.log("Data being saved to database:", data);

    const updateResult = await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email: email }, { $push: { Portfolios: data } });

    if (updateResult.modifiedCount > 0) {
      console.log("Portfolio data updated successfully");
      res.sendStatus(200);
    } else {
      console.log("Portfolio data creation skipped");
      res.sendStatus(204);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for fetching portfolio data for a user
app.post("/get-portfolio-data", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user in the database
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: email });

    // If user exists and has portfolio data, return it
    if (user && user.Portfolios) {
      console.log("Portfolio data fetched successfully");
      res.status(200).json({ portfolioData: user.Portfolios });
    }
  } catch (error) {
    console.error("Error fetching portfolio data:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for deleting a portfolio
app.post("/delete-portfolio", async (req, res) => {
  const { email, portfolioIndex } = req.body;

  try {
    // Find the user in the database
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: email });

    if (!user || !user.Portfolios || user.Portfolios.length <= portfolioIndex) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Remove the portfolio at the specified index
    const updatedPortfolios = user.Portfolios.filter(
      (_, i) => i !== portfolioIndex
    );

    // Update the user's portfolios in the database
    await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email: email }, { $set: { Portfolios: updatedPortfolios } });

    console.log(`Portfolio at index ${portfolioIndex} deleted successfully`);
    res.status(200).json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for deleting a saved asset from a user's account
app.post("/delete-saved-asset", async (req, res) => {
  const { email, assetSymbol } = req.body;

  try {
    // Find the user in the database
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: email });

    // Check if the asset exists
    if (user && user.savedAssets) {
      const existingAsset = user.savedAssets.find(
        (asset) => asset.assetSymbol === assetSymbol
      );

      if (!existingAsset) {
        return res
          .status(404)
          .json({ message: "Asset not found in saved assets." });
      }

      // Remove the specific asset object
      await client
        .db("portfolio_login_db")
        .collection("users")
        .updateOne(
          { email: email },
          { $pull: { savedAssets: { assetSymbol: assetSymbol } } } // Remove matching object
        );

      console.log("Asset deleted successfully");
      res.sendStatus(200);
    } else {
      res.status(404).json({ message: "No saved assets found for the user." });
    }
  } catch (error) {
    console.error("Error deleting asset:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route for saving profile data to a user's account
app.post("/save-data-profile", async (req, res) => {
  const {
    email,
    userData: { firstName, lastName, country, pronoun },
  } = req.body;

  try {
    // Update or create user profile in the database
    const result = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOneAndUpdate(
        { email: email },
        {
          $setOnInsert: {
            email: email,
          },
          $set: {
            firstName: firstName,
            lastName: lastName,
            country: country,
            pronoun: pronoun,
          },
        },
        { upsert: true }
      );

    console.log("Profile updated/created for", email);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for fetching profile data for a user
app.post("/get-profile-data", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user in the database
    const user = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email: email });

    // If user exists, return their data
    if (user) {
      console.log("User data fetched successfully:", user);
      res.status(200).json(user);
    } else {
      console.error("User not found");
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const existingUser = await client
      .db("portfolio_login_db")
      .collection("users")
      .findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "Email is not registered" });
    }

    // Generate a password reset token (valid for 1 hour)
    const resetToken = jwt.sign({ email }, "your_reset_secret", {
      expiresIn: "1h",
    });

    // Save the token to the user's document in the database (optional)
    await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne(
        { email },
        { $set: { resetToken, resetTokenExpiry: Date.now() + 3600000 } } // Token expiry set for 1 hour
      );

    // Send password reset email
    const resetLink = `http://localhost:3000/forgotpasswordchange/${resetToken}`;
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      service: "gmail",
      auth: {
        user: "equifisupp@gmail.com",
        pass: "wsbu fwzm ftpb bqtx",
      },
    });

    const mailOptions = {
      from: "equifisupp@gmail.com",
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <p><a href="${resetLink}">Reset Password</a></p>
             <p>This link will expire in 1 hour.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending password reset email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Password reset email sent:", info.response);
        return res
          .status(200)
          .json({ message: "Password reset email sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error handling forgot-password request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/verify-reset/:token", (req, res) => {
  const token = req.params.token;
  try {
    // Verify the reset token (using your secret and expiration settings)
    jwt.verify(token, "your_reset_secret");
    res.status(200).json({ valid: true });
  } catch (error) {
    res
      .status(400)
      .json({ valid: false, message: "Token is invalid or expired" });
  }
});

app.post("/change-password", async (req, res) => {
  const { password, token } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, "your_reset_secret");
    const email = decoded.email;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password in the database
    await client
      .db("portfolio_login_db")
      .collection("users")
      .updateOne({ email }, { $set: { password: hashedPassword } });

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ success: false, message: "Invalid or expired token." });
  }
});
