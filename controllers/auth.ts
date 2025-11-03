import { Request, Response } from 'express';
import { db, firebaseHelper } from '../utils/index';
import bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { ActiveStatus, Sites, SitesName } from '../constants/enum';
import { getDocById } from '../utils/firebaseHelper';
import { User } from '../interfaces/user';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const register = async (req: Request, res: Response) => {
  const {
    email,
    password,
    username,
    fullName,
    phone,
    avatar_url,
    ranks,
    points,
    roles,
    permissions,
  } = req.body;
  let uid: string;
  let authUser: admin.auth.UserRecord | null = null;

  try {
    if (password) {
      authUser = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
      });
      uid = authUser.uid;
    } else {
      const tempUser = await admin.auth().createUser({ email });
      uid = tempUser.uid;
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const userData = {
      id: uid,
      uid,
      email,
      username,
      password: hashedPassword,
      fullName,
      phone,
      avatar_url: avatar_url || null,
      ranks: ranks || null,
      points: points ?? 0,
      roles: roles,
      permissions: permissions || [],
      status: ActiveStatus.INACTIVE,
      updated_at: null,
      updated_by: null,
    };
    const result = await firebaseHelper.createDoc(`${Sites.TOKYO}/users`, userData);
    if (!result) {
      res.status(400).json({
        status: false,
        message: 'Create user failed.',
      });
      return;
    }
    const { password: _, ...safeUser } = userData;
    return res.status(201).json({
      success: true,
      message: 'Register successfully',
      data: safeUser,
    });
  } catch (err: any) {
    if (err.code?.startsWith('auth/')) {
      res.status(400).json({
        success: false,
        message: '[User][Create] Firebase Auth error!',
      });
    }
    res.status(400).json({
      success: false,
      message: '[User][Create] Request failed!',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const userDoc = (await getDocById(`${Sites.TOKYO}/users`, userRecord.uid)) as User;
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this site',
      });
    }

    if (userDoc.status !== ActiveStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive or banned',
      });
    }

    const payload = {
      uid: userRecord.uid,
      email: userRecord.email,
      site: SitesName.TOKYO,
      roles: userDoc.roles,
      permissions: userDoc.permissions || [],
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await db.collection(`${Sites.TOKYO}/users/${userRecord.uid}/tokens`).add({
      refreshToken,
      created_at: admin.firestore.Timestamp.now(),
      revoked: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          site: SitesName.TOKYO,
          roles: userDoc.roles,
          permissions: userDoc.permissions,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: '[User][Login] Request failed!',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'refreshToken required' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as any;
    const { uid, siteId } = decoded;
    const userDoc = (await getDocById(`${Sites.TOKYO}/users`, uid)) as User;
    if (!userDoc || userDoc.status !== ActiveStatus.ACTIVE) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
    const payload = {
      uid,
      email: userDoc.email,
      siteId,
      roles: userDoc.roles,
      permissions: userDoc.permissions || [],
    };
    const newAccessToken = signAccessToken(payload);
    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60,
      },
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};
