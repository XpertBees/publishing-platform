import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { ApiError } from "../utils/errors";
import { serializeUser } from "../utils/serializers";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AuthUser,
} from "../middleware/auth";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
}

function toAuthUser(user: User): AuthUser {
  return { email: user.email, id: user.id, role: user.role };
}

function issueTokens(user: User): TokenPair {
  const authUser = toAuthUser(user);
  return {
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
    user: serializeUser(user.get({ plain: true })),
  };
}

/**
 * AuthService. Registration is DISABLED by design — the only way to create
 * the first account is the seed script (`npm run seed`); further users are
 * created by a super_admin via POST /users. POST /auth/register always 403s.
 */
export const AuthService = {
  async login(email: string, password: string): Promise<TokenPair> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    if (!user.isActive) throw new ApiError(403, "ACCOUNT_DISABLED", "This account is disabled.");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    return issueTokens(user);
  },

  /** Refresh-token rotation: verify the refresh token, issue a fresh pair. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.sub);
    if (!user)
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    if (!user.isActive) throw new ApiError(403, "ACCOUNT_DISABLED", "This account is disabled.");
    return issueTokens(user);
  },

  async me(userId: string): Promise<Record<string, unknown>> {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    return serializeUser(user.get({ plain: true }));
  },

  registerDisabled(): never {
    throw new ApiError(
      403,
      "REGISTRATION_DISABLED",
      "Public registration is disabled. Accounts are created by the seed script or a super_admin.",
    );
  },
};
