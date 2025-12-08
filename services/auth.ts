import { Request, Response } from 'express';
import {
  firebaseHelper,
  logger,
  responseError,
  responseSuccess,
  sendEmail,
  signAccessToken,
  signActivationToken,
  signRefreshToken,
  verifyActivationToken,
  verifyRefreshToken,
} from '../utils/index';
import * as admin from 'firebase-admin';
import { ActiveStatus, Collection, Sites, SitesName, UserRank, UserRole } from '../constants/enum';
import { User } from '../interfaces/user';
import { AuthRequest } from '../interfaces/jwt';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { DEFAULT_AVATAR_URL } from '../constants/constant';
import { ACCESS_TOKEN_EXPIRES } from '../constants/jwt';

const authUrl = `${Sites.TOKYO}/${Collection.AUTH}`;
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const getTokenPath = (uid: string) => {
  const tokenPath = `${userCollection}/${uid}/tokens`;

  return { tokenPath };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, full_name: fullName, phone } = req.body;

    const user = await firebaseHelper.getDocByField(userCollection, 'email', email);
    if (user.length) {
      return responseError(res, StatusCode.ACCOUNT_EMAIL_EXISTS, ErrorMessage.ACCOUNT_EMAIL_EXISTS);
    }

    const authUser = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    const uid = authUser.uid;
    const userData = {
      id: uid,
      email,
      username,
      fullName,
      phone,
      image_urls: [DEFAULT_AVATAR_URL],
      ranks: UserRank.BRONZE,
      points: 0,
      roles: UserRole.USER,
      status: ActiveStatus.INACTIVE,
    };
    const result = await firebaseHelper.createDoc(userCollection, userData);
    if (!result) {
      return responseError(res, StatusCode.CANNOT_CREATE_USER, ErrorMessage.CANNOT_CREATE_USER);
    }

    await sendActivationMail(email, uid, fullName);

    return responseSuccess(res, Message.REGISTER_SUCCESS, userData);
  } catch (err: any) {
    logger.warn(`${ErrorMessage.REGISTER_FAILED} | ${err}`);

    if (err.code?.startsWith('auth/')) {
      return responseError(
        res,
        StatusCode.FIREBASE_AUTH_FAILED,
        `${ErrorMessage.FIREBASE_AUTH_FAILED} | ${err.message}`,
      );
    }

    return responseError(res, StatusCode.REGISTER_FAILED, ErrorMessage.REGISTER_FAILED);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return responseError(res, StatusCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN);
    }

    const idToken = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user: User = await firebaseHelper.getDocById(userCollection, decoded.uid);
    if (!user) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    if (user.status !== ActiveStatus.ACTIVE) {
      return responseError(res, StatusCode.ACCOUNT_INACTIVE, ErrorMessage.ACCOUNT_INACTIVE);
    }

    const payload = {
      uid: user.id,
      email: user.email,
      site: SitesName.TOKYO,
      roles: user.roles,
      permissions: user.permissions || [],
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const { tokenPath } = getTokenPath(user.id);
    await firebaseHelper.createDoc(tokenPath, {
      refreshToken,
      revoked: false,
    });

    return responseSuccess(res, Message.LOGIN_SUCCESS, {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });
  } catch (error: any) {
    logger.warn(`${ErrorMessage.LOGIN_FAILED} | ${error}`);

    if (error.code === 'auth/user-not-found') {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    } else if (error.code?.startsWith('auth/')) {
      return responseError(
        res,
        StatusCode.FIREBASE_AUTH_FAILED,
        `${ErrorMessage.FIREBASE_AUTH_FAILED} | ${error.message}`,
      );
    }

    return responseError(res, StatusCode.LOGIN_FAILED, ErrorMessage.LOGIN_FAILED);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return responseError(
      res,
      StatusCode.REFRESH_TOKEN_REQUIRED,
      ErrorMessage.REFRESH_TOKEN_REQUIRED,
    );
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as any;
    const { uid, siteId } = decoded;
    const userDoc: User = await firebaseHelper.getDocById(userCollection, uid);
    if (!userDoc || userDoc.status !== ActiveStatus.ACTIVE) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    const { tokenPath } = getTokenPath(uid);
    const tokenDoc = await firebaseHelper.getDocsByFields(
      tokenPath,
      [
        { field: 'refreshToken', operator: '==', value: refreshToken },
        { field: 'revoked', operator: '==', value: false },
      ],
      1,
    );
    if (!tokenDoc.length) {
      return responseError(res, StatusCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN);
    }

    const payload = {
      uid,
      email: userDoc.email,
      siteId,
      roles: userDoc.roles,
      permissions: userDoc.permissions || [],
    };
    const newAccessToken = signAccessToken(payload);

    return responseSuccess(res, Message.LOGIN_SUCCESS, {
      accessToken: newAccessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.INVALID_TOKEN} | ${error}`);

    return responseError(res, StatusCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const uid = req.user?.uid!;
  if (!refreshToken) {
    return responseError(
      res,
      StatusCode.REFRESH_TOKEN_REQUIRED,
      ErrorMessage.REFRESH_TOKEN_REQUIRED,
    );
  }

  try {
    const { tokenPath } = getTokenPath(uid);
    const tokens = await firebaseHelper.getDocsByFields(tokenPath, [
      { field: 'refreshToken', operator: '==', value: refreshToken },
      { field: 'revoked', operator: '==', value: false },
    ]);
    if (!tokens.length) {
      return responseError(res, StatusCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN);
    }

    await firebaseHelper.updateBatchDocs(userCollection, tokens);

    return responseSuccess(res, Message.LOGOUT_SUCCESS);
  } catch (error) {
    logger.warn(`${ErrorMessage.INVALID_TOKEN} | ${error}`);

    return responseError(res, StatusCode.LOGOUT_FAILED, ErrorMessage.LOGOUT_FAILED);
  }
};

const sendActivationMail = async (email: string, uid: string, fullName: string = 'User') => {
  if (!email) throw new Error(ErrorMessage.NO_RECIPIENT_EMAILS);

  const token = signActivationToken({ uid });
  const activationUrl = `${process.env.BE_URL}/${authUrl}/activate?token=${token}`;
  const subject = 'Activate Your Account';
  const html = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px; color:#333;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:24px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      
      <h2 style="color:#1976d2; margin-bottom:10px;">Welcome, ${fullName}!</h2>
      <p style="line-height:1.6; font-size:15px; margin-bottom:20px;">
        Your account was created successfully.  
        Click the button below to activate your account.
      </p>

      <a href="${activationUrl}" 
         style="display:inline-block; padding:12px 20px; background:#1976d2; color:#fff; 
                text-decoration:none; border-radius:6px; font-weight:bold;">
        Activate Account
      </a>

      <p style="margin-top:20px; font-size:14px; color:#666;">
        Or open this link:<br/>
        <a href="${activationUrl}" style="color:#1976d2;">${activationUrl}</a>
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />

      <p style="font-size:12px; color:#999;">
        This is an automated email. Do not reply.
      </p>
    </div>
  </div>
  `;

  try {
    await sendEmail(email, subject, html);
  } catch (error) {
    logger.error(`${ErrorMessage.SEND_ACTIVATION_MAIL_FAILED} | ${error}`);

    throw new Error(ErrorMessage.SEND_ACTIVATION_MAIL_FAILED);
  }
};

export const activateAccount = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send('<h1>Activation token missing</h1>');
    }

    const payload = verifyActivationToken(token) as { uid: string };
    const user: User = await firebaseHelper.getDocById(userCollection, payload.uid);
    if (!user) {
      return res.status(404).send('<h1>User not found</h1>');
    }

    if (user.status === ActiveStatus.ACTIVE) {
      return res.send('<h1>Your account is already activated</h1>');
    }

    await firebaseHelper.updateDoc(userCollection, payload.uid, {
      status: ActiveStatus.ACTIVE,
    });

    return res.send('<h1>Account activated successfully</h1>');
  } catch (err) {
    return res.status(400).send('<h1>Invalid or expired activation link</h1>');
  }
};
