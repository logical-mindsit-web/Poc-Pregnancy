import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET
export const JwtToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, name:user.name, motherId:user.motherId}, JWT_SECRET, { expiresIn: '5d' });
};