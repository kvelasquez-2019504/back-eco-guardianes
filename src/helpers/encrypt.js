import bcrypt from 'bcrypt';

export const encryptPassword = async (password) => {
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    return await bcrypt.hash(password, saltRounds);
};

export const isValidPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
