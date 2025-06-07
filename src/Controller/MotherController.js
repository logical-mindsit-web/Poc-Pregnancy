import Mother from "../Model/MotherModel.js";
import bcrypt from "bcrypt";
import { JwtToken } from "../Utils/JwtToken.js";

export const registerMother = async (req, res) => {
  try {
    const { name, motherId, email, mobilenumber, password, conformpassword } =
      req.body;

    if (password !== conformpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const mother = new Mother({
      name,
      motherId,
      email,
      mobilenumber,
      password: hashedPassword,
      conformpassword: hashedPassword,
    });

    await mother.save();

    res.status(201).json({ message: "Mother registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginMother = async (req, res) => {
  try {
    const { motherId, password } = req.body;
    const mother = await Mother.findOne({ motherId });

    if (!mother) {
      return res.status(404).json({ message: "Mother not found" });
    }

    const isMatch = await bcrypt.compare(password, mother.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = JwtToken(mother);

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

